import { MapComponent } from '@/components/Map/MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useMockData } from '@/hooks/useMockData';
import { useState } from 'react';
import { 
  Map, 
  Filter,
  Search,
  Download,
  Maximize,
  Building2,
  Heart,
  Users
} from 'lucide-react';

const MapaInterativo = () => {
  const { ubsList, ongsList, pacientesList } = useMockData();
  const [showUBS, setShowUBS] = useState(true);
  const [showONGs, setShowONGs] = useState(true);
  const [showPacientes, setShowPacientes] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Map className="h-8 w-8 text-primary" />
            <span>Mapa Interativo</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualização georreferenciada da rede de assistência social e saúde
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Maximize className="h-4 w-4 mr-2" />
            Tela Cheia
          </Button>
        </div>
      </div>

      {/* Controls and Filters */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros do Mapa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Layer Controls */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Camadas Visíveis</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">UBS</span>
                  <Badge variant="secondary">{ubsList.length}</Badge>
                </div>
                <Switch 
                  checked={showUBS} 
                  onCheckedChange={setShowUBS}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">ONGs</span>
                  <Badge variant="secondary">{ongsList.length}</Badge>
                </div>
                <Switch 
                  checked={showONGs} 
                  onCheckedChange={setShowONGs}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Pacientes</span>
                  <Badge variant="secondary">{pacientesList.length}</Badge>
                </div>
                <Switch 
                  checked={showPacientes} 
                  onCheckedChange={setShowPacientes}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Ações Rápidas</h4>
              <Button className="w-full" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Buscar por CEP
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Nova UBS
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Nova ONG
              </Button>
            </div>

            {/* Statistics */}
            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-sm font-medium">Estatísticas</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Total de marcadores: {ubsList.length + ongsList.length + pacientesList.length}</p>
                <p>• Área coberta: Samambaia, Recanto das Emas, Águas Claras</p>
                <p>• Última atualização: Agora</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <MapComponent 
              height="600px"
              showUBS={showUBS}
              showONGs={showONGs}
              showPacientes={showPacientes}
              centerLat={-15.865795758079274}
              centerLng={-48.074650142328295}
              zoom={13}
            />
          </CardContent>
        </Card>
      </div>

      {/* Legend and Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legenda e Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>Unidades Básicas de Saúde</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                Marcadores azuis representam UBS, hospitais e clínicas. 
                Clique para ver especialidades e horários.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Heart className="h-4 w-4 text-green-500" />
                <span>ONGs e Instituições</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                Marcadores verdes mostram organizações de assistência social 
                e instituições filantrópicas.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span>Pacientes Cadastrados</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                Marcadores roxos indicam pacientes cadastrados e sua 
                vinculação com as UBS mais próximas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapaInterativo;