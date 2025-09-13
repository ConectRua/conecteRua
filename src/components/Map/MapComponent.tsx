import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMockData, UBS, ONG, Paciente } from '@/hooks/useMockData';

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY29uc3VsdG9yaW9uYXJ1YSIsImEiOiJjbWZpdHpyNW0wMnFkMmpvcHRsd2NubW5lIn0._ohDSntfA2n9I_6tqx3gIA';

interface MapComponentProps {
  height?: string;
  showUBS?: boolean;
  showONGs?: boolean;
  showPacientes?: boolean;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

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
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { ubsList, ongsList, pacientesList } = useMockData();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: zoom
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centerLat, centerLng, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Helper function to create custom marker element
    const createMarkerElement = (type: 'ubs' | 'ong' | 'paciente') => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      
      if (type === 'ubs') {
        el.innerHTML = `
          <div class="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg">
            <span class="text-white text-xs font-bold">🏥</span>
          </div>
        `;
      } else if (type === 'ong') {
        el.innerHTML = `
          <div class="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg">
            <span class="text-white text-xs font-bold">❤️</span>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full border-2 border-white shadow-lg">
            <span class="text-white text-xs font-bold">👤</span>
          </div>
        `;
      }
      
      return el;
    };

    // Add UBS markers
    if (showUBS) {
      ubsList.forEach((ubs: UBS) => {
        const el = createMarkerElement('ubs');
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([ubs.longitude, ubs.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-3 min-w-64">
                  <h3 class="font-bold text-lg mb-2 text-blue-600">${ubs.nome}</h3>
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
                          `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">${esp}</span>`
                        ).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              `)
          )
          .addTo(map);
        
        markersRef.current.push(marker);
      });
    }

    // Add ONG markers
    if (showONGs) {
      ongsList.forEach((ong: ONG) => {
        const el = createMarkerElement('ong');
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([ong.longitude, ong.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-3 min-w-64">
                  <h3 class="font-bold text-lg mb-2 text-green-600">${ong.nome}</h3>
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
                          `<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">${servico}</span>`
                        ).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              `)
          )
          .addTo(map);
        
        markersRef.current.push(marker);
      });
    }

    // Add patient markers
    if (showPacientes) {
      pacientesList.forEach((paciente: Paciente) => {
        const el = createMarkerElement('paciente');
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([paciente.longitude, paciente.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-3 min-w-64">
                  <h3 class="font-bold text-lg mb-2 text-purple-600">${paciente.nome}</h3>
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
                          `<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">${nec}</span>`
                        ).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              `)
          )
          .addTo(map);
        
        markersRef.current.push(marker);
      });
    }

  }, [ubsList, ongsList, pacientesList, showUBS, showONGs, showPacientes]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="rounded-lg border shadow-lg"
    />
  );
};