import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Search, Plus, UserCheck, MapPin, Phone, Calendar, CreditCard, Trash2, Edit, ClipboardList, Clock } from 'lucide-react';
import { PatientForm } from '@/components/Forms/PatientForm';
import { EditPatientModal } from '@/components/Forms/EditPatientModal';
import { OrientacoesModal } from '@/components/Modals/OrientacoesModal';
import { useApiData } from '@/hooks/useApiData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Paciente } from '../../shared/schema';

const Pacientes = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOrientacoesModalOpen, setIsOrientacoesModalOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { pacientesList, getEstatisticas, deletePaciente, updatePaciente } = useApiData();
  const stats = getEstatisticas();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteBatchMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest('/api/pacientes/excluir-lote', {
        method: 'POST',
        body: JSON.stringify({ ids }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        throw new Error('Falha ao excluir pacientes');
      }
      
      return await res.json() as { deleted: number; failed: number; total: number; success: boolean };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/estatisticas'] });
      toast({
        title: "Exclusão em lote concluída",
        description: `${data.deleted} pacientes excluídos com sucesso. ${data.failed > 0 ? `${data.failed} falharam.` : ''}`,
      });
      setSelectedIds([]);
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir pacientes",
        description: "Ocorreu um erro ao tentar excluir os pacientes selecionados.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePaciente = (id: number) => {
    deletePaciente(id);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length > 0) {
      deleteBatchMutation.mutate(selectedIds);
    }
  };

  const toggleSelectPaciente = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pacientesList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pacientesList.map(p => p.id));
    }
  };

  const handleEditPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsEditModalOpen(true);
  };

  const handleUpdatePaciente = (id: number, pacienteData: Partial<Paciente>) => {
    updatePaciente(id, pacienteData);
    setIsEditModalOpen(false);
    setSelectedPaciente(null);
  };

  const handleOpenOrientacoes = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setIsOrientacoesModalOpen(true);
  };

  const formatarData = (data: string | Date | null) => {
    if (!data) return 'Não definido';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Pacientes</h1>
          <p className="text-muted-foreground">
            Cadastro e pareamento de pacientes com unidades de saúde
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              data-testid="button-delete-selected"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)} data-testid="button-add-patient">
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPacientes}</p>
                <p className="text-sm text-muted-foreground">Total Pacientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pacientesVinculados}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPacientes - stats.pacientesVinculados}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.totalPacientes > 0 ? Math.round((stats.pacientesVinculados / stats.totalPacientes) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Pareados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Pacientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              className="flex-1"
            />
            <Button variant="outline">Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={selectedIds.length === pacientesList.length && pacientesList.length > 0}
              onCheckedChange={toggleSelectAll}
              data-testid="checkbox-select-all"
            />
            <h2 className="text-xl font-semibold">Lista de Pacientes</h2>
          </div>
          {selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} de {pacientesList.length} selecionados
            </span>
          )}
        </div>
        
        {pacientesList.map((paciente) => (
          <Card key={paciente.id} className={selectedIds.includes(paciente.id) ? 'ring-2 ring-primary' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={selectedIds.includes(paciente.id)}
                  onCheckedChange={() => toggleSelectPaciente(paciente.id)}
                  className="mt-1"
                  data-testid={`checkbox-paciente-${paciente.id}`}
                />
                <div className="flex-1">
              {/* Campos de Atendimento */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Último Atendimento:</span>
                    <span>{formatarData(paciente.ultimoAtendimento)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Próximo Atendimento:</span>
                    <span>{formatarData(paciente.proximoAtendimento)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{paciente.nome}</h3>
                    <Badge variant={paciente.ubsVinculada ? 'default' : 'secondary'}>
                      {paciente.ubsVinculada ? 'Ativo' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">CNS: {paciente.cns}</p>
                    <p className="text-sm text-muted-foreground">Idade: {paciente.idade} anos</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleOpenOrientacoes(paciente)}
                    data-testid={`button-orientacoes-paciente-${paciente.id}`}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Orientações
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditPaciente(paciente)}
                    data-testid={`button-edit-paciente-${paciente.id}`}
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
                        data-testid={`button-delete-paciente-${paciente.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o paciente "{paciente.nome}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeletePaciente(paciente.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {paciente.telefone}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {paciente.endereco}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  CNS: {paciente.cns}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  {(paciente.condicoesSaude || []).join(', ') || 'Nenhuma condição registrada'}
                </div>
              </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-delete-batch">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.length} paciente{selectedIds.length > 1 ? 's' : ''}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-batch-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBatchMutation.isPending}
              data-testid="button-confirm-batch-delete"
            >
              {deleteBatchMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PatientForm open={isFormOpen} onOpenChange={setIsFormOpen} />
      <EditPatientModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen}
        onEdit={handleUpdatePaciente}
        paciente={selectedPaciente}
      />
      <OrientacoesModal 
        open={isOrientacoesModalOpen}
        onOpenChange={setIsOrientacoesModalOpen}
        pacienteId={selectedPaciente?.id || 0}
        pacienteNome={selectedPaciente?.nome || ''}
      />
    </div>
  );
};

export default Pacientes;