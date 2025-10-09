import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ReclassificationModal } from '@/components/ReclassificationModal';
import { AddONGModal } from '@/components/Forms/AddONGModal';
import { EditONGModal } from '@/components/Forms/EditONGModal';
import { useApiData } from '@/hooks/useApiData';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useToast } from '@/hooks/use-toast';
import type { InsertONG, ONG } from '../../shared/schema';
import { 
  Heart, 
  Phone, 
  MapPin, 
  User, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

const GestaoONGs = () => {
  const { ongsList, loading, addONG, updateONG, deleteONG } = useApiData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedONG, setSelectedONG] = useState<ONG | null>(null);
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
  } = useMultiSelect<ONG>();

  const handleAddONG = (ong: InsertONG) => {
    addONG(ong);
    setIsAddModalOpen(false);
  };

  const handleEditONG = (id: number, ongData: Partial<ONG>) => {
    updateONG(id, ongData);
    setIsEditModalOpen(false);
    setSelectedONG(null);
  };

  const handleDeleteONG = (id: number) => {
    deleteONG(id);
  };

  const handleDeleteMultiple = async () => {
    try {
      const itemsToDelete = Array.from(selectedItems);
      
      for (const id of itemsToDelete) {
        await deleteONG(id);
      }
      
      toast({
        title: "Sucesso",
        description: `${itemsToDelete.length} ONG(s) excluída(s) com sucesso.`,
      });
      
      clearSelection();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir as ONGs selecionadas.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (ong: ONG) => {
    setSelectedONG(ong);
    setIsEditModalOpen(true);
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
            <Heart className="h-8 w-8 text-green-600" />
            <span>Gestão de ONGs</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Organizações não governamentais e instituições filantrópicas
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
              Excluir {selectedCount} Selecionada{selectedCount > 1 ? 's' : ''}
            </Button>
          )}
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova ONG
          </Button>
        </div>
      </div>

      {/* Barra de Seleção */}
      {ongsList.length > 0 && (
        <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectAll}
            onCheckedChange={() => toggleAll(ongsList)}
            data-testid="checkbox-select-all"
          />
          <label className="text-sm font-medium cursor-pointer" onClick={() => toggleAll(ongsList)}>
            Selecionar Todas ({ongsList.length} ONGs)
          </label>
          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              • {selectedCount} selecionada{selectedCount > 1 ? 's' : ''}
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
                <p className="text-sm text-muted-foreground">Total ONGs</p>
                <p className="text-2xl font-bold">{ongsList.length}</p>
              </div>
              <Heart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {ongsList.filter(ong => ong.status === 'ativo').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assistência Social</p>
                <p className="text-2xl font-bold">
                  {ongsList.filter(ong => ong.tipo === 'Assistência Social').length}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filantrópicas</p>
                <p className="text-2xl font-bold">
                  {ongsList.filter(ong => ong.tipo === 'Filantrópica').length}
                </p>
              </div>
              <Heart className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ONGs List */}
      <div className="grid gap-4">
        {ongsList.map((ong) => (
          <Card 
            key={ong.id} 
            className={`hover:shadow-lg transition-all ${isSelected(ong.id) ? 'ring-2 ring-green-600' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected(ong.id)}
                    onCheckedChange={() => toggleItem(ong.id)}
                    className="mt-1"
                    data-testid={`checkbox-ong-${ong.id}`}
                  />
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="h-5 w-5 text-green-600" />
                      <span>{ong.nome}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge 
                        variant={ong.status === 'ativo' ? 'default' : 'secondary'}
                        className={ong.status === 'ativo' ? 'bg-green-600' : ''}
                      >
                        {ong.status === 'ativo' ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="outline">{ong.tipo}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditModal(ong)}
                    data-testid={`button-edit-${ong.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${ong.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a ONG "{ong.nome}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteONG(ong.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <ReclassificationModal 
                    registro={{ id: ong.id, nome: ong.nome }}
                    tipoAtual="ongs"
                  />
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
                      <p className="text-sm text-muted-foreground">{ong.endereco}</p>
                      <p className="text-sm text-muted-foreground">CEP: {ong.cep}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Contato</p>
                      <p className="text-sm text-muted-foreground">{ong.telefone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Responsável</p>
                      <p className="text-sm text-muted-foreground">{ong.responsavel}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Serviços Oferecidos</p>
                  <div className="flex flex-wrap gap-1">
                    {(ong.servicos ?? []).map((servico, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {servico}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  <p>Coordenadas: {ong.latitude.toFixed(4)}, {ong.longitude.toFixed(4)}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Ver no Mapa
                  </Button>
                  <Button variant="outline" size="sm">
                    Contatar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <AddONGModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAdd={handleAddONG}
      />
      
      <EditONGModal 
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onEdit={handleEditONG}
        ong={selectedONG}
      />

      {/* Modal de Confirmação para Exclusão Múltipla */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Confirmar Exclusão Múltipla</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedCount} ONG{selectedCount > 1 ? 's' : ''}.
              Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMultiple}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedCount} ONG{selectedCount > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestaoONGs;