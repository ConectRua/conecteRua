import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AtividadeTerritorial } from '../../shared/schema';
import { useToast } from '@/hooks/use-toast';

const regioes = [
  'Todas as Regiões',
  'Samambaia',
  'Recanto das Emas',
  'Água Quente'
];

const Relatorios = () => {
  const [dataInicial, setDataInicial] = useState<Date>();
  const [dataFinal, setDataFinal] = useState<Date>();
  const [regiao, setRegiao] = useState<string>('Todas as Regiões');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: atividades = [], isLoading } = useQuery<AtividadeTerritorial[]>({
    queryKey: ['/api/atividades-territoriais'],
    queryFn: async () => {
      const response = await fetch('/api/atividades-territoriais', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao buscar atividades');
      return response.json();
    },
  });

  const filtrarAtividades = (atividades: AtividadeTerritorial[]) => {
    let filtradas = [...atividades];

    // Filtrar por período
    if (dataInicial) {
      filtradas = filtradas.filter(a => {
        if (!a.dataAtividade) return false;
        const dataAtiv = new Date(a.dataAtividade);
        return dataAtiv >= dataInicial;
      });
    }

    if (dataFinal) {
      filtradas = filtradas.filter(a => {
        if (!a.dataAtividade) return false;
        const dataAtiv = new Date(a.dataAtividade);
        const dataFinalAjustada = new Date(dataFinal);
        dataFinalAjustada.setHours(23, 59, 59, 999);
        return dataAtiv <= dataFinalAjustada;
      });
    }

    // Filtrar por região (se não for "Todas")
    if (regiao !== 'Todas as Regiões') {
      filtradas = filtradas.filter(a => a.regiao === regiao);
    }

    return filtradas;
  };

  const gerarPDF = () => {
    if (!dataInicial || !dataFinal) {
      toast({
        title: 'Atenção',
        description: 'Selecione as datas inicial e final',
        variant: 'destructive',
      });
      return;
    }

    const atividadesFiltradas = filtrarAtividades(atividades);

    if (atividadesFiltradas.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Nenhuma atividade encontrada para os filtros selecionados',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Função para adicionar seção por região
      const adicionarSecaoRegiao = (regiaoNome: string, atividadesRegiao: AtividadeTerritorial[]) => {
        // Título fixo
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('MAPA GEORREFERENCIADO - EQUIPE ECR SAMAMBAIA', pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 10;
        
        // Subtítulo dinâmico
        doc.setFontSize(14);
        doc.text(`LOCAIS DE ABORDAGEM - ${regiaoNome.toUpperCase()}`, pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 15;

        // Para cada atividade
        atividadesRegiao.forEach((atividade, index) => {
          // Verificar se precisa de nova página
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(11);
          
          // ☐ **[TÍTULO EM NEGRITO]**
          doc.setFont('helvetica', 'bold');
          doc.text(`☐ ${atividade.titulo}`, 15, yPosition);
          yPosition += 7;

          doc.setFont('helvetica', 'normal');
          
          // ☐ Coordenadas
          const coords = `${atividade.latitude.toFixed(6)}, ${atividade.longitude.toFixed(6)}`;
          doc.text(`☐ Coordenadas: ${coords}`, 15, yPosition);
          yPosition += 7;

          // ☐ Quantidade de pessoas
          const qtdFormatada = atividade.quantidadePessoas.toString().padStart(2, '0');
          doc.text(`☐ Quantidade de pessoas: ${qtdFormatada} PSR`, 15, yPosition);
          yPosition += 7;

          // ☐ Descrição do local
          doc.text(`☐ Descrição do local: ${atividade.descricaoLocal}`, 15, yPosition);
          yPosition += 10;

          // Espaço entre atividades
          if (index < atividadesRegiao.length - 1) {
            yPosition += 5;
          }
        });
      };

      // Se "Todas as Regiões", criar seções separadas
      if (regiao === 'Todas as Regiões') {
        const regioesUnicas = [...new Set(atividadesFiltradas.map(a => a.regiao).filter(Boolean))];
        
        regioesUnicas.forEach((regiaoNome, index) => {
          if (index > 0) {
            doc.addPage();
            yPosition = 20;
          }
          
          const atividadesRegiao = atividadesFiltradas.filter(a => a.regiao === regiaoNome);
          adicionarSecaoRegiao(regiaoNome || 'Sem Região', atividadesRegiao);
        });
      } else {
        // Uma única região
        adicionarSecaoRegiao(regiao, atividadesFiltradas);
      }

      // Salvar PDF
      const nomeArquivo = `mapa_georreferenciado_${regiao.toLowerCase().replace(/\s/g, '_')}_${format(dataInicial, 'dd-MM-yyyy')}_${format(dataFinal, 'dd-MM-yyyy')}.pdf`;
      doc.save(nomeArquivo);

      toast({
        title: 'Sucesso',
        description: `PDF gerado com ${atividadesFiltradas.length} atividades`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar o PDF. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const atividadesFiltradas = filtrarAtividades(atividades);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios Georreferenciados</h1>
        <p className="text-muted-foreground">
          Gere relatórios PDF com as atividades territoriais registradas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mapa Georreferenciado
          </CardTitle>
          <CardDescription>
            Configure os filtros e gere o relatório em PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Data Inicial */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataInicial && 'text-muted-foreground'
                    )}
                    data-testid="button-data-inicial"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicial ? format(dataInicial, 'dd/MM/yyyy') : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicial}
                    onSelect={setDataInicial}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Final */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataFinal && 'text-muted-foreground'
                    )}
                    data-testid="button-data-final"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFinal ? format(dataFinal, 'dd/MM/yyyy') : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFinal}
                    onSelect={setDataFinal}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Região */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Região</label>
              <Select value={regiao} onValueChange={setRegiao}>
                <SelectTrigger data-testid="select-regiao">
                  <SelectValue placeholder="Selecione a região" />
                </SelectTrigger>
                <SelectContent>
                  {regioes.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview de dados */}
          <div className="rounded-lg border p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Atividades encontradas: {isLoading ? '...' : atividadesFiltradas.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dataInicial && dataFinal
                    ? `Período: ${format(dataInicial, 'dd/MM/yyyy')} a ${format(dataFinal, 'dd/MM/yyyy')}`
                    : 'Selecione o período para filtrar'}
                </p>
              </div>
              <Button
                onClick={gerarPDF}
                disabled={isGenerating || isLoading || !dataInicial || !dataFinal}
                data-testid="button-gerar-pdf"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Mapa Georreferenciado
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Lista de preview */}
          {atividadesFiltradas.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Preview das Atividades:</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {atividadesFiltradas.map((atividade) => (
                  <div
                    key={atividade.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <p className="font-medium">{atividade.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {atividade.regiao} • {atividade.quantidadePessoas} PSR
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;
