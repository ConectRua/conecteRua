import crypto from 'crypto';
import { IStorage } from '../storage';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  endereco: string;
  cep: string;
}

export interface GeocodeResult {
  address: Address;
  coordinates: Coordinates | null;
  source: 'google' | 'viacep' | 'cache' | 'error';
  error?: string;
}

/**
 * Serviço de geocodificação que utiliza Google Geocoding API como fonte principal
 * e ViaCEP como etapa inicial para CEPs brasileiros.
 * Implementa cache persistente no banco de dados e rate limiting para evitar bloqueio das APIs.
 */
export class GeocodingService {
  private memoryCache = new Map<string, GeocodeResult>();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1100; // 1.1 segundos entre requisições (respeitando limite Nominatim)
  
  constructor(private storage: IStorage) {
    // Agora usa o storage para cache persistente no banco e rate limiting
  }

  /**
   * Processa a fila de requisições com rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) break;
      
      // Garantir intervalo mínimo entre requisições
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await this.delay(this.minRequestInterval - timeSinceLastRequest);
      }
      
      try {
        await request();
      } catch (error) {
        console.warn('Erro ao processar requisição da fila:', error);
      }
      
      this.lastRequestTime = Date.now();
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Adiciona requisição à fila com rate limiting
   */
  private queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      this.requestQueue.push(wrappedRequest);
      this.processQueue();
    });
  }

  /**
   * Faz requisição HTTP com timeout usando AbortController
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 8000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout após ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * Geocodifica um endereço usando Google Geocoding, com enriquecimento via ViaCEP
   */
  async geocodeAddress(endereco: string, cep: string): Promise<GeocodeResult> {
    const address: Address = { endereco, cep };
    const cacheKey = this.generateCacheKey(address);
    
    // Verificar cache em memória primeiro
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }
    
    // Verificar cache do banco de dados
    try {
      const cached = await this.storage.getGeocodingCache(cacheKey);
      if (cached) {
        const cachedResult: GeocodeResult = {
          address,
          coordinates: cached.latitude && cached.longitude ? {
            latitude: cached.latitude,
            longitude: cached.longitude
          } : null,
          source: 'cache',
          error: cached.errorMessage || undefined
        };
        
        // Adicionar ao cache em memória para próximas consultas
        this.memoryCache.set(cacheKey, cachedResult);
        return cachedResult;
      }
    } catch (error) {
      console.warn('Erro ao consultar cache de geocodificação:', error);
    }
    
    try {
      // 1. Buscar informações do CEP no ViaCEP para enriquecer o endereço
      let enrichedAddress = endereco;
      let bairroFromCEP: string | null = null;
      
      if (cep) {
        try {
          const cleanCep = cep.replace(/\D/g, '');
          if (cleanCep.length === 8) {
            const viacepUrl = `https://viacep.com.br/ws/${cleanCep}/json/`;
            const viacepResponse = await this.fetchWithTimeout(viacepUrl, {}, 5000);
            
            if (viacepResponse.ok) {
              const viacepData = await viacepResponse.json();
              if (viacepData && !viacepData.erro) {
                bairroFromCEP = viacepData.bairro;
                
                // Enriquecer endereço com informações do ViaCEP se bairro não estiver presente
                if (bairroFromCEP && !endereco.toLowerCase().includes(bairroFromCEP.toLowerCase())) {
                  enrichedAddress = `${endereco}, ${bairroFromCEP}`;
                }
              }
            }
          }
        } catch (error) {
          console.warn('Erro ao buscar CEP no ViaCEP:', error);
        }
      }
      
      // 2. Tentar Google Geocoding com endereço enriquecido
      const googleResult = await this.tryGoogleGeocoding(enrichedAddress, cep, bairroFromCEP);
      if (googleResult.coordinates) {
        await this.saveToCaches(cacheKey, address, googleResult);
        return googleResult;
      }
      
      // 3. Fallback para ViaCEP + Google se geocoding direto falhar
      const viacepResult = await this.tryViaCEP(cep);
      if (viacepResult.coordinates) {
        await this.saveToCaches(cacheKey, address, viacepResult);
        return viacepResult;
      }
      
      // 3. Se ambos falharem, ainda salvar no cache para evitar consultas repetidas
      const errorResult: GeocodeResult = {
        address,
        coordinates: null,
        source: 'error',
        error: 'Não foi possível geocodificar o endereço'
      };
      
      await this.saveToCaches(cacheKey, address, errorResult);
      return errorResult;
      
    } catch (error) {
      const errorResult: GeocodeResult = {
        address,
        coordinates: null,
        source: 'error',
        error: `Erro na geocodificação: ${error.message}`
      };
      
      return errorResult;
    }
  }

  /**
   * Geocodificação em lote para importação de planilhas
   */
  async batchGeocode(addresses: Address[]): Promise<GeocodeResult[]> {
    const results: GeocodeResult[] = [];
    
    // Processar em lotes de 10 para não sobrecarregar as APIs
    const batchSize = 10;
    
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (address) => {
        // Delay pequeno entre chamadas para respeitar rate limits
        await this.delay(200);
        return this.geocodeAddress(address.endereco, address.cep);
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            address: batch[index],
            coordinates: null,
            source: 'error',
            error: `Erro no processamento: ${result.reason}`
          });
        }
      });
    }
    
    return results;
  }

  /**
   * Tenta geocodificar usando a API do Google Geocoding com rate limiting
   */
  private async tryGoogleGeocoding(endereco: string, cep: string, bairroEsperado?: string | null): Promise<GeocodeResult> {
    const address: Address = { endereco, cep };
    
    return this.queueRequest(async () => {
      try {
        // Obter chave do Google Maps API
        const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key não configurada');
        }
        
        // Construir query de busca otimizada para Brasil com contexto geográfico
        const query = `${endereco}, Brasília - DF, Brasil`;
        const encodedQuery = encodeURIComponent(query);
        
        // Usar components para restringir a busca ao DF e Brasília
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&components=administrative_area:DF|locality:Brasília&key=${apiKey}&region=br&language=pt-BR`;
        
        const response = await this.fetchWithTimeout(url, {}, 8000);
        
        if (!response.ok) {
          throw new Error(`Google Geocoding API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          // Tentar encontrar resultado mais preciso E correto
          let result = data.results[0];
          
          // Primeiro, tentar encontrar resultado com o CEP exato
          for (const r of data.results) {
            const postalCode = r.address_components?.find(c => c.types.includes('postal_code'));
            if (postalCode && cep && postalCode.long_name.replace(/\D/g, '') === cep.replace(/\D/g, '')) {
              result = r;
              break;
            }
          }
          
          // Se não encontrou pelo CEP exato, tentar pelo bairro esperado
          if (result === data.results[0] && bairroEsperado && data.results.length > 1) {
            for (const r of data.results) {
              const bairroComponents = r.address_components?.filter(c => 
                c.types.includes('administrative_area_level_4') || 
                c.types.includes('sublocality') ||
                c.types.includes('sublocality_level_1')
              );
              
              if (bairroComponents) {
                for (const comp of bairroComponents) {
                  if (comp.long_name.toLowerCase().includes(bairroEsperado.toLowerCase()) ||
                      bairroEsperado.toLowerCase().includes(comp.long_name.toLowerCase())) {
                    result = r;
                    break;
                  }
                }
                if (result !== data.results[0]) break;
              }
            }
          }
          
          // Se ainda não encontrou, priorizar resultado mais preciso (ROOFTOP ou RANGE_INTERPOLATED)
          // mas verificando se o CEP está próximo
          if (result === data.results[0] && data.results.length > 1) {
            for (const r of data.results) {
              if (r.geometry.location_type === 'ROOFTOP' || r.geometry.location_type === 'RANGE_INTERPOLATED') {
                const postalCode = r.address_components?.find(c => c.types.includes('postal_code'));
                // Só usar se o CEP for próximo (primeiros 5 dígitos)
                if (postalCode && cep) {
                  const cleanCep = cep.replace(/\D/g, '');
                  const resultCep = postalCode.long_name.replace(/\D/g, '');
                  if (cleanCep.substring(0, 5) === resultCep.substring(0, 5)) {
                    result = r;
                    break;
                  }
                }
              }
            }
          }
          
          const location = result.geometry.location;
          
          const coordinates: Coordinates = {
            latitude: location.lat,
            longitude: location.lng
          };
          
          return {
            address,
            coordinates,
            source: 'google'
          };
        }
        
        return {
          address,
          coordinates: null,
          source: 'google',
          error: 'Endereço não encontrado no Google Maps'
        };
        
      } catch (error) {
        return {
          address,
          coordinates: null,
          source: 'google',
          error: `Erro Google Geocoding: ${error.message}`
        };
      }
    });
  }

  /**
   * Tenta geocodificar usando a API do ViaCEP (sem fila para evitar deadlock)
   */
  private async tryViaCEP(cep: string): Promise<GeocodeResult> {
    const address: Address = { endereco: '', cep };
    
    try {
      // Limpar CEP (remover hífen e espaços)
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        return {
          address,
          coordinates: null,
          source: 'viacep',
          error: 'CEP inválido para ViaCEP'
        };
      }
      
      const url = `https://viacep.com.br/ws/${cleanCep}/json/`;
      
      const response = await this.fetchWithTimeout(url, {}, 5000);
      
      if (!response.ok) {
        throw new Error(`ViaCEP API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && !data.erro) {
        // ViaCEP não retorna coordenadas exatas, então vamos usar Google Geocoding
        // com o endereço completo retornado pelo ViaCEP com contexto geográfico
        const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}, Brasil`;
        
        try {
          const googleResult = await this.tryGoogleGeocoding(fullAddress, cleanCep);
          if (googleResult.coordinates) {
            return {
              address: { endereco: fullAddress, cep },
              coordinates: googleResult.coordinates,
              source: 'viacep'
            };
          }
        } catch {
          // Se Google Geocoding falhar, retornar erro
          // Em produção, seria interessante ter um fallback adicional
        }
        
        return {
          address,
          coordinates: null,
          source: 'viacep',
          error: 'CEP encontrado mas não foi possível obter coordenadas exatas'
        };
      }
      
      return {
        address,
        coordinates: null,
        source: 'viacep',
        error: 'CEP não encontrado no ViaCEP'
      };
      
    } catch (error) {
      return {
        address,
        coordinates: null,
        source: 'viacep',
        error: `Erro ViaCEP: ${error.message}`
      };
    }
  }

  /**
   * Gera chave de cache baseada no endereço
   */
  private generateCacheKey(address: Address): string {
    const text = `${address.endereco}|${address.cep}`.toLowerCase().trim();
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * Delay entre chamadas para respeitar rate limits
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Salva resultado nos caches (memória e banco de dados)
   */
  private async saveToCaches(cacheKey: string, address: Address, result: GeocodeResult): Promise<void> {
    // Salvar no cache em memória
    this.memoryCache.set(cacheKey, result);
    
    // Salvar no cache do banco de dados
    try {
      await this.storage.setGeocodingCache({
        addressHash: cacheKey,
        address: `${address.endereco}, ${address.cep}`,
        cep: address.cep,
        latitude: result.coordinates?.latitude || null,
        longitude: result.coordinates?.longitude || null,
        source: result.source,
        errorMessage: result.error || null
      });
    } catch (error) {
      console.warn('Erro ao salvar no cache de geocodificação:', error);
    }
  }

  /**
   * Reverse geocoding: busca endereço e CEP a partir de coordenadas
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<{
    endereco: string;
    cep: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  } | null> {
    const cacheKey = `reverse_${latitude.toFixed(6)}_${longitude.toFixed(6)}`;
    
    // Verificar cache em memória primeiro
    const cachedMemory = this.memoryCache.get(cacheKey);
    if (cachedMemory && cachedMemory.source === 'cache') {
      const cached = cachedMemory as any;
      if (cached.reverseData) {
        return cached.reverseData;
      }
    }
    
    // Verificar cache do banco de dados
    try {
      const cached = await this.storage.getGeocodingCache(cacheKey);
      if (cached && cached.source !== 'error') {
        const result = {
          endereco: cached.address || '',
          cep: cached.cep || '',
          bairro: '',
          cidade: '',
          estado: ''
        };
        
        // Adicionar ao cache em memória
        this.memoryCache.set(cacheKey, {
          address: { endereco: result.endereco, cep: result.cep },
          coordinates: null,
          source: 'cache',
          reverseData: result
        } as any);
        
        return result;
      }
    } catch (error) {
      console.warn('Erro ao consultar cache de reverse geocoding:', error);
    }
    
    return this.queueRequest(async () => {
      try {
        // Obter chave do Google Maps API
        const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key não configurada');
        }
        
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=pt-BR&region=br`;
        
        const response = await this.fetchWithTimeout(url, {}, 8000);
        
        if (!response.ok) {
          throw new Error(`Google reverse geocoding API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          const components = result.address_components || [];
          
          // Extrair informações do endereço
          let cep = '';
          let bairro = '';
          let cidade = '';
          let estado = '';
          let rua = '';
          let numero = '';
          
          components.forEach((comp: any) => {
            const types = comp.types || [];
            
            if (types.includes('postal_code')) {
              cep = comp.long_name;
            } else if (types.includes('neighborhood') || types.includes('sublocality')) {
              bairro = comp.long_name;
            } else if (types.includes('administrative_area_level_2') || types.includes('locality')) {
              cidade = comp.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              estado = comp.short_name;
            } else if (types.includes('route')) {
              rua = comp.long_name;
            } else if (types.includes('street_number')) {
              numero = comp.long_name;
            }
          });
          
          // Construir endereço completo
          const parts: string[] = [];
          if (rua) parts.push(rua);
          if (numero) parts.push(numero);
          if (bairro) parts.push(bairro);
          
          const endereco = parts.length > 0 ? parts.join(', ') : result.formatted_address;
          
          const resultData = {
            endereco,
            cep: cep || '',
            bairro: bairro || '',
            cidade: cidade || '',
            estado: estado || ''
          };
          
          // Salvar nos caches
          this.memoryCache.set(cacheKey, {
            address: { endereco: resultData.endereco, cep: resultData.cep },
            coordinates: null,
            source: 'cache',
            reverseData: resultData
          } as any);
          
          // Salvar no banco de dados
          try {
            await this.storage.setGeocodingCache({
              addressHash: cacheKey,
              address: endereco,
              cep: cep || '00000-000',
              latitude: latitude,
              longitude: longitude,
              source: 'google',
              errorMessage: null
            });
          } catch (error) {
            console.warn('Erro ao salvar no cache de reverse geocoding:', error);
          }
          
          return resultData;
        }
        
        // Salvar erro no cache para evitar requisições repetidas
        try {
          await this.storage.setGeocodingCache({
            addressHash: cacheKey,
            address: '',
            cep: '00000-000',
            latitude: latitude,
            longitude: longitude,
            source: 'error',
            errorMessage: 'Endereço não encontrado'
          });
        } catch (error) {
          console.warn('Erro ao salvar erro no cache:', error);
        }
        
        return null;
      } catch (error) {
        console.warn('Erro no reverse geocoding:', error);
        return null;
      }
    });
  }

  /**
   * Limpa o cache em memória (útil para testes)
   */
  clearCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats() {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys())
    };
  }

  /**
   * Limpa cache antigo do banco de dados
   */
  async clearOldCache(daysOld: number = 30): Promise<number> {
    try {
      return await this.storage.clearOldGeocodingCache(daysOld);
    } catch (error) {
      console.warn('Erro ao limpar cache antigo:', error);
      return 0;
    }
  }
}

// Factory function para criar instância do serviço com storage
export function createGeocodingService(storage: IStorage): GeocodingService {
  return new GeocodingService(storage);
}