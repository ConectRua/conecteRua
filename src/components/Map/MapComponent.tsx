import { useEffect, useRef, useState, useMemo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useApiData } from '@/hooks/useApiData';
import type { UBS, ONG, Paciente, EquipamentoSocial } from '../../../shared/schema';

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
  onRadiusActivated?: (patient: Paciente, entities: {ubs: UBS[], ongs: ONG[], equipamentos: EquipamentoSocial[]}) => void;
  onRadiusCleared?: () => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Utility function to safely escape HTML and prevent XSS
const escapeHtml = (unsafe: string | null | undefined): string => {
  if (!unsafe) return 'Não informado';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Haversine formula to calculate distance between two points in meters
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
  onPositionUpdate,
  onRadiusActivated,
  onRadiusCleared
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activePacienteId, setActivePacienteId] = useState<number | null>(null);
  const { ubsList, ongsList, pacientesList, equipamentosSociais } = useApiData();

  // Criar referências estáveis dos dados usando useRef para evitar re-renders
  const dataRef = useRef({ ubsList, ongsList, pacientesList, equipamentosSociais });
  
  // Function to clear radius circle
  const clearRadius = () => {
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }
    setActivePacienteId(null);
    if (onRadiusCleared) {
      onRadiusCleared();
    }
  };

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
        // Converter latitude e longitude para número (podem vir como string do banco)
        const lat = typeof ubs.latitude === 'string' ? parseFloat(ubs.latitude) : ubs.latitude;
        const lng = typeof ubs.longitude === 'string' ? parseFloat(ubs.longitude) : ubs.longitude;
        
        // Verificar se as coordenadas são válidas
        if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          return;
        }
        
        const marker = new google.maps.Marker({
          position: { lat: lat, lng: lng },
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
              <h3 class="font-bold text-lg mb-2" style="color: #3b82f6;">${escapeHtml(ubs.nome)}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Endereço:</strong> ${escapeHtml(ubs.endereco)}</p>
                <p><strong>CEP:</strong> ${escapeHtml(ubs.cep)}</p>
                <p><strong>Telefone:</strong> ${escapeHtml(ubs.telefone)}</p>
                <p><strong>Horário:</strong> ${escapeHtml(ubs.horarioFuncionamento)}</p>
                <div class="mt-2">
                  <strong>Especialidades:</strong>
                  <div class="flex flex-wrap gap-1 mt-1">
                    ${(ubs.especialidades || []).map(esp => 
                      `<span class="px-2 py-1 rounded-full text-xs" style="background-color: #dbeafe; color: #1e40af;">${escapeHtml(esp)}</span>`
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
              onPositionUpdate(ubs.id.toString(), 'ubs', lat, lng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

    // Add ONG markers
    if (showONGs) {
      dataRef.current.ongsList.forEach((ong: ONG) => {
        // Converter latitude e longitude para número (podem vir como string do banco)
        const lat = typeof ong.latitude === 'string' ? parseFloat(ong.latitude) : ong.latitude;
        const lng = typeof ong.longitude === 'string' ? parseFloat(ong.longitude) : ong.longitude;
        
        // Verificar se as coordenadas são válidas
        if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          return;
        }
        
        const marker = new google.maps.Marker({
          position: { lat: lat, lng: lng },
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
              <h3 class="font-bold text-lg mb-2" style="color: #10b981;">${escapeHtml(ong.nome)}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Endereço:</strong> ${escapeHtml(ong.endereco)}</p>
                <p><strong>CEP:</strong> ${escapeHtml(ong.cep)}</p>
                <p><strong>Telefone:</strong> ${escapeHtml(ong.telefone)}</p>
                <p><strong>Responsável:</strong> ${escapeHtml(ong.responsavel)}</p>
                <div class="mt-2">
                  <strong>Serviços:</strong>
                  <div class="flex flex-wrap gap-1 mt-1">
                    ${(ong.servicos || []).map(servico => 
                      `<span class="px-2 py-1 rounded-full text-xs" style="background-color: #d1fae5; color: #065f46;">${escapeHtml(servico)}</span>`
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
              onPositionUpdate(ong.id.toString(), 'ong', lat, lng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

    // Add patient markers
    if (showPacientes) {
      dataRef.current.pacientesList.forEach((paciente: Paciente) => {
        // Converter latitude e longitude para número (podem vir como string do banco)
        const lat = typeof paciente.latitude === 'string' ? parseFloat(paciente.latitude) : paciente.latitude;
        const lng = typeof paciente.longitude === 'string' ? parseFloat(paciente.longitude) : paciente.longitude;
        
        // Verificar se as coordenadas são válidas antes de criar o marcador
        if (lat == null || lng == null || 
            !Number.isFinite(lat) || !Number.isFinite(lng) ||
            lat < -90 || lat > 90 || 
            lng < -180 || lng > 180) {
          console.log(`Paciente ${paciente.nome} não possui coordenadas válidas - ignorando no mapa`);
          return;
        }
        
        // Determinar cor do marcador baseado na precisão da geocodificação
        // Alta precisão (roxo escuro): ROOFTOP, PLACE, RANGE_INTERPOLATED
        // Baixa precisão (roxo claro): APPROXIMATE, GEOMETRIC_CENTER, null
        const precisao = (paciente as any).precisaoGeocode;
        const isLowPrecision = !precisao || precisao === 'APPROXIMATE' || precisao === 'GEOMETRIC_CENTER';
        
        let markerColor;
        if (editMode) {
          markerColor = '#a855f7'; // Roxo claro em modo edição
        } else if (isLowPrecision) {
          markerColor = '#a855f7'; // Roxo claro para baixa precisão (precisa validação)
        } else {
          markerColor = '#9333ea'; // Roxo escuro para alta precisão
        }
        
        const marker = new google.maps.Marker({
          position: { lat: lat, lng: lng },
          map: map,
          title: paciente.nome,
          draggable: editMode,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${markerColor}" stroke="white" stroke-width="2"/>
                <text x="12" y="16" font-family="Arial" font-size="10" fill="white" text-anchor="middle">👤</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
          }
        });

        // Texto amigável para precisão
        const precisaoTexto = precisao 
          ? precisao === 'ROOFTOP' ? 'Alta (endereço exato)' 
          : precisao === 'PLACE' ? 'Alta (local conhecido)' 
          : precisao === 'RANGE_INTERPOLATED' ? 'Boa (interpolado)' 
          : precisao === 'GEOMETRIC_CENTER' ? 'Média (centro geométrico)' 
          : 'Baixa (aproximado)' 
          : 'Desconhecida';
        
        const isRadiusActive = activePacienteId === paciente.id;
        
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3" style="min-width: 250px;">
              <h3 class="font-bold text-lg mb-2" style="color: ${markerColor};">${escapeHtml(paciente.nome)}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Idade:</strong> ${escapeHtml(paciente.idade?.toString())} anos</p>
                <p><strong>Endereço:</strong> ${escapeHtml(paciente.endereco)}</p>
                <p><strong>CEP:</strong> ${escapeHtml(paciente.cep)}</p>
                <p><strong>Telefone:</strong> ${escapeHtml(paciente.telefone)}</p>
                ${precisao ? `<p><strong>Precisão:</strong> <span style="color: ${isLowPrecision ? '#f59e0b' : '#10b981'};">${escapeHtml(precisaoTexto)}</span>${isLowPrecision ? ' ⚠️' : ' ✓'}</p>` : ''}
                ${paciente.distanciaUbs ? `<p><strong>Distância UBS:</strong> ${escapeHtml(paciente.distanciaUbs.toFixed(1))} km</p>` : ''}
                <div class="mt-2">
                  <strong>Condições de Saúde:</strong>
                  <div class="flex flex-wrap gap-1 mt-1">
                    ${(paciente.condicoesSaude || []).map(cond => 
                      `<span class="px-2 py-1 rounded-full text-xs" style="background-color: #ede9fe; color: #5b21b6;">${escapeHtml(cond)}</span>`
                    ).join('')}
                  </div>
                </div>
                ${!editMode ? `
                  <div class="mt-3 pt-2 border-t">
                    ${isRadiusActive ? `
                      <button 
                        data-testid="button-clear-radius"
                        class="radius-clear-btn w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-medium transition-colors"
                        style="cursor: pointer;"
                      >
                        ❌ Limpar Raio
                      </button>
                    ` : `
                      <button 
                        data-testid="button-show-radius"
                        class="radius-btn w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm font-medium transition-colors"
                        style="cursor: pointer;"
                      >
                        🎯 Ver Raio de Apoio (1km)
                      </button>
                    `}
                  </div>
                ` : ''}
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          if (!editMode) {
            infoWindow.open(map, marker);
            
            // Add event listeners to radius buttons after InfoWindow opens
            google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
              const showRadiusBtn = document.querySelector('.radius-btn');
              const clearRadiusBtn = document.querySelector('.radius-clear-btn');
              
              if (showRadiusBtn) {
                showRadiusBtn.addEventListener('click', () => {
                  // Clear any existing radius first
                  if (radiusCircleRef.current) {
                    radiusCircleRef.current.setMap(null);
                  }
                  
                  // Draw new radius circle
                  const circle = new google.maps.Circle({
                    strokeColor: '#a855f7',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#a855f7',
                    fillOpacity: 0.2,
                    map: map,
                    center: { lat, lng },
                    radius: 1000
                  });
                  
                  radiusCircleRef.current = circle;
                  setActivePacienteId(paciente.id);
                  
                  // Calculate entities within radius
                  const ubsWithinRadius = dataRef.current.ubsList.filter((ubs: UBS) => {
                    const ubsLat = typeof ubs.latitude === 'string' ? parseFloat(ubs.latitude) : ubs.latitude;
                    const ubsLng = typeof ubs.longitude === 'string' ? parseFloat(ubs.longitude) : ubs.longitude;
                    if (ubsLat == null || ubsLng == null) return false;
                    const distance = haversineDistance(lat, lng, ubsLat, ubsLng);
                    return distance <= 1000;
                  });
                  
                  const ongsWithinRadius = dataRef.current.ongsList.filter((ong: ONG) => {
                    const ongLat = typeof ong.latitude === 'string' ? parseFloat(ong.latitude) : ong.latitude;
                    const ongLng = typeof ong.longitude === 'string' ? parseFloat(ong.longitude) : ong.longitude;
                    if (ongLat == null || ongLng == null) return false;
                    const distance = haversineDistance(lat, lng, ongLat, ongLng);
                    return distance <= 1000;
                  });
                  
                  const equipamentosWithinRadius = dataRef.current.equipamentosSociais.filter((eq: EquipamentoSocial) => {
                    if (eq.latitude == null || eq.longitude == null) return false;
                    const distance = haversineDistance(lat, lng, eq.latitude, eq.longitude);
                    return distance <= 1000;
                  });
                  
                  // Call callback with filtered data
                  if (onRadiusActivated) {
                    onRadiusActivated(paciente, {
                      ubs: ubsWithinRadius,
                      ongs: ongsWithinRadius,
                      equipamentos: equipamentosWithinRadius
                    });
                  }
                  
                  // Update InfoWindow to show clear button
                  infoWindow.close();
                  updateMarkers();
                  infoWindow.open(map, marker);
                });
              }
              
              if (clearRadiusBtn) {
                clearRadiusBtn.addEventListener('click', () => {
                  clearRadius();
                  infoWindow.close();
                  updateMarkers();
                });
              }
            });
          }
        });

        if (editMode) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng && onPositionUpdate) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              onPositionUpdate(paciente.id.toString(), 'paciente', lat, lng);
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
              <h3 class="font-bold text-lg mb-2" style="color: ${iconConfig.color};">${escapeHtml(equipamento.nome)}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Tipo:</strong> ${escapeHtml(equipamento.tipo)}</p>
                <p><strong>Endereço:</strong> ${escapeHtml(equipamento.endereco)}</p>
                <p><strong>Telefone:</strong> ${escapeHtml(equipamento.telefone)}</p>
                <p><strong>Horário:</strong> ${escapeHtml(equipamento.horarioFuncionamento)}</p>
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
              onPositionUpdate(equipamento.id.toString(), 'equipamento', lat, lng);
            }
          });
        }

        markersRef.current.push(marker);
      });
    }
  };

  useEffect(() => {
    const initMap = async () => {
      // More robust check - ensure the element exists and is properly attached to DOM
      if (!mapRef.current || mapInstanceRef.current || !mapRef.current.offsetParent) {
        return;
      }

      // Add a small delay to ensure DOM is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Double-check the element is still available after the delay
      if (!mapRef.current) {
        console.warn('Map element not available after delay');
        return;
      }

      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['marker', 'places']
        });

        await loader.load();

        // Final check before creating the map
        if (!mapRef.current) {
          console.error('Map div element became null before map creation');
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

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar Google Maps:', error);
      }
    };

    // Use a timeout to ensure the DOM is ready
    const timeoutId = setTimeout(initMap, 50);
    
    return () => clearTimeout(timeoutId);
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