import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, Clock, Loader2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';

interface GeocodeResponse {
  latitude: number | null;
  longitude: number | null;
  endereco_completo: string;
  fonte: string;
  sucesso: boolean;
  erro?: string;
}

interface NearbyService {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  tipo: 'UBS' | 'ONG' | 'Equipamento Social';
  distancia: number;
  horarioFuncionamento?: string;
  especialidades?: string[];
  servicos?: string[];
}

const BuscaCEP = () => {
  const [cep, setCep] = useState('');
  const [searchResults, setSearchResults] = useState<NearbyService[]>([]);
  const [geocodeData, setGeocodeData] = useState<GeocodeResponse | null>(null);

  // Mutation para geocodificar CEP
  const geocodeMutation = useMutation({
    mutationFn: async (cepValue: string) => {
      const response = await apiRequest('POST', '/api/geocode', {
        endereco: `CEP ${cepValue}`,
        cep: cepValue
      });
      return response.json();
    },
    onSuccess: async (data: GeocodeResponse) => {
      setGeocodeData(data);
      if (data.sucesso && data.latitude && data.longitude) {
        // Buscar serviços próximos
        try {
          const response = await apiRequest('GET', 
            `/api/nearby?lat=${data.latitude}&lng=${data.longitude}&radius=5&type=todos`
          );
          const nearbyData = await response.json();
          setSearchResults(nearbyData.servicos || []);
          toast.success(`Encontrados ${nearbyData.servicos?.length || 0} serviços próximos`);
        } catch (error) {
          console.error('Erro ao buscar serviços próximos:', error);
          toast.error('Erro ao buscar serviços próximos');
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        toast.error(data.erro || 'Não foi possível localizar o CEP');
      }
    },
    onError: (error: any) => {
      console.error('Erro na geocodificação:', error);
      toast.error('Erro ao buscar localização: ' + error.message);
      setSearchResults([]);
      setGeocodeData(null);
    }
  });

  const handleSearch = () => {
    if (!cep.trim()) {
      toast.error('Digite um CEP válido');
      return;
    }
    
    // Validar formato do CEP
    const cepRegex = /^\d{5}-?\d{3}$/;
    if (!cepRegex.test(cep)) {
      toast.error('CEP deve estar no formato 00000-000');
      return;
    }
    
    geocodeMutation.mutate(cep);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Busca por CEP</h1>
        <p className="text-muted-foreground">
          Encontre UBS e ONGs próximas a um endereço específico
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Localizar Serviços
          </CardTitle>
          <CardDescription>
            Digite o CEP para encontrar serviços de saúde e assistência próximos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Digite o CEP (ex: 72300-000)"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={geocodeMutation.isPending}
              data-testid="input-cep"
            />
            <Button 
              onClick={handleSearch}
              disabled={geocodeMutation.isPending}
              data-testid="button-search"
            >
              {geocodeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {geocodeMutation.isPending ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
          
          {/* Mostrar informações da geocodificação */}
          {geocodeData && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {geocodeData.sucesso ? (
                  <>
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">Localização encontrada:</span>
                    <span>{geocodeData.endereco_completo}</span>
                    <Badge variant="outline" className="ml-2">
                      {geocodeData.fonte}
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">Erro:</span>
                    <span>{geocodeData.erro}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Resultados da Busca</h2>
          {searchResults.length > 0 && (
            <Badge variant="outline">
              {searchResults.length} {searchResults.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
            </Badge>
          )}
        </div>
        
        {geocodeMutation.isPending && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Buscando serviços próximos...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!geocodeMutation.isPending && searchResults.length === 0 && geocodeData && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum serviço encontrado próximo a este CEP.</p>
                <p className="text-sm mt-1">Tente pesquisar outro CEP da região.</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {searchResults.map((service) => (
          <Card key={service.id} data-testid={`card-service-${service.id}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold" data-testid={`text-service-name-${service.id}`}>
                      {service.nome}
                    </h3>
                    <Badge 
                      variant={service.tipo === 'UBS' ? 'default' : service.tipo === 'ONG' ? 'secondary' : 'outline'}
                      data-testid={`badge-service-type-${service.id}`}
                    >
                      {service.tipo}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="h-4 w-4" />
                    <span data-testid={`text-service-address-${service.id}`}>
                      {service.endereco}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium text-primary" data-testid={`text-distance-${service.id}`}>
                  {service.distancia.toFixed(1)} km
                </span>
              </div>
              
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span data-testid={`text-service-phone-${service.id}`}>
                    {service.telefone || 'Telefone não informado'}
                  </span>
                </div>
                {service.horarioFuncionamento && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span data-testid={`text-service-hours-${service.id}`}>
                      {service.horarioFuncionamento}
                    </span>
                  </div>
                )}
              </div>

              {/* Mostrar especialidades ou serviços */}
              {(service.especialidades?.length > 0 || service.servicos?.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {service.especialidades?.map((esp, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {esp}
                    </Badge>
                  ))}
                  {service.servicos?.map((serv, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {serv}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button size="sm" data-testid={`button-details-${service.id}`}>
                  Ver Detalhes
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  data-testid={`button-directions-${service.id}`}
                  onClick={() => {
                    if (geocodeData?.latitude && geocodeData?.longitude) {
                      const mapsUrl = `https://www.google.com/maps/dir/${geocodeData.latitude},${geocodeData.longitude}/${encodeURIComponent(service.endereco)}`;
                      window.open(mapsUrl, '_blank');
                    } else {
                      toast.error('Localização não disponível para traçar rota');
                    }
                  }}
                >
                  Como Chegar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BuscaCEP;