import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useReclassificar } from "@/hooks/useApiData";

interface ReclassificationModalProps {
  registro: {
    id: string;
    nome: string;
  };
  tipoAtual: 'ubs' | 'ongs' | 'equipamentos';
  onReclassified?: () => void;
}

const tipoLabels = {
  ubs: 'UBS - Unidade Básica de Saúde',
  ongs: 'ONG - Organização Não Governamental',
  equipamentos: 'Equipamento Social'
};

export function ReclassificationModal({ registro, tipoAtual, onReclassified }: ReclassificationModalProps) {
  const [novoTipo, setNovoTipo] = useState<'ubs' | 'ongs' | 'equipamentos' | ''>('');
  const [isOpen, setIsOpen] = useState(false);
  const reclassificarMutation = useReclassificar();

  const handleReclassificar = async () => {
    if (!novoTipo || novoTipo === tipoAtual) return;

    try {
      await reclassificarMutation.mutateAsync({
        id: registro.id,
        tipoOrigem: tipoAtual,
        tipoDestino: novoTipo
      });
      
      setIsOpen(false);
      setNovoTipo('');
      onReclassified?.();
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const tiposDisponiveis = (['ubs', 'ongs', 'equipamentos'] as const).filter(tipo => tipo !== tipoAtual);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-reclassify-${registro.id}`}>
          <ArrowRight className="h-4 w-4 mr-2" />
          Reclassificar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reclassificar Registro</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{registro.nome}</strong> será movido para uma nova categoria
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo Atual</Label>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border">
              {tipoLabels[tipoAtual]}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="novo-tipo">Novo Tipo</Label>
            <Select value={novoTipo} onValueChange={(value) => setNovoTipo(value as any)}>
              <SelectTrigger data-testid="select-new-type">
                <SelectValue placeholder="Selecione o novo tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposDisponiveis.map(tipo => (
                  <SelectItem key={tipo} value={tipo} data-testid={`option-${tipo}`}>
                    {tipoLabels[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              Esta ação não pode ser desfeita. O registro será permanentemente movido para a nova categoria.
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleReclassificar}
              disabled={!novoTipo || novoTipo === tipoAtual || reclassificarMutation.isPending}
              data-testid="button-confirm"
            >
              {reclassificarMutation.isPending ? 'Reclassificando...' : 'Reclassificar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}