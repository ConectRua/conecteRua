import { Client, TravelMode } from '@googlemaps/google-maps-services-js';

interface WaypointOptimization {
  optimizedOrder: number[];
  totalDistance: number; // em metros
  totalDuration: number; // em segundos
  legs: RouteDistance[];
  status: 'success' | 'error';
  errorMessage?: string;
}

interface RouteDistance {
  fromIndex: number;
  toIndex: number;
  distance: number; // em metros
  duration: number; // em segundos
  distanceText: string;
  durationText: string;
}

interface WaypointLocation {
  latitude: number;
  longitude: number;
  id?: number;
  nome?: string;
}

export class GoogleDirectionsService {
  private client: Client;
  private apiKey: string;

  constructor(apiKey: string) {
    this.client = new Client({});
    this.apiKey = apiKey;
  }

  /**
   * Otimiza a rota entre múltiplos pontos (waypoints)
   * Retorna a ordem ideal e distâncias entre cada ponto
   */
  async optimizeRoute(
    origin: WaypointLocation,
    destinations: WaypointLocation[],
    travelMode: TravelMode = TravelMode.driving
  ): Promise<WaypointOptimization> {
    try {
      if (destinations.length === 0) {
        return {
          optimizedOrder: [],
          totalDistance: 0,
          totalDuration: 0,
          legs: [],
          status: 'error',
          errorMessage: 'Nenhum destino fornecido'
        };
      }

      // Se houver apenas 1 destino, não precisa otimizar
      if (destinations.length === 1) {
        const simpleRoute = await this.calculateSimpleRoute(origin, destinations[0], travelMode);
        return {
          optimizedOrder: [0],
          totalDistance: simpleRoute.distance,
          totalDuration: simpleRoute.duration,
          legs: [simpleRoute],
          status: 'success'
        };
      }

      // Para múltiplos destinos, usar a API de otimização
      const waypoints = destinations.map(dest => ({
        location: { lat: dest.latitude, lng: dest.longitude }
      }));

      const response = await this.client.directions({
        params: {
          origin: { lat: origin.latitude, lng: origin.longitude },
          destination: { lat: origin.latitude, lng: origin.longitude }, // Volta para origem
          waypoints: waypoints as any,
          optimize: true, // Otimizar ordem dos waypoints
          mode: travelMode,
          language: 'pt-BR',
          key: this.apiKey
        },
        timeout: 10000
      });

      if (response.data.status !== 'OK' || !response.data.routes[0]) {
        console.error('Erro na resposta da Directions API:', response.data.status);
        return {
          optimizedOrder: destinations.map((_, i) => i),
          totalDistance: 0,
          totalDuration: 0,
          legs: [],
          status: 'error',
          errorMessage: `Erro ao calcular rota: ${response.data.status}`
        };
      }

      const route = response.data.routes[0];
      const waypointOrder = route.waypoint_order || destinations.map((_, i) => i);
      
      // Calcular distâncias e durações
      let totalDistance = 0;
      let totalDuration = 0;
      const legs: RouteDistance[] = [];

      route.legs.forEach((leg, index) => {
        const distance = leg.distance?.value || 0;
        const duration = leg.duration?.value || 0;
        
        totalDistance += distance;
        totalDuration += duration;

        legs.push({
          fromIndex: index === 0 ? -1 : waypointOrder[index - 1], // -1 = origem
          toIndex: index < waypointOrder.length ? waypointOrder[index] : -1,
          distance,
          duration,
          distanceText: leg.distance?.text || '0 m',
          durationText: leg.duration?.text || '0 min'
        });
      });

      return {
        optimizedOrder: waypointOrder,
        totalDistance,
        totalDuration,
        legs,
        status: 'success'
      };

    } catch (error) {
      console.error('Erro ao otimizar rota:', error);
      return {
        optimizedOrder: destinations.map((_, i) => i),
        totalDistance: 0,
        totalDuration: 0,
        legs: [],
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Calcula rota simples entre dois pontos
   */
  private async calculateSimpleRoute(
    origin: WaypointLocation,
    destination: WaypointLocation,
    travelMode: TravelMode = TravelMode.driving
  ): Promise<RouteDistance> {
    try {
      const response = await this.client.directions({
        params: {
          origin: { lat: origin.latitude, lng: origin.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
          mode: travelMode,
          language: 'pt-BR',
          key: this.apiKey
        },
        timeout: 5000
      });

      if (response.data.status === 'OK' && response.data.routes[0]) {
        const leg = response.data.routes[0].legs[0];
        return {
          fromIndex: -1,
          toIndex: 0,
          distance: leg.distance?.value || 0,
          duration: leg.duration?.value || 0,
          distanceText: leg.distance?.text || '0 m',
          durationText: leg.duration?.text || '0 min'
        };
      }

      // Fallback para cálculo direto se API falhar
      const distance = this.calculateDirectDistance(
        origin.latitude, origin.longitude,
        destination.latitude, destination.longitude
      );

      return {
        fromIndex: -1,
        toIndex: 0,
        distance: Math.round(distance),
        duration: Math.round(distance / 10), // Estimativa: 10m/s = 36km/h
        distanceText: this.formatDistance(distance),
        durationText: this.formatDuration(distance / 10)
      };

    } catch (error) {
      console.error('Erro ao calcular rota simples:', error);
      const distance = this.calculateDirectDistance(
        origin.latitude, origin.longitude,
        destination.latitude, destination.longitude
      );

      return {
        fromIndex: -1,
        toIndex: 0,
        distance: Math.round(distance),
        duration: Math.round(distance / 10),
        distanceText: this.formatDistance(distance),
        durationText: this.formatDuration(distance / 10)
      };
    }
  }

  /**
   * Calcula distância em linha reta entre dois pontos (Haversine)
   */
  private calculateDirectDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

  /**
   * Formata distância em texto legível
   */
  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Formata duração em texto legível
   */
  private formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }
}

/**
 * Factory function para criar instância do serviço
 */
export function createGoogleDirectionsService(): GoogleDirectionsService | null {
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key não encontrada');
    return null;
  }

  return new GoogleDirectionsService(apiKey);
}
