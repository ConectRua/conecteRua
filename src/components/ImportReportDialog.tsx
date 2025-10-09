import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface ImportResult {
  linha: number;
  id?: number;
  nome: string;
  geocodificado?: boolean;
  precisao?: string | null;
  fonte?: string | null;
}

interface ImportReportData {
  total: number;
  sucesso: ImportResult[];
  erros: any[];
  avisos: any[];
  tempoDecorrido: number;
  loteProcessados: number;
}

interface ImportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: ImportReportData | null;
  onValidate?: () => void;
}

export function ImportReportDialog({ open, onOpenChange, reportData, onValidate }: ImportReportDialogProps) {
  if (!reportData) return null;

  const lowPrecisionCount = reportData.sucesso.filter(
    r => r.precisao === 'APPROXIMATE' || r.precisao === 'GEOMETRIC_CENTER' || !r.precisao
  ).length;

  const highPrecisionCount = reportData.sucesso.length - lowPrecisionCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-import-report">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Relatório de Importação
          </DialogTitle>
          <DialogDescription>
            Processamento concluído em {reportData.tempoDecorrido}s
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg" data-testid="stats-success">
              <div className="text-2xl font-bold text-green-600">{reportData.sucesso.length}</div>
              <div className="text-sm text-green-800">Importados</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg" data-testid="stats-errors">
              <div className="text-2xl font-bold text-red-600">{reportData.erros.length}</div>
              <div className="text-sm text-red-800">Erros</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg" data-testid="stats-warnings">
              <div className="text-2xl font-bold text-yellow-600">{reportData.avisos.length}</div>
              <div className="text-sm text-yellow-800">Avisos</div>
            </div>
          </div>

          {/* Precisão de Geocodificação */}
          {reportData.sucesso.length > 0 && (
            <div className="border rounded-lg p-4" data-testid="section-precision">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Precisão de Geocodificação
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Alta precisão: <strong>{highPrecisionCount}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Baixa precisão: <strong>{lowPrecisionCount}</strong></span>
                </div>
              </div>
              
              {lowPrecisionCount > 0 && (
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3" data-testid="alert-low-precision">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">
                        {lowPrecisionCount} {lowPrecisionCount === 1 ? 'registro necessita' : 'registros necessitam'} de validação manual
                      </p>
                      <p className="text-yellow-700 mt-1">
                        Esses registros foram geocodificados com precisão aproximada. 
                        Recomendamos validar e ajustar as coordenadas no mapa.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista de Erros */}
          {reportData.erros.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4" data-testid="section-errors">
              <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Erros ({reportData.erros.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {reportData.erros.map((erro, idx) => (
                  <div key={idx} className="text-sm bg-red-50 p-2 rounded">
                    <span className="font-medium">Linha {erro.linha}:</span> {erro.nome} - {erro.erro}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de Validação */}
          {lowPrecisionCount > 0 && onValidate && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
                Fechar
              </Button>
              <Button onClick={onValidate} className="bg-yellow-500 hover:bg-yellow-600" data-testid="button-validate">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Validar Coordenadas
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
