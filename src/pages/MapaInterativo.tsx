import { MapComponent } from '@/components/Map/MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddUBSModal } from '@/components/Forms/AddUBSModal';
import { AddONGModal } from '@/components/Forms/AddONGModal';
import { AddEquipamentoModal } from '@/components/Forms/AddEquipamentoModal';
import { PatientForm } from '@/components/Forms/PatientForm';
import { EquipamentoSocialIcon } from '@/components/icons/EquipamentoSocialIcon';
import { ExportDropdown } from '@/components/Export/ExportDropdown';
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
  Save,
  X
} from 'lucide-react';
import type { Paciente, UBS, ONG, EquipamentoSocial } from '../../shared/schema';

interface RadiusData {
  paciente: Paciente;
  entities: {
    ubs: Array<UBS & {distance: number}>;
    ongs: Array<ONG & {distance: number}>;
    equipamentos: Array<EquipamentoSocial & {distance: number}>;
  };
}

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
  const [radiusData, setRadiusData] = useState<RadiusData | null>(null);

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

  const handleRadiusActivated = (patient: Paciente, entities: RadiusData['entities']) => {
    setRadiusData({ paciente: patient, entities });
  };

  const handleRadiusCleared = () => {
    setRadiusData(null);
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
          <ExportDropdown 
            ubsList={ubsList}
            ongsList={ongsList}
            pacientesList={pacientesList}
            equipamentosSociais={equipamentosSociais}
          />
          <Button variant="outline" size="sm">
            <Maximize className="h-4 w-4 mr-2" />
            Tela Cheia
          </Button>
        </div>
      </div>

      {/* Controls and Map */}
      <div className={`grid grid-cols-1 ${radiusData ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6`}>
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

        {/* Radius Panel - Only shown when radius is active */}
        {radiusData && (
          <Card data-testid="card-radius-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg">
                🎯 Raio de Apoio de 1km
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRadiusCleared}
                data-testid="button-close-radius-panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="pb-2 border-b">
                <p className="text-sm font-medium text-muted-foreground">Paciente</p>
                <p className="text-base font-semibold" data-testid="text-radius-patient-name">
                  {radiusData.paciente.nome}
                </p>
              </div>
              
              <ScrollArea className="h-[500px]">
                <div className="space-y-2" data-testid="list-radius-entities">
                  {/* Combine all entities and sort by distance */}
                  {[
                    ...radiusData.entities.ubs.map(ubs => ({ 
                      type: 'UBS' as const, 
                      entity: ubs, 
                      distance: ubs.distance,
                      icon: '🏥',
                      color: 'text-blue-500',
                      bgColor: 'bg-blue-50'
                    })),
                    ...radiusData.entities.ongs.map(ong => ({ 
                      type: 'ONG' as const, 
                      entity: ong, 
                      distance: ong.distance,
                      icon: '🏛️',
                      color: 'text-green-500',
                      bgColor: 'bg-green-50'
                    })),
                    ...radiusData.entities.equipamentos.map(eq => ({ 
                      type: 'Equipamento' as const, 
                      entity: eq, 
                      distance: eq.distance,
                      icon: '🎯',
                      color: 'text-amber-500',
                      bgColor: 'bg-amber-50'
                    }))
                  ]
                    .sort((a, b) => a.distance - b.distance)
                    .map((item, index) => (
                      <div
                        key={`${item.type}-${item.entity.id}`}
                        className={`p-3 rounded-lg border ${item.bgColor} transition-all hover:shadow-sm`}
                        data-testid={`item-radius-entity-${index}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{item.icon}</span>
                              <p className={`font-semibold text-sm ${item.color} truncate`}>
                                {item.entity.nome}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {item.type}
                              </Badge>
                              <span className="text-xs font-medium text-muted-foreground">
                                {(item.distance / 1000).toFixed(2)} km
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  
                  {radiusData.entities.ubs.length === 0 && 
                   radiusData.entities.ongs.length === 0 && 
                   radiusData.entities.equipamentos.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">
                        Nenhuma entidade encontrada no raio de 1km
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p>
                  Total: {radiusData.entities.ubs.length + radiusData.entities.ongs.length + radiusData.entities.equipamentos.length} entidades próximas
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
              onRadiusActivated={handleRadiusActivated}
              onRadiusCleared={handleRadiusCleared}
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