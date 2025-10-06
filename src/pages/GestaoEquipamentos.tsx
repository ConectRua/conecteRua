import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ReclassificationModal } from '@/components/ReclassificationModal';
import { AddEquipamentoModal } from '@/components/Forms/AddEquipamentoModal';
import { EditEquipamentoModal } from '@/components/Forms/EditEquipamentoModal';
import { useApiData } from '@/hooks/useApiData';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useToast } from '@/hooks/use-toast';
import type { InsertEquipamentoSocial, EquipamentoSocial } from '../../shared/schema';
import { 
  Building, 
  Phone, 
  MapPin, 
  User, 
  Plus,
  Edit,
  Trash2,
  Users,
  AlertTriangle
} from 'lucide-react';

const GestaoEquipamentos = () => {
  const { equipamentosSociais, loading, addEquipamentoSocial, updateEquipamentoSocial, deleteEquipamentoSocial } = useApiData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipamento, setSelectedEquipamento] = useState<EquipamentoSocial | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    selectedItems,
    selectAll,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    selectedCount
  } = useMultiSelect<EquipamentoSocial>();

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

  const handleDeleteMultiple = async () => {
    try {
      // Converter Set para Array e deletar cada item
      const itemsToDelete = Array.from(selectedItems);
      
      // Deletar cada item selecionado
      for (const id of itemsToDelete) {
        await deleteEquipamentoSocial(id);
      }
      
      toast({
        title: "Sucesso",
        description: `${itemsToDelete.length} equipamento(s) excluído(s) com sucesso.`,
      });
      
      // Limpar seleção e fechar modal
      clearSelection();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir os equipamentos selecionados.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSingle = async (id: number) => {
    try {
      await deleteEquipamentoSocial(id);
      toast({
        title: "Sucesso",
        description: "Equipamento excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o equipamento.",
        variant: "destructive",
      });
    }
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
        
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              data-testid="button-delete-selected"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir {selectedCount} Selecionado{selectedCount > 1 ? 's' : ''}
            </Button>
          )}
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      {/* Barra de Seleção */}
      {equipamentosSociais.length > 0 && (
        <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectAll}
            onCheckedChange={() => toggleAll(equipamentosSociais)}
            data-testid="checkbox-select-all"
          />
          <label className="text-sm font-medium cursor-pointer" onClick={() => toggleAll(equipamentosSociais)}>
            Selecionar Todos ({equipamentosSociais.length} equipamentos)
          </label>
          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              • {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

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
          <Card 
            key={equipamento.id} 
            className={`hover:shadow-lg transition-all ${isSelected(equipamento.id) ? 'ring-2 ring-purple-600' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected(equipamento.id)}
                    onCheckedChange={() => toggleItem(equipamento.id)}
                    className="mt-1"
                    data-testid={`checkbox-equipamento-${equipamento.id}`}
                  />
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive"
                        data-testid={`button-delete-equipamento-${equipamento.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o equipamento "{equipamento.nome}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteSingle(equipamento.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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

      {/* Modal de Confirmação para Exclusão Múltipla */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Confirmar Exclusão Múltipla</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedCount} equipamento{selectedCount > 1 ? 's' : ''} social{selectedCount > 1 ? 'is' : ''}.
              Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMultiple}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedCount} Equipamento{selectedCount > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestaoEquipamentos;