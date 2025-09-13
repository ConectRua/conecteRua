import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMockData, UBS, ONG, Paciente } from '@/hooks/useMockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  
  const [accessToken, setAccessToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const initializeMap = (token: string) => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      mapboxgl.accessToken = token;
      
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [centerLng, centerLat],
        zoom: zoom
      });

      map.on('load', () => {
        setMapLoaded(true);
        setTokenError(null);
      });

      map.on('error', (e) => {
        setTokenError('Token inválido ou sem permissões necessárias');
        setMapLoaded(false);
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapInstanceRef.current = map;

    } catch (error) {
      setTokenError('Erro ao inicializar o mapa');
      setMapLoaded(false);
    }
  };

  const handleTokenSubmit = () => {
    if (!accessToken.trim()) {
      setTokenError('Por favor, insira um token válido');
      return;
    }
    
    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    
    setMapLoaded(false);
    initializeMap(accessToken);
  };

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

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

  }, [ubsList, ongsList, pacientesList, showUBS, showONGs, showPacientes, mapLoaded]);

  if (!mapLoaded) {
    return (
      <div style={{ height, width: '100%' }} className="rounded-lg border shadow-lg">
        <Card className="h-full flex items-center justify-center">
          <CardContent className="text-center space-y-4 p-6">
            <CardHeader>
              <CardTitle>Configurar Token do Mapbox</CardTitle>
            </CardHeader>
            
            {tokenError && (
              <Alert className="mb-4">
                <AlertDescription>{tokenError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4 max-w-md">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Para usar o mapa, você precisa de um token público do Mapbox.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Obtenha seu token em: <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">account.mapbox.com</a>
                </p>
              </div>
              
              <Input
                type="text"
                placeholder="Cole seu token público do Mapbox aqui..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
              />
              
              <Button onClick={handleTokenSubmit} disabled={!accessToken.trim()}>
                Carregar Mapa
              </Button>
            </div>
          </CardContent>
        </Card>
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