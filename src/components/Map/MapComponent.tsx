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

  const createPlaceholderMap = useCallback(() => {
    if (!mapRef.current) return;
    
    mapRef.current.innerHTML = `
      <div style="
        width: 100%; 
        height: 100%; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 20px;
        color: white;
        font-family: Arial, sans-serif;
        position: relative;
      ">
        <div style="
          background: rgba(255,255,255,0.95);
          color: #334155;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          max-width: 500px;
          backdrop-filter: blur(10px);
        ">
          <h3 style="margin: 0 0 15px 0; font-size: 20px; color: #1e293b;">🗺️ Mapa da Rede de Assistência</h3>
          <p style="color: #64748b; margin: 0 0 20px 0; font-size: 14px; line-height: 1.5;">
            Visualização das unidades cadastradas na região de Brasília/DF
          </p>
          
          <div style="
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 15px; 
            margin: 20px 0;
          ">
            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
              <div style="font-size: 24px; margin-bottom: 5px;">🏥</div>
              <div style="font-weight: bold; color: #3b82f6;">${ubsList.length}</div>
              <div style="font-size: 12px; color: #64748b;">UBS</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
              <div style="font-size: 24px; margin-bottom: 5px;">❤️</div>
              <div style="font-weight: bold; color: #10b981;">${ongsList.length}</div>
              <div style="font-size: 12px; color: #64748b;">ONGs</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
              <div style="font-size: 24px; margin-bottom: 5px;">👤</div>
              <div style="font-weight: bold; color: #8b5cf6;">${pacientesList.length}</div>
              <div style="font-size: 12px; color: #64748b;">Pacientes</div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
              <div style="font-size: 24px; margin-bottom: 5px;">🏢</div>
              <div style="font-weight: bold; color: #f59e0b;">${equipamentosSociais.length}</div>
              <div style="font-size: 12px; color: #64748b;">Equipamentos</div>
            </div>
          </div>
          
          ${editMode ? `
            <div style="
              margin-top: 15px; 
              padding: 10px; 
              background: #fef3c7; 
              border-left: 4px solid #f59e0b; 
              border-radius: 4px;
              text-align: left;
            ">
              <strong style="color: #92400e;">Modo de Edição Ativo</strong><br>
              <span style="font-size: 12px; color: #b45309;">
                No mapa interativo, você pode arrastar os marcadores para alterar suas posições.
              </span>
            </div>
          ` : ''}
          
          <p style="color: #94a3b8; font-size: 11px; margin: 15px 0 0 0; font-style: italic;">
            ${mapError ? 'Mapa temporariamente indisponível' : 'Carregando mapa interativo...'}
          </p>
        </div>
        
        <div style="
          position: absolute;
          bottom: 10px;
          right: 10px;
          font-size: 10px;
          color: rgba(255,255,255,0.7);
          background: rgba(0,0,0,0.3);
          padding: 5px 8px;
          border-radius: 4px;
        ">
          Brasília, DF
        </div>
      </div>
    `;
    
    setMapLoaded(true);
    setMapError(null);
  }, [ubsList.length, ongsList.length, pacientesList.length, equipamentosSociais.length, editMode, mapError]);

  // Inicialização do mapa
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Timeout de segurança
      timeoutId = setTimeout(() => {
        if (isMounted && !mapLoaded) {
          console.warn('Timeout na inicialização do mapa, usando fallback');
          createPlaceholderMap();
        }
      }, 3000);

      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        if (!isMounted || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true
        });

        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        mapInstanceRef.current = map;
        setMapLoaded(true);
        setMapError(null);
        
      } catch (error) {
        console.error('Erro ao carregar Google Maps:', error);
        if (isMounted) {
          createPlaceholderMap();
        }
      }
    };

    setTimeout(initMap, 500);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [centerLat, centerLng, zoom, createPlaceholderMap, mapLoaded]);

  // Renderizar marcadores
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Limpar marcadores existentes
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    const map = mapInstanceRef.current;

    // Adicionar marcadores UBS
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
                <text x="16" y="20" font-family="Arial" font-size="16" fill="white" text-anchor="middle">🏥</text>
                ${editMode ? '<circle cx="24" cy="8" r="4" fill="#ef4444"/><text x="24" y="11" font-family="Arial" font-size="8" fill="white" text-anchor="middle">✎</text>' : ''}
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="max-width: 250px; font-family: Arial, sans-serif;">
              <h3 style="color: #3b82f6; margin: 0 0 10px 0;">${ubs.nome}</h3>
              <p><strong>Endereço:</strong> ${ubs.endereco}</p>
              <p><strong>Telefone:</strong> ${ubs.telefone}</p>
              <p><strong>Horário:</strong> ${ubs.horarioFuncionamento}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        if (editMode && onLocationUpdate) {
          marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              onLocationUpdate('ubs', ubs.id, event.latLng.lat(), event.latLng.lng());
            }
          });
        }

        markersRef.current.push(marker);
      });
    }

    // Adicionar outros marcadores (ONGs, Pacientes, etc.) de forma similar...
    // (Simplificado para resolver o problema principal primeiro)

  }, [mapLoaded, showUBS, ubsList, editMode, onLocationUpdate]);

  if (!mapLoaded) {
    return (
      <div 
        style={{ height, width: '100%' }}
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
      style={{ height, width: '100%' }}
      className="rounded-lg border shadow-lg"
    />
  );
};