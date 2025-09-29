import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Save, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { OrientacaoEncaminhamento } from '../../../shared/schema';

interface OrientacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: number;
  pacienteNome: string;
}

export function OrientacoesModal({ open, onOpenChange, pacienteId, pacienteNome }: OrientacoesModalProps) {
  const [orientacoes, setOrientacoes] = useState<OrientacaoEncaminhamento[]>([]);
  const [proximaOrientacao, setProximaOrientacao] = useState('');
  const [observacoesSeguimento, setObservacoesSeguimento] = useState('');
  const [seguiuOrientacao, setSeguiuOrientacao] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Buscar orientações existentes
  useEffect(() => {
    if (open && pacienteId) {
      fetchOrientacoes();
    }
  }, [open, pacienteId]);

  const fetchOrientacoes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/pacientes/${pacienteId}/orientacoes`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrientacoes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar orientações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as orientações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvarOrientacao = async () => {
    if (!proximaOrientacao.trim()) {
      toast({
        title: "Erro",
        description: "A próxima orientação é obrigatória",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const orientacaoData = {
        pacienteId,
        orientacaoAnterior: orientacoes.length > 0 ? orientacoes[0].proximaOrientacao : null,
        proximaOrientacao,
        observacoesSeguimento: observacoesSeguimento || null,
        seguiuOrientacao,
        dataOrientacao: new Date(),
        ativo: true
      };

      await apiRequest('POST', '/api/orientacoes', orientacaoData);
      
      toast({
        title: "Sucesso",
        description: "Orientação salva com sucesso!",
      });

      // Limpar formulário e recarregar orientações
      setProximaOrientacao('');
      setObservacoesSeguimento('');
      setSeguiuOrientacao(null);
      await fetchOrientacoes();
      
    } catch (error) {
      console.error('Erro ao salvar orientação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a orientação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatarData = (data: string | Date) => {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const ultimaOrientacao = orientacoes[0]; // Já ordenado por data DESC na API

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Orientações de Encaminhamento - {pacienteNome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Última Orientação */}
          {ultimaOrientacao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Última Orientação
                  <Badge variant="outline">
                    {formatarData(ultimaOrientacao.dataOrientacao)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Orientação Dada:</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {ultimaOrientacao.proximaOrientacao}
                  </p>
                </div>
                
                {ultimaOrientacao.observacoesSeguimento && (
                  <div>
                    <Label className="text-sm font-medium">Observações de Seguimento:</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                      {ultimaOrientacao.observacoesSeguimento}
                    </p>
                  </div>
                )}
                
                {ultimaOrientacao.seguiuOrientacao !== null && (
                  <div>
                    <Label className="text-sm font-medium">Seguiu a Orientação:</Label>
                    <Badge 
                      variant={ultimaOrientacao.seguiuOrientacao ? "default" : "destructive"}
                      className="ml-2"
                    >
                      {ultimaOrientacao.seguiuOrientacao ? "Sim" : "Não"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Nova Orientação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nova Orientação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proxima-orientacao">Próxima Orientação *</Label>
                <Textarea
                  id="proxima-orientacao"
                  placeholder="Digite a orientação que será dada ao paciente..."
                  value={proximaOrientacao}
                  onChange={(e) => setProximaOrientacao(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-proxima-orientacao"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes-seguimento">Observações de Seguimento</Label>
                <Textarea
                  id="observacoes-seguimento"
                  placeholder="Observações sobre se o paciente seguiu orientações anteriores..."
                  value={observacoesSeguimento}
                  onChange={(e) => setObservacoesSeguimento(e.target.value)}
                  className="min-h-[80px]"
                  data-testid="textarea-observacoes-seguimento"
                />
              </div>

              {ultimaOrientacao && (
                <div className="space-y-2">
                  <Label>O paciente seguiu a orientação anterior?</Label>
                  <Select
                    onValueChange={(value) => setSeguiuOrientacao(value === 'true' ? true : value === 'false' ? false : null)}
                    value={seguiuOrientacao === null ? '' : String(seguiuOrientacao)}
                  >
                    <SelectTrigger data-testid="select-seguiu-orientacao">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim, seguiu a orientação</SelectItem>
                      <SelectItem value="false">Não seguiu a orientação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSalvarOrientacao}
                  disabled={isLoading || !proximaOrientacao.trim()}
                  data-testid="button-salvar-orientacao"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Orientação'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Orientações */}
          {orientacoes.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Orientações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orientacoes.slice(1).map((orientacao) => (
                    <div key={orientacao.id} className="border-l-4 border-muted pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {formatarData(orientacao.dataOrientacao)}
                        </Badge>
                        {orientacao.seguiuOrientacao !== null && (
                          <Badge 
                            variant={orientacao.seguiuOrientacao ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {orientacao.seguiuOrientacao ? "Seguiu" : "Não seguiu"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{orientacao.proximaOrientacao}</p>
                      {orientacao.observacoesSeguimento && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {orientacao.observacoesSeguimento}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}