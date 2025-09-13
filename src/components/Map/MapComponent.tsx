import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useMockData, UBS, ONG, Paciente } from '@/hooks/useMockData';

interface MapComponentProps {
  height?: string;
  showUBS?: boolean;
  showONGs?: boolean;
  showPacientes?: boolean;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyDRwidXV58hU0ialb5D1oBAGOl0SBssiuQ';

export const MapComponent = ({
  height = '400px',
  showUBS = true,
  showONGs = true,
  showPacientes = true,
  centerLat = -15.8781,
  centerLng = -48.0958,
  zoom = 12
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { ubsList, ongsList, pacientesList } = useMockData();

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
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="white" stroke-width="2"/>
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
          infoWindow.open(map, marker);
        });

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
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" stroke-width="2"/>
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
          infoWindow.open(map, marker);
        });

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
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#8b5cf6" stroke="white" stroke-width="2"/>
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
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
      });
    }

  }, [ubsList, ongsList, pacientesList, showUBS, showONGs, showPacientes, mapLoaded]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="rounded-lg border shadow-lg"
    />
  );
};