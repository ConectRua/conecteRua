import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMockData, UBS, ONG, Paciente } from '@/hooks/useMockData';

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { ubsList, ongsList, pacientesList } = useMockData();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([centerLat, centerLng], zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

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
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Custom icons
    const ubsIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg">
               <span class="text-white text-xs font-bold">🏥</span>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const ongIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg">
               <span class="text-white text-xs font-bold">❤️</span>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const pacienteIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full border-2 border-white shadow-lg">
               <span class="text-white text-xs font-bold">👤</span>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Add UBS markers
    if (showUBS) {
      ubsList.forEach((ubs: UBS) => {
        const marker = L.marker([ubs.latitude, ubs.longitude], { icon: ubsIcon })
          .addTo(map)
          .bindPopup(`
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
          `);
      });
    }

    // Add ONG markers
    if (showONGs) {
      ongsList.forEach((ong: ONG) => {
        const marker = L.marker([ong.latitude, ong.longitude], { icon: ongIcon })
          .addTo(map)
          .bindPopup(`
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
          `);
      });
    }

    // Add patient markers
    if (showPacientes) {
      pacientesList.forEach((paciente: Paciente) => {
        const marker = L.marker([paciente.latitude, paciente.longitude], { icon: pacienteIcon })
          .addTo(map)
          .bindPopup(`
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
          `);
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