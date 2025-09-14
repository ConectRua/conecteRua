import { MapComponent } from '@/components/Map/MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AddUBSModal } from '@/components/Forms/AddUBSModal';
import { PatientForm } from '@/components/Forms/PatientForm';
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
  Users,
  Building,
  Edit3,
  Save,
  UserPlus
} from 'lucide-react';

const MapaInterativo = () => {
  const { 
    ubsList, 
    ongsList, 
    pacientesList,
    equipamentosSociais,
    addUBS,
    updatePosition,
    loading 
  } = useMockData();

  const [showUBS, setShowUBS] = useState(true);
  const [showONGs, setShowONGs] = useState(true);
  const [showPacientes, setShowPacientes] = useState(true);
  const [showEquipamentosSociais, setShowEquipamentosSociais] = useState(true);
  const [showAddUBSModal, setShowAddUBSModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleAddUBS = (newUBS: Parameters<typeof addUBS>[0]) => {
    addUBS(newUBS);
  };

  const handlePositionUpdate = (id: string, type: 'ubs' | 'ong' | 'paciente' | 'equipamento', lat: number, lng: number) => {
    console.log('handlePositionUpdate called:', { id, type, lat, lng });
    if (updatePosition) {
      updatePosition(id, type, lat, lng);
    }
  };

  const handleEditModeToggle = () => {
    setEditMode(!editMode);
  };

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
          <Button 
            variant={editMode ? "default" : "outline"} 
            size="sm"
            onClick={handleEditModeToggle}
          >
            {editMode ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Posições
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Posições
              </>
            )}
          </Button>
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

      {/* Controls and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with filters and controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros e Controles</span>
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm">Equip. Sociais</span>
                  <Badge variant="secondary">{equipamentosSociais.length}</Badge>
                </div>
                <Switch 
                  checked={showEquipamentosSociais} 
                  onCheckedChange={setShowEquipamentosSociais}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Ações Rápidas</h4>
              <Button variant="outline" size="sm" className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Buscar por CEP
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowAddUBSModal(true)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Nova UBS
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Heart className="h-4 w-4 mr-2" />
                Nova ONG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowAddPatientModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Paciente
              </Button>
            </div>

            {/* Statistics */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Estatísticas</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total de Marcadores:</span>
                  <span className="font-semibold">
                    {ubsList.length + ongsList.length + pacientesList.length + equipamentosSociais.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Área de Cobertura:</span>
                  <span className="font-semibold">25 km²</span>
                </div>
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
              showEquipamentosSociais={showEquipamentosSociais}
              centerLat={-15.8781}
              centerLng={-48.0958}
              zoom={11}
              editMode={editMode}
              onPositionUpdate={handlePositionUpdate}
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>Unidades Básicas de Saúde</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                Marcadores azuis representam UBS, hospitais e clínicas. 
                Clique para ver informações detalhadas.
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
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Building className="h-4 w-4 text-amber-500" />
                <span>Equipamentos Sociais</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                Marcadores amarelos mostram CRAS, CAPS, Conselhos Tutelares 
                e outros equipamentos da rede socioassistencial.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar UBS */}
      <AddUBSModal
        open={showAddUBSModal}
        onOpenChange={setShowAddUBSModal}
        onAdd={handleAddUBS}
      />

      {/* Modal para adicionar Paciente */}
      <PatientForm
        open={showAddPatientModal}
        onOpenChange={setShowAddPatientModal}
      />
    </div>
  );
};

export default MapaInterativo;