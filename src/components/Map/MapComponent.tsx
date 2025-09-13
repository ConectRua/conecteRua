import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useMockData, UBS, ONG, Paciente, EquipamentoSocial } from '@/hooks/useMockData';

interface MapComponentProps {
  height?: string;
  showUBS?: boolean;
  showONGs?: boolean;
  showPacientes?: boolean;
  showEquipamentosSociais?: boolean;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  editMode?: boolean;
  onLocationUpdate?: (type: 'ubs' | 'ong' | 'paciente' | 'equipamento', id: string, newLat: number, newLng: number) => void;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyDRwidXV58hU0ialb5D1oBAGOl0SBssiuQ';

export const MapComponent = ({
  height = '400px',
  showUBS = true,
  showONGs = true,
  showPacientes = true,
  showEquipamentosSociais = true,
  centerLat = -15.8781,
  centerLng = -48.0958,
  zoom = 12,
  editMode = false,
  onLocationUpdate
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { ubsList, ongsList, pacientesList, equipamentosSociais } = useMockData();

  // Função para obter coordenadas aproximadas baseada no bairro
  const getCoordinatesForBairro = useCallback((bairro: string): { lat: number; lng: number } => {
    const bairroCoords: Record<string, { lat: number; lng: number }> = {
      'Recanto das Emas': { lat: -15.9045, lng: -48.0632 },
      'Samambaia': { lat: -15.8781, lng: -48.0958 },
      'SH Água Quente': { lat: -15.8965, lng: -48.0455 },
    };
    
    // Adiciona pequena variação aleatória para evitar sobreposição
    const coords = bairroCoords[bairro] || { lat: -15.8781, lng: -48.0958 };
    return {
      lat: coords.lat + (Math.random() - 0.5) * 0.01,
      lng: coords.lng + (Math.random() - 0.5) * 0.01
    };
  }, []);

  // Inicialização do mapa
  useEffect(() => {
    let isMounted = true;
    let initializationTimeout: NodeJS.Timeout;
    
    const initMap = async () => {
      // Aguardar um pouco mais para garantir que o DOM esteja pronto
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!isMounted || !mapRef.current) {
        return;
      }
      
      if (mapInstanceRef.current) {
        return; // Mapa já carregado
      }

      try {
        setMapError(null);
        
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['marker']
        });

        await loader.load();

        // Verificar novamente se ainda estamos montados e o elemento existe
        if (!isMounted || !mapRef.current) {
          return;
        }

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        if (!isMounted) return;
        
        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar Google Maps:', error);
        if (isMounted) {
          setMapError(`Erro ao carregar mapa: ${error}`);
        }
      }
    };

    // Inicializar com delay
    initializationTimeout = setTimeout(initMap, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(initializationTimeout);
    };
  }, [centerLat, centerLng, zoom]);

  // Atualização dos marcadores
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;

    // Add UBS markers
    if (showUBS) {
      ubsList.forEach((ubs: UBS) => {
        const marker = new google.maps.Marker({
          position: { lat: ubs.latitude, lng: ubs.longitude },
          map: map,
          title: ubs.nome,
          draggable: editMode,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="${editMode ? '#f59e0b' : '#3b82f6'}" stroke="white" stroke-width="2"/>
                <text x="16" y="21" font-family="Arial" font-size="14" fill="white" text-anchor="middle">🏥</text>
                ${editMode ? '<circle cx="24" cy="8" r="6" fill="#ef4444" stroke="white" stroke-width="1"/><text x="24" y="12" font-family="Arial" font-size="8" fill="white" text-anchor="middle">✎</text>' : ''}
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3" style="min-width: 250px;">
              <h3 class="font-bold text-lg mb-2" style="color: #3b82f6;">${ubs.nome}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Tipo:</strong> ${ubs.tipo}</p>
                <p><strong>Endereço:</strong> ${ubs.endereco}</p>
                <p><strong>CEP:</strong> ${ubs.cep}</p>
                <p><strong>Telefone:</strong> ${ubs.telefone}</p>
                <p><strong>Horário:</strong> ${ubs.horarioFuncionamento}</p>
                <div class="mt-2">
                  <strong>Especialidades:</strong>
                  <div class="flex flex-wrap gap-1 mt-1">
                    ${ubs.especialidades.map(esp => 
                      `<span class="px-2 py-1 rounded-full text-xs" style="background-color: #dbeafe; color: #1e40af;">${esp}</span>`
                    ).join('')}
                  </div>
                </div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Add drag event listener for edit mode
        if (editMode && onLocationUpdate) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const newLat = event.latLng.lat();
              const newLng = event.latLng.lng();
              onLocationUpdate('ubs', ubs.id, newLat, newLng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

    // Add ONG markers
    if (showONGs) {
      ongsList.forEach((ong: ONG) => {
        const marker = new google.maps.Marker({
          position: { lat: ong.latitude, lng: ong.longitude },
          map: map,
          title: ong.nome,
          draggable: editMode,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="${editMode ? '#f59e0b' : '#10b981'}" stroke="white" stroke-width="2"/>
                <text x="16" y="21" font-family="Arial" font-size="14" fill="white" text-anchor="middle">❤️</text>
                ${editMode ? '<circle cx="24" cy="8" r="6" fill="#ef4444" stroke="white" stroke-width="1"/><text x="24" y="12" font-family="Arial" font-size="8" fill="white" text-anchor="middle">✎</text>' : ''}
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3" style="min-width: 250px;">
              <h3 class="font-bold text-lg mb-2" style="color: #10b981;">${ong.nome}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Tipo:</strong> ${ong.tipo}</p>
                <p><strong>Endereço:</strong> ${ong.endereco}</p>
                <p><strong>CEP:</strong> ${ong.cep}</p>
                <p><strong>Telefone:</strong> ${ong.telefone}</p>
                <p><strong>Responsável:</strong> ${ong.responsavel}</p>
                <div class="mt-2">
                  <strong>Serviços:</strong>
                  <div class="flex flex-wrap gap-1 mt-1">
                    ${ong.servicos.map(servico => 
                      `<span class="px-2 py-1 rounded-full text-xs" style="background-color: #d1fae5; color: #065f46;">${servico}</span>`
                    ).join('')}
                  </div>
                </div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Add drag event listener for edit mode
        if (editMode && onLocationUpdate) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const newLat = event.latLng.lat();
              const newLng = event.latLng.lng();
              onLocationUpdate('ong', ong.id, newLat, newLng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

    // Add patient markers
    if (showPacientes) {
      pacientesList.forEach((paciente: Paciente) => {
        const marker = new google.maps.Marker({
          position: { lat: paciente.latitude, lng: paciente.longitude },
          map: map,
          title: paciente.nome,
          draggable: editMode,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${editMode ? '#f59e0b' : '#8b5cf6'}" stroke="white" stroke-width="2"/>
                <text x="12" y="16" font-family="Arial" font-size="10" fill="white" text-anchor="middle">👤</text>
                ${editMode ? '<circle cx="18" cy="6" r="4" fill="#ef4444" stroke="white" stroke-width="1"/><text x="18" y="9" font-family="Arial" font-size="6" fill="white" text-anchor="middle">✎</text>' : ''}
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3" style="min-width: 250px;">
              <h3 class="font-bold text-lg mb-2" style="color: #8b5cf6;">${paciente.nome}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Idade:</strong> ${paciente.idade} anos</p>
                <p><strong>Gênero:</strong> ${paciente.genero}</p>
                <p><strong>Endereço:</strong> ${paciente.endereco}</p>
                <p><strong>CEP:</strong> ${paciente.cep}</p>
                <p><strong>Telefone:</strong> ${paciente.telefone}</p>
                ${paciente.distanciaUBS ? `<p><strong>Distância UBS:</strong> ${paciente.distanciaUBS.toFixed(1)} km</p>` : ''}
                <div class="mt-2">
                  <strong>Necessidades:</strong>
                  <div class="flex flex-wrap gap-1 mt-1">
                    ${paciente.necessidades.map(nec => 
                      `<span class="px-2 py-1 rounded-full text-xs" style="background-color: #ede9fe; color: #5b21b6;">${nec}</span>`
                    ).join('')}
                  </div>
                </div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Add drag event listener for edit mode
        if (editMode && onLocationUpdate) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const newLat = event.latLng.lat();
              const newLng = event.latLng.lng();
              onLocationUpdate('paciente', paciente.id, newLat, newLng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

    // Add equipamentos sociais markers
    if (showEquipamentosSociais) {
      equipamentosSociais.forEach((equipamento: EquipamentoSocial) => {
        const coords = equipamento.latitude && equipamento.longitude 
          ? { lat: equipamento.latitude, lng: equipamento.longitude }
          : getCoordinatesForBairro(equipamento.bairro);

        // Determine icon based on equipment type
        const isUBS = equipamento.tipo.includes('Centro de Saúde') || 
                     equipamento.tipo.includes('Unidade Básica') ||
                     equipamento.nome.includes('UBS');
        
        const isHospital = equipamento.tipo.includes('Hospital') ||
                          equipamento.nome.includes('Hospital');

        let iconConfig;
        if (isUBS) {
          iconConfig = {
            color: '#22c55e',
            emoji: '🏥',
            size: 26
          };
        } else if (isHospital) {
          iconConfig = {
            color: '#dc2626',
            emoji: '🏥',
            size: 30
          };
        } else {
          iconConfig = {
            color: '#f59e0b',
            emoji: '🏢',
            size: 28
          };
        }

        const marker = new google.maps.Marker({
          position: coords,
          map: map,
          title: equipamento.nome,
          draggable: editMode,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="${iconConfig.size}" height="${iconConfig.size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${iconConfig.size/2}" cy="${iconConfig.size/2}" r="${iconConfig.size/2 - 2}" fill="${editMode ? '#f59e0b' : iconConfig.color}" stroke="white" stroke-width="2"/>
                <text x="${iconConfig.size/2}" y="${iconConfig.size/2 + 4}" font-family="Arial" font-size="12" fill="white" text-anchor="middle">${iconConfig.emoji}</text>
                ${editMode ? `<circle cx="${iconConfig.size - 6}" cy="6" r="4" fill="#ef4444" stroke="white" stroke-width="1"/><text x="${iconConfig.size - 6}" y="9" font-family="Arial" font-size="6" fill="white" text-anchor="middle">✎</text>` : ''}
              </svg>
            `),
            scaledSize: new google.maps.Size(iconConfig.size, iconConfig.size)
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3" style="min-width: 280px;">
              <h3 class="font-bold text-lg mb-2" style="color: ${iconConfig.color};">${equipamento.nome}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Tipo:</strong> ${equipamento.tipo}</p>
                <p><strong>Endereço:</strong> ${equipamento.endereco}</p>
                <p><strong>Bairro:</strong> ${equipamento.bairro}</p>
                <p><strong>Telefone:</strong> ${equipamento.telefone || 'Não informado'}</p>
                <p><strong>Horário:</strong> ${equipamento.horarioFuncionamento}</p>
                <div class="mt-2 text-xs text-gray-600">
                  <p><strong>Fonte:</strong> ${equipamento.fonte}</p>
                  <p><strong>Data da Coleta:</strong> ${equipamento.dataColeta}</p>
                </div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Add drag event listener for edit mode
        if (editMode && onLocationUpdate) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const newLat = event.latLng.lat();
              const newLng = event.latLng.lng();
              onLocationUpdate('equipamento', equipamento.id, newLat, newLng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

  }, [ubsList, ongsList, pacientesList, equipamentosSociais, showUBS, showONGs, showPacientes, showEquipamentosSociais, mapLoaded, editMode, onLocationUpdate, getCoordinatesForBairro]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, []);

  if (mapError) {
    return (
      <div 
        style={{ height, width: '100%', minHeight: height }}
        className="rounded-lg border shadow-lg bg-red-50 flex items-center justify-center"
      >
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">Erro ao carregar o mapa</p>
          <p className="text-red-500 text-sm mt-2">{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div 
        style={{ height, width: '100%', minHeight: height }}
        className="rounded-lg border shadow-lg bg-gray-100 flex items-center justify-center"
      >
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%', minHeight: height }}
      className="rounded-lg border shadow-lg bg-gray-100"
    />
  );
};