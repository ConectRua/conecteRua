import crypto from 'crypto';

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
  source: 'nominatim' | 'viacep' | 'cache' | 'error';
  error?: string;
}

/**
 * Serviço de geocodificação que utiliza Nominatim (OpenStreetMap) como fonte principal
 * e ViaCEP como fallback para CEPs brasileiros.
 * Implementa cache para evitar chamadas repetidas às APIs.
 */
export class GeocodingService {
  private cache = new Map<string, GeocodeResult>();
  
  constructor() {
    // Constructor vazio - o cache será implementado na próxima tarefa
  }

  /**
   * Geocodifica um endereço usando Nominatim e ViaCEP como fallback
   */
  async geocodeAddress(endereco: string, cep: string): Promise<GeocodeResult> {
    const address: Address = { endereco, cep };
    const cacheKey = this.generateCacheKey(address);
    
    // Verificar cache em memória primeiro
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    try {
      // 1. Tentar Nominatim primeiro
      const nominatimResult = await this.tryNominatim(endereco, cep);
      if (nominatimResult.coordinates) {
        this.cache.set(cacheKey, nominatimResult);
        return nominatimResult;
      }
      
      // 2. Fallback para ViaCEP se Nominatim falhar
      const viacepResult = await this.tryViaCEP(cep);
      if (viacepResult.coordinates) {
        this.cache.set(cacheKey, viacepResult);
        return viacepResult;
      }
      
      // 3. Se ambos falharem
      const errorResult: GeocodeResult = {
        address,
        coordinates: null,
        source: 'error',
        error: 'Não foi possível geocodificar o endereço'
      };
      
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
   * Tenta geocodificar usando a API do Nominatim (OpenStreetMap)
   */
  private async tryNominatim(endereco: string, cep: string): Promise<GeocodeResult> {
    const address: Address = { endereco, cep };
    
    try {
      // Construir query de busca otimizada para Brasil
      const query = `${endereco}, ${cep}, Brasil`;
      const encodedQuery = encodeURIComponent(query);
      
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=br&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Georeferenciamento-Saude-DF/1.0 (https://geosaude.replit.app)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const coordinates: Coordinates = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        };
        
        return {
          address,
          coordinates,
          source: 'nominatim'
        };
      }
      
      return {
        address,
        coordinates: null,
        source: 'nominatim',
        error: 'Endereço não encontrado no Nominatim'
      };
      
    } catch (error) {
      return {
        address,
        coordinates: null,
        source: 'nominatim',
        error: `Erro Nominatim: ${error.message}`
      };
    }
  }

  /**
   * Tenta geocodificar usando a API do ViaCEP
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
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`ViaCEP API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && !data.erro) {
        // ViaCEP não retorna coordenadas exatas, então vamos tentar Nominatim novamente
        // com o endereço completo retornado pelo ViaCEP
        const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`;
        
        try {
          const nominatimResult = await this.tryNominatim(fullAddress, cleanCep);
          if (nominatimResult.coordinates) {
            return {
              address: { endereco: fullAddress, cep },
              coordinates: nominatimResult.coordinates,
              source: 'viacep'
            };
          }
        } catch {
          // Se Nominatim falhar, usar coordenadas aproximadas da cidade
          // Para simplificar, vamos usar coordenadas do centro de Brasília
          // Em produção, seria interessante ter um banco de coordenadas por cidade
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
   * Limpa o cache em memória (útil para testes)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância singleton do serviço
export const geocodingService = new GeocodingService();