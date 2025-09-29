import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ReclassificationModal } from '@/components/ReclassificationModal';
import { AddUBSModal } from '@/components/Forms/AddUBSModal';
import { EditUBSModal } from '@/components/Forms/EditUBSModal';
import { useApiData } from '@/hooks/useApiData';
import { Building2, Search, Plus, Edit, MapPin, Phone, Users, Trash2 } from 'lucide-react';
import type { InsertUBS, UBS } from '../../shared/schema';

const GestaoUBS = () => {
  const { ubsList, loading, addUBS, updateUBS, deleteUBS } = useApiData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUBS, setSelectedUBS] = useState<UBS | null>(null);

  const handleAddUBS = (ubs: InsertUBS) => {
    addUBS(ubs);
    setIsAddModalOpen(false);
  };

  const handleEditUBS = (id: number, ubsData: Partial<UBS>) => {
    updateUBS(id, ubsData);
    setIsEditModalOpen(false);
    setSelectedUBS(null);
  };

  const handleDeleteUBS = (id: number) => {
    deleteUBS(id);
  };

  const openEditModal = (ubs: UBS) => {
    setSelectedUBS(ubs);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de UBS</h1>
          <p className="text-muted-foreground">
            Gerencie as Unidades Básicas de Saúde cadastradas
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova UBS
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome ou endereço..."
              className="flex-1"
            />
            <Button variant="outline">Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {ubsList.map((ubs) => (
          <Card key={ubs.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{ubs.nome}</h3>
                    <Badge variant="default">Ativa</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="h-4 w-4" />
                    {ubs.endereco} - CEP: {ubs.cep}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openEditModal(ubs)}
                    data-testid={`button-edit-${ubs.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${ubs.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a UBS "{ubs.nome}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteUBS(ubs.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <ReclassificationModal 
                    registro={{ id: ubs.id, nome: ubs.nome }}
                    tipoAtual="ubs"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {ubs.telefone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Horário: {ubs.horarioFuncionamento || 'N/A'}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Especialidades: </span>
                  {ubs.especialidades?.length || 0}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Especialidades oferecidas:</p>
                <div className="flex flex-wrap gap-1">
                  {ubs.especialidades?.map((especialidade, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {especialidade}
                    </Badge>
                  )) || <span className="text-sm text-muted-foreground">Nenhuma especialidade cadastrada</span>}
                </div>
              </div>
              
              {ubs.gestor && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Gestor: </span>
                    <span className="font-medium">{ubs.gestor}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <AddUBSModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAdd={handleAddUBS}
      />
      
      <EditUBSModal 
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onEdit={handleEditUBS}
        ubs={selectedUBS}
      />
    </div>
  );
};

export default GestaoUBS;