import { useEffect, useRef, useState, useMemo } from 'react';
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
  onPositionUpdate?: (id: string, type: 'ubs' | 'ong' | 'paciente' | 'equipamento', lat: number, lng: number) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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
  onPositionUpdate
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { ubsList, ongsList, pacientesList, equipamentosSociais } = useMockData();

  // Criar referências estáveis dos dados usando useRef para evitar re-renders
  const dataRef = useRef({ ubsList, ongsList, pacientesList, equipamentosSociais });
  
  // Atualizar referências quando os dados realmente mudarem
  useEffect(() => {
    console.log('Dados atualizados no MapComponent:', { 
      ubsList: ubsList.length, 
      ongsList: ongsList.length, 
      pacientesList: pacientesList.length, 
      equipamentosSociais: equipamentosSociais.length 
    });
    
    dataRef.current = { ubsList, ongsList, pacientesList, equipamentosSociais };
    
    // Re-renderizar marcadores sempre que os dados mudarem e o mapa estiver carregado
    if (mapLoaded && mapInstanceRef.current) {
      console.log('Atualizando marcadores devido a mudança de dados...');
      updateMarkers();
    }
  }, [ubsList, ongsList, pacientesList, equipamentosSociais, mapLoaded]);

  // Atualizar marcadores quando a visibilidade das camadas mudar
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      console.log('Atualizando marcadores devido a mudança de visibilidade...');
      updateMarkers();
    }
  }, [showUBS, showONGs, showPacientes, showEquipamentosSociais, mapLoaded]);

  // Função separada para atualizar marcadores
  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    console.log('updateMarkers executado. Dados atuais:', {
      pacientes: dataRef.current.pacientesList.length,
      showPacientes,
      ubsList: dataRef.current.ubsList.length,
      ongsList: dataRef.current.ongsList.length,
      equipamentosSociais: dataRef.current.equipamentosSociais.length
    });

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add UBS markers
    if (showUBS) {
      dataRef.current.ubsList.forEach((ubs: UBS) => {
        const marker = new google.maps.Marker({
          position: { lat: ubs.latitude, lng: ubs.longitude },
          map: map,
          title: ubs.nome,
          draggable: editMode,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="${editMode ? '#fbbf24' : '#3b82f6'}" stroke="white" stroke-width="2"/>
                <text x="16" y="21" font-family="Arial" font-size="14" fill="white" text-anchor="middle">🏥</text>
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
          if (!editMode) {
            infoWindow.open(map, marker);
          }
        });

        if (editMode) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng && onPositionUpdate) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              onPositionUpdate(ubs.id, 'ubs', lat, lng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

    // Add ONG markers
    if (showONGs) {
      dataRef.current.ongsList.forEach((ong: ONG) => {
        const marker = new google.maps.Marker({
          position: { lat: ong.latitude, lng: ong.longitude },
          map: map,
          title: ong.nome,
          draggable: editMode,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="${editMode ? '#fbbf24' : '#10b981'}" stroke="white" stroke-width="2"/>
                <text x="16" y="21" font-family="Arial" font-size="14" fill="white" text-anchor="middle">❤️</text>
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
          if (!editMode) {
            infoWindow.open(map, marker);
          }
        });

        if (editMode) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng && onPositionUpdate) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              onPositionUpdate(ong.id, 'ong', lat, lng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

    // Add patient markers
    if (showPacientes) {
      dataRef.current.pacientesList.forEach((paciente: Paciente) => {
        const marker = new google.maps.Marker({
          position: { lat: paciente.latitude, lng: paciente.longitude },
          map: map,
          title: paciente.nome,
          draggable: editMode,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${editMode ? '#fbbf24' : '#8b5cf6'}" stroke="white" stroke-width="2"/>
                <text x="12" y="16" font-family="Arial" font-size="10" fill="white" text-anchor="middle">👤</text>
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
          if (!editMode) {
            infoWindow.open(map, marker);
          }
        });

        if (editMode) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng && onPositionUpdate) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              onPositionUpdate(paciente.id, 'paciente', lat, lng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

    // Add equipamentos sociais markers
    if (showEquipamentosSociais) {
      dataRef.current.equipamentosSociais.forEach((equipamento: EquipamentoSocial) => {
        const coords = { lat: equipamento.latitude!, lng: equipamento.longitude! };

        const isUBS = equipamento.tipo.includes('Centro de Saúde') || 
                     equipamento.tipo.includes('Unidade Básica') ||
                     equipamento.nome.includes('UBS');
        
        const isHospital = equipamento.tipo.includes('Hospital') ||
                          equipamento.nome.includes('Hospital');

        let iconConfig;
        if (isUBS) {
          iconConfig = { color: '#22c55e', emoji: '🏥', size: 26 };
        } else if (isHospital) {
          iconConfig = { color: '#dc2626', emoji: '🏥', size: 30 };
        } else {
          iconConfig = { color: '#f59e0b', emoji: '🏢', size: 28 };
        }

        const marker = new google.maps.Marker({
          position: coords,
          map: map,
          title: equipamento.nome,
          draggable: editMode,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="${iconConfig.size}" height="${iconConfig.size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${iconConfig.size/2}" cy="${iconConfig.size/2}" r="${iconConfig.size/2 - 2}" fill="${editMode ? '#fbbf24' : iconConfig.color}" stroke="white" stroke-width="2"/>
                <text x="${iconConfig.size/2}" y="${iconConfig.size/2 + 4}" font-family="Arial" font-size="12" fill="white" text-anchor="middle">${iconConfig.emoji}</text>
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
          if (!editMode) {
            infoWindow.open(map, marker);
          }
        });

        if (editMode) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng && onPositionUpdate) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              onPositionUpdate(equipamento.id, 'equipamento', lat, lng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }
  };

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['marker']
        });

        await loader.load();

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

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar Google Maps:', error);
      }
    };

    initMap();
  }, [centerLat, centerLng, zoom]);

  // Efeito separado para mudanças de visibilidade e modo de edição
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      updateMarkers();
    }
  }, [showUBS, showONGs, showPacientes, showEquipamentosSociais, editMode]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="rounded-lg border shadow-lg"
    />
  );
};