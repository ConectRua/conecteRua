import { Client } from '@googlemaps/google-maps-services-js';

interface PlaceSearchResult {
  found: boolean;
  confidence: number; // 0-100
  source: 'google' | 'geocoding' | 'manual';
  googlePlaceId?: string;
  nome: string;
  endereco: string;
  cep?: string;
  latitude: number;
  longitude: number;
  telefone?: string;
  horarioFuncionamento?: string;
  website?: string;
  matchDetails?: {
    nameMatch: boolean;
    addressMatch: boolean;
    cepMatch: boolean;
    phoneMatch: boolean;
    distance?: number;
  };
}

interface EstablishmentData {
  nome: string;
  tipo?: string;
  endereco?: string;
  cep?: string;
  telefone?: string;
  latitude?: number;
  longitude?: number;
}

export class GooglePlacesService {
  private client: Client;
  private apiKey: string;

  constructor(apiKey: string) {
    this.client = new Client({});
    this.apiKey = apiKey;
  }

  // Função principal para buscar e fazer match de estabelecimentos
  async findAndMatchPlace(data: EstablishmentData): Promise<PlaceSearchResult> {
    try {
      // Tentar diferentes estratégias de busca
      let result = await this.searchByNameAndAddress(data);
      
      if (!result.found || result.confidence < 70) {
        // Tentar busca por proximidade se tiver coordenadas
        if (data.latitude && data.longitude) {
          const nearbyResult = await this.searchNearby(data);
          if (nearbyResult.confidence > result.confidence) {
            result = nearbyResult;
          }
        }
      }

      if (!result.found || result.confidence < 50) {
        // Fallback para geocodificação simples
        result = await this.geocodeAddress(data);
      }

      return result;
    } catch (error) {
      console.error('Erro na busca do Google Places:', error);
      return this.createManualResult(data);
    }
  }

  // Busca por nome e endereço
  private async searchByNameAndAddress(data: EstablishmentData): Promise<PlaceSearchResult> {
    try {
      // Construir query inteligente
      const query = this.buildSearchQuery(data);
      
      const response = await this.client.findPlaceFromText({
        params: {
          input: query,
          inputtype: 'textquery' as any,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'formatted_phone_number',
            'opening_hours',
            'website',
            'types'
          ] as any,
          language: 'pt-BR' as any,
          key: this.apiKey
        },
        timeout: 5000
      });

      if (response.data.candidates && response.data.candidates.length > 0) {
        const place = response.data.candidates[0];
        
        // Buscar detalhes completos do lugar
        const details = await this.getPlaceDetails(place.place_id!);
        
        // Calcular confiança do match
        const confidence = this.calculateConfidence(data, details);
        
        if (confidence > 50) {
          return this.createGoogleResult(details, confidence, data);
        }
      }
    } catch (error) {
      console.warn('Erro na busca por texto:', error);
    }

    return this.createNotFoundResult(data);
  }

  // Busca por proximidade
  private async searchNearby(data: EstablishmentData): Promise<PlaceSearchResult> {
    if (!data.latitude || !data.longitude) {
      return this.createNotFoundResult(data);
    }

    try {
      const response = await this.client.placesNearby({
        params: {
          location: {
            lat: data.latitude,
            lng: data.longitude
          },
          radius: 500, // 500 metros de raio
          keyword: data.nome,
          language: 'pt-BR' as any,
          key: this.apiKey
        },
        timeout: 5000
      });

      if (response.data.results && response.data.results.length > 0) {
        // Encontrar melhor match
        let bestMatch = null;
        let bestConfidence = 0;

        for (const place of response.data.results) {
          const details = await this.getPlaceDetails(place.place_id!);
          const confidence = this.calculateConfidence(data, details);
          
          if (confidence > bestConfidence) {
            bestMatch = details;
            bestConfidence = confidence;
          }
        }

        if (bestMatch && bestConfidence > 50) {
          return this.createGoogleResult(bestMatch, bestConfidence, data);
        }
      }
    } catch (error) {
      console.warn('Erro na busca por proximidade:', error);
    }

    return this.createNotFoundResult(data);
  }

  // Geocodificação de endereço como fallback
  private async geocodeAddress(data: EstablishmentData): Promise<PlaceSearchResult> {
    if (!data.endereco) {
      return this.createManualResult(data);
    }

    try {
      const address = `${data.endereco}, ${data.cep || ''}, Brasil`.trim();
      
      const response = await this.client.geocode({
        params: {
          address,
          language: 'pt-BR',
          key: this.apiKey
        },
        timeout: 5000
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        return {
          found: true,
          confidence: 40, // Baixa confiança pois é só geocodificação
          source: 'geocoding',
          nome: data.nome,
          endereco: result.formatted_address,
          cep: this.extractCEP(result) || data.cep,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          telefone: data.telefone,
          matchDetails: {
            nameMatch: false,
            addressMatch: true,
            cepMatch: false,
            phoneMatch: false
          }
        };
      }
    } catch (error) {
      console.warn('Erro na geocodificação:', error);
    }

    return this.createManualResult(data);
  }

  // Buscar detalhes completos de um lugar
  private async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'address_components',
            'geometry',
            'formatted_phone_number',
            'international_phone_number',
            'opening_hours',
            'website',
            'types'
          ],
          language: 'pt-BR' as any,
          key: this.apiKey
        },
        timeout: 5000
      });

      return response.data.result;
    } catch (error) {
      console.error('Erro ao buscar detalhes do lugar:', error);
      return null;
    }
  }

  // Construir query de busca otimizada
  private buildSearchQuery(data: EstablishmentData): string {
    const parts: string[] = [];
    
    // Nome é o mais importante
    if (data.nome) {
      parts.push(data.nome);
    }
    
    // Adicionar tipo se relevante
    if (data.tipo && !data.nome?.toLowerCase().includes(data.tipo.toLowerCase())) {
      parts.push(data.tipo);
    }
    
    // Adicionar localização
    if (data.endereco) {
      // Simplificar endereço para bairro/região principal
      const simplifiedAddress = this.simplifyAddress(data.endereco);
      if (simplifiedAddress) {
        parts.push(simplifiedAddress);
      }
    } else if (data.cep) {
      parts.push(data.cep);
    }
    
    // Adicionar contexto de região
    parts.push('Brasília DF');
    
    return parts.join(' ');
  }

  // Simplificar endereço para busca
  private simplifyAddress(address: string): string {
    // Extrair bairro/região principal
    const patterns = [
      /samambaia/i,
      /recanto das emas/i,
      /águas claras/i,
      /taguatinga/i,
      /ceilândia/i,
      /plano piloto/i,
      /asa norte/i,
      /asa sul/i
    ];

    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match) {
        return match[0];
      }
    }

    // Tentar extrair quadra
    const quadraMatch = address.match(/q[ru]?\s*\d+/i);
    if (quadraMatch) {
      return quadraMatch[0];
    }

    return '';
  }

  // Calcular confiança do match
  private calculateConfidence(data: EstablishmentData, place: any): number {
    if (!place) return 0;

    let score = 0;
    const matchDetails: any = {};

    // Nome (40 pontos)
    if (data.nome && place.name) {
      const similarity = this.calculateStringSimilarity(
        this.normalizeString(data.nome),
        this.normalizeString(place.name)
      );
      score += similarity * 40;
      matchDetails.nameMatch = similarity > 0.7;
    }

    // Endereço (30 pontos)
    if (data.endereco && place.formatted_address) {
      const addressSimilarity = this.calculateAddressSimilarity(
        data.endereco,
        place.formatted_address
      );
      score += addressSimilarity * 30;
      matchDetails.addressMatch = addressSimilarity > 0.6;
    }

    // CEP (20 pontos)
    if (data.cep) {
      const placeCEP = this.extractCEP(place);
      if (placeCEP) {
        const cepMatch = this.normalizeCEP(data.cep) === this.normalizeCEP(placeCEP);
        if (cepMatch) {
          score += 20;
          matchDetails.cepMatch = true;
        }
      }
    }

    // Telefone (10 pontos)
    if (data.telefone && place.formatted_phone_number) {
      const phoneMatch = this.normalizePhone(data.telefone) === 
                        this.normalizePhone(place.formatted_phone_number);
      if (phoneMatch) {
        score += 10;
        matchDetails.phoneMatch = true;
      }
    }

    // Distância (se tiver coordenadas)
    if (data.latitude && data.longitude && place.geometry?.location) {
      const distance = this.calculateDistance(
        data.latitude,
        data.longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      );
      matchDetails.distance = distance;
      
      // Penalizar se muito longe
      if (distance > 1000) { // Mais de 1km
        score *= 0.7;
      }
    }

    return Math.min(100, Math.round(score));
  }

  // Calcular similaridade entre strings
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Distância de Levenshtein
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Calcular similaridade de endereços
  private calculateAddressSimilarity(addr1: string, addr2: string): number {
    const normalized1 = this.normalizeString(addr1);
    const normalized2 = this.normalizeString(addr2);
    
    // Verificar componentes principais
    const components = ['samambaia', 'recanto', 'aguas claras', 'qr', 'qnr', 'quadra'];
    let matchCount = 0;
    let totalComponents = 0;

    for (const component of components) {
      if (normalized1.includes(component) || normalized2.includes(component)) {
        totalComponents++;
        if (normalized1.includes(component) && normalized2.includes(component)) {
          matchCount++;
        }
      }
    }

    if (totalComponents === 0) return 0.5;
    return matchCount / totalComponents;
  }

  // Calcular distância em metros
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Normalizar string para comparação
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Normalizar CEP
  private normalizeCEP(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  // Normalizar telefone
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^55/, '');
  }

  // Extrair CEP dos componentes de endereço
  private extractCEP(place: any): string | null {
    if (!place.address_components) return null;

    for (const component of place.address_components) {
      if (component.types.includes('postal_code')) {
        return component.long_name;
      }
    }

    return null;
  }

  // Extrair horário de funcionamento
  private extractOpeningHours(place: any): string | null {
    if (!place.opening_hours?.weekday_text) return null;

    // Pegar horário de segunda-feira como padrão
    const monday = place.opening_hours.weekday_text.find(
      (text: string) => text.toLowerCase().includes('segunda') || 
                       text.toLowerCase().includes('monday')
    );

    if (monday) {
      const match = monday.match(/\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/);
      if (match) {
        return match[0].replace(/[–]/g, '-');
      }
    }

    return null;
  }

  // Criar resultado do Google
  private createGoogleResult(place: any, confidence: number, originalData: EstablishmentData): PlaceSearchResult {
    return {
      found: true,
      confidence,
      source: 'google',
      googlePlaceId: place.place_id,
      nome: place.name || originalData.nome,
      endereco: place.formatted_address || originalData.endereco || '',
      cep: this.extractCEP(place) || originalData.cep,
      latitude: place.geometry?.location?.lat || originalData.latitude || 0,
      longitude: place.geometry?.location?.lng || originalData.longitude || 0,
      telefone: place.formatted_phone_number || originalData.telefone,
      horarioFuncionamento: this.extractOpeningHours(place) || undefined,
      website: place.website || undefined,
      matchDetails: {
        nameMatch: true,
        addressMatch: true,
        cepMatch: !!this.extractCEP(place),
        phoneMatch: !!place.formatted_phone_number
      }
    };
  }

  // Criar resultado não encontrado
  private createNotFoundResult(data: EstablishmentData): PlaceSearchResult {
    return {
      found: false,
      confidence: 0,
      source: 'manual',
      nome: data.nome,
      endereco: data.endereco || '',
      cep: data.cep,
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      telefone: data.telefone
    };
  }

  // Criar resultado manual
  private createManualResult(data: EstablishmentData): PlaceSearchResult {
    return {
      found: false,
      confidence: 0,
      source: 'manual',
      nome: data.nome,
      endereco: data.endereco || '',
      cep: data.cep,
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      telefone: data.telefone
    };
  }
}

// Função helper para criar instância do serviço
export function createGooglePlacesService(): GooglePlacesService | null {
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key não encontrada');
    return null;
  }

  return new GooglePlacesService(apiKey);
}