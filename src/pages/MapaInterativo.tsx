import { MapComponent } from '@/components/Map/MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AddUBSModal } from '@/components/Forms/AddUBSModal';
import { AddONGModal } from '@/components/Forms/AddONGModal';
import { AddEquipamentoModal } from '@/components/Forms/AddEquipamentoModal';
import { PatientForm } from '@/components/Forms/PatientForm';
import { EquipamentoSocialIcon } from '@/components/icons/EquipamentoSocialIcon';
import { useApiData } from '@/hooks/useApiData';
import { useState } from 'react';
import { 
  Map, 
  Filter,
  Download,
  Maximize,
  Building2,
  Heart,
  Users,
  Building,
  Edit3,
  Save
} from 'lucide-react';

const MapaInterativo = () => {
  const { 
    ubsList, 
    ongsList, 
    pacientesList,
    equipamentosSociais,
    addUBS,
    addONG,
    addEquipamentoSocial,
    addPaciente,
    updatePosition,
    loading 
  } = useApiData();

  const [showUBS, setShowUBS] = useState(true);
  const [showONGs, setShowONGs] = useState(true);
  const [showPacientes, setShowPacientes] = useState(true);
  const [showEquipamentosSociais, setShowEquipamentosSociais] = useState(true);
  const [showAddUBSModal, setShowAddUBSModal] = useState(false);
  const [showAddONGModal, setShowAddONGModal] = useState(false);
  const [showAddEquipamentoModal, setShowAddEquipamentoModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleAddUBS = (newUBS: Parameters<typeof addUBS>[0]) => {
    addUBS(newUBS);
    setShowAddUBSModal(false);
  };

  const handleAddONG = (newONG: Parameters<typeof addONG>[0]) => {
    addONG(newONG);
    setShowAddONGModal(false);
  };

  const handleAddEquipamento = (newEquipamento: Parameters<typeof addEquipamentoSocial>[0]) => {
    addEquipamentoSocial(newEquipamento);
    setShowAddEquipamentoModal(false);
  };

  const handleAddPaciente = (newPaciente: Parameters<typeof addPaciente>[0]) => {
    addPaciente(newPaciente);
    setShowAddPatientModal(false);
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

            {/* Ações Rápidas */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Ações Rápidas</h4>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => setShowAddPatientModal(true)}
                data-testid="button-adicionar-paciente-mapa"
              >
                <Users className="h-4 w-4 mr-2" />
                Adicionar Paciente
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowAddUBSModal(true)}
                data-testid="button-nova-ubs-mapa"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Nova UBS
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowAddONGModal(true)}
                data-testid="button-nova-ong-mapa"
              >
                <Heart className="h-4 w-4 mr-2" />
                Nova ONG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowAddEquipamentoModal(true)}
                data-testid="button-novo-equipamento-mapa"
              >
                <EquipamentoSocialIcon className="h-4 w-4 mr-2" />
                Novo Eqp Social
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

      {/* Modals */}
      <AddUBSModal
        open={showAddUBSModal}
        onOpenChange={setShowAddUBSModal}
        onAdd={handleAddUBS}
      />

      <AddONGModal
        open={showAddONGModal}
        onOpenChange={setShowAddONGModal}
        onAdd={handleAddONG}
      />

      <AddEquipamentoModal
        open={showAddEquipamentoModal}
        onOpenChange={setShowAddEquipamentoModal}
        onAdd={handleAddEquipamento}
      />

      <PatientForm
        open={showAddPatientModal}
        onOpenChange={setShowAddPatientModal}
        onAdd={handleAddPaciente}
      />
    </div>
  );
};

export default MapaInterativo;