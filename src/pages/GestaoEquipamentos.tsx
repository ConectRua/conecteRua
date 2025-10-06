import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReclassificationModal } from '@/components/ReclassificationModal';
import { AddEquipamentoModal } from '@/components/Forms/AddEquipamentoModal';
import { EditEquipamentoModal } from '@/components/Forms/EditEquipamentoModal';
import { useApiData } from '@/hooks/useApiData';
import type { InsertEquipamentoSocial, EquipamentoSocial } from '../../shared/schema';
import { 
  Building, 
  Phone, 
  MapPin, 
  User, 
  Plus,
  Edit,
  Trash2,
  Users
} from 'lucide-react';

const GestaoEquipamentos = () => {
  const { equipamentosSociais, loading, addEquipamentoSocial, updateEquipamentoSocial } = useApiData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipamento, setSelectedEquipamento] = useState<EquipamentoSocial | null>(null);

  const handleAddEquipamento = (equipamento: InsertEquipamentoSocial) => {
    addEquipamentoSocial(equipamento);
    setIsAddModalOpen(false);
  };

  const handleEditClick = (equipamento: EquipamentoSocial) => {
    setSelectedEquipamento(equipamento);
    setIsEditModalOpen(true);
  };

  const handleUpdateEquipamento = (id: number, data: Partial<EquipamentoSocial>) => {
    updateEquipamentoSocial(id, data);
    setIsEditModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Building className="h-8 w-8 text-purple-600" />
            <span>Gestão de Equipamentos Sociais</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            CAPS, CRAS e outros equipamentos de assistência social
          </p>
        </div>
        
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Equipamento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Equipamentos</p>
                <p className="text-2xl font-bold">{equipamentosSociais.length}</p>
              </div>
              <Building className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CAPS</p>
                <p className="text-2xl font-bold">
                  {equipamentosSociais.filter(eq => eq.tipo.includes('CAPS')).length}
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CRAS</p>
                <p className="text-2xl font-bold">
                  {equipamentosSociais.filter(eq => eq.tipo.includes('CRAS')).length}
                </p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outros</p>
                <p className="text-2xl font-bold">
                  {equipamentosSociais.filter(eq => !eq.tipo.includes('CAPS') && !eq.tipo.includes('CRAS')).length}
                </p>
              </div>
              <Building className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Equipamentos */}
      <div className="grid gap-4">
        {equipamentosSociais.map((equipamento) => (
          <Card key={equipamento.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <span>{equipamento.nome}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge 
                      variant="default"
                      className="bg-purple-600"
                    >
                      Ativo
                    </Badge>
                    <Badge variant="outline">{equipamento.tipo}</Badge>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditClick(equipamento)}
                    data-testid={`button-edit-equipamento-${equipamento.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <ReclassificationModal 
                    registro={{ id: equipamento.id, nome: equipamento.nome }}
                    tipoAtual="equipamentos"
                  />
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Endereço</p>
                      <p className="text-sm text-muted-foreground">{equipamento.endereco}</p>
                      <p className="text-sm text-muted-foreground">CEP: {equipamento.cep}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Contato</p>
                      <p className="text-sm text-muted-foreground">{equipamento.telefone || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {equipamento.capacidade && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Capacidade</p>
                        <p className="text-sm text-muted-foreground">{equipamento.capacidade} pessoas</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Serviços Oferecidos</p>
                    <div className="flex flex-wrap gap-1">
                      {equipamento.servicos?.length > 0 ? (
                        equipamento.servicos.map((servico, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {servico}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Nenhum serviço cadastrado</span>
                      )}
                    </div>
                  </div>
                  
                  {equipamento.latitude && equipamento.longitude && (
                    <div>
                      <p className="text-sm font-medium">Localização</p>
                      <p className="text-sm text-muted-foreground">
                        {equipamento.latitude.toFixed(6)}, {equipamento.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {equipamento.email && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium">{equipamento.email}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {equipamentosSociais.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum equipamento social cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando equipamentos sociais como CAPS, CRAS ou outros centros de assistência.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Equipamento
            </Button>
          </CardContent>
        </Card>
      )}
      
      <AddEquipamentoModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAdd={handleAddEquipamento}
      />
      
      {selectedEquipamento && (
        <EditEquipamentoModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          equipamento={selectedEquipamento}
          onUpdate={handleUpdateEquipamento}
        />
      )}
    </div>
  );
};

export default GestaoEquipamentos;