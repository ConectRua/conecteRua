import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, Download, AlertCircle, X, CheckCircle, CheckCircle2, Plus, PlusCircle, Eye, Star } from 'lucide-react';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUploadPlanilha } from '@/hooks/useApiData';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PreviewRecord {
  id: string;
  tipo: 'ubs' | 'ongs' | 'equipamentos' | 'pacientes';
  linha: number;
  valido: boolean;
  erro?: string;
  nome: string;
  endereco: string;
  cep: string;
  telefone?: string;
  email?: string;
  tipoEquipamento?: string;
  horarioFuncionamento?: string;
  site?: string;
  responsavel?: string;
  idade?: number;
  existeNoGooglePlaces?: boolean;
  existeNoBanco?: boolean;
  status?: 'VALIDADO_GOOGLE' | 'DUPLICADO_BANCO' | 'NAO_ENCONTRADO_GOOGLE';
  placeId?: string;
  avaliacaoGoogle?: number;
  fotoGoogle?: string;
  avisoValidacao?: string;
  googleMatch?: {
    found: boolean;
    confidence: number;
    source: string;
    googlePlaceId?: string;
    rating?: number;
    photoUrl?: string;
  };
  latitude?: number;
  longitude?: number;
}

const ImportacaoPlanilhas = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState<'ubs' | 'ongs' | 'pacientes' | 'equipamentos' | 'auto' | null>('auto');
  const [previewData, setPreviewData] = useState<PreviewRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const uploadMutation = useUploadPlanilha();

  const acceptedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ];

  const validateFile = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Por favor, selecione apenas arquivos .xlsx, .xls ou .csv",
        variant: "destructive"
      });
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    });
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Arquivos selecionados",
        description: `${validFiles.length} arquivo(s) adicionado(s) com sucesso`,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Função para processar preview da planilha
  const handlePreview = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para importar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('arquivo', selectedFiles[0]); // Processar primeiro arquivo
      formData.append('tipo', selectedType || 'auto');
      
      const response = await fetch('/api/upload/preview', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPreviewData(data.registrosProcessados);
        setShowPreview(true);
        
        // Selecionar automaticamente todos os registros válidos
        const validRecordIds = new Set(
          data.registrosProcessados
            .filter((r: PreviewRecord) => r.valido)
            .map((r: PreviewRecord) => r.id)
        );
        setSelectedRecords(validRecordIds);
        
        toast({
          title: "Planilha processada",
          description: `${data.totalValidos} registros válidos de ${data.totalLinhas} encontrados`,
        });
      } else {
        toast({
          title: "Erro ao processar planilha",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao processar preview:', error);
      toast({
        title: "Erro ao processar planilha",
        description: "Ocorreu um erro ao processar a planilha",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para importar registros selecionados
  const handleImportSelected = async (recordIds?: string[]) => {
    const idsToImport = recordIds || Array.from(selectedRecords);
    
    if (idsToImport.length === 0) {
      toast({
        title: "Nenhum registro selecionado",
        description: "Por favor, selecione pelo menos um registro para importar",
        variant: "destructive"
      });
      return;
    }

    const registrosParaImportar = previewData.filter(r => idsToImport.includes(r.id));
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/upload/confirmar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ registros: registrosParaImportar }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Importação concluída",
          description: data.message,
        });
        
        // Limpar após importação bem-sucedida
        setPreviewData([]);
        setSelectedRecords(new Set());
        setSelectedFiles([]);
        setShowPreview(false);
      } else {
        toast({
          title: "Erro na importação",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar os registros",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para adicionar individualmente
  const handleAddIndividual = (recordId: string) => {
    handleImportSelected([recordId]);
  };

  // Função para adicionar todos
  const handleAddAll = () => {
    const allValidIds = previewData
      .filter(r => r.valido)
      .map(r => r.id);
    handleImportSelected(allValidIds);
  };

  // Toggle seleção de registro
  const toggleRecordSelection = (recordId: string) => {
    const newSelection = new Set(selectedRecords);
    if (newSelection.has(recordId)) {
      newSelection.delete(recordId);
    } else {
      newSelection.add(recordId);
    }
    setSelectedRecords(newSelection);
  };

  // Toggle seleção de todos
  const toggleSelectAll = () => {
    if (selectedRecords.size === previewData.filter(r => r.valido).length) {
      setSelectedRecords(new Set());
    } else {
      const allValidIds = new Set(
        previewData.filter(r => r.valido).map(r => r.id)
      );
      setSelectedRecords(allValidIds);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      'ubs': { label: 'UBS', variant: 'default' },
      'ongs': { label: 'ONG', variant: 'secondary' },
      'equipamentos': { label: 'Equipamento', variant: 'outline' },
      'pacientes': { label: 'Paciente', variant: 'destructive' }
    };
    
    return badges[tipo] || { label: tipo, variant: 'default' };
  };

  const renderStatusBadge = (record: PreviewRecord) => {
    if (!record.status) {
      return <Badge variant="outline" className="text-xs">Sem validação</Badge>;
    }

    const tooltipContent = (
      <div className="space-y-2 text-xs">
        {record.avisoValidacao && (
          <p className="font-medium">{record.avisoValidacao}</p>
        )}
        {record.existeNoGooglePlaces && record.googleMatch && (
          <div className="space-y-1 pt-2 border-t border-border">
            <p className="font-medium">Dados do Google Places:</p>
            {record.avaliacaoGoogle && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{record.avaliacaoGoogle.toFixed(1)} / 5.0</span>
              </div>
            )}
            {record.telefone && record.telefone !== '-' && (
              <p>📞 {record.telefone}</p>
            )}
            {record.latitude && record.longitude && (
              <p>📍 {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}</p>
            )}
            {record.googleMatch.confidence && (
              <p className="text-muted-foreground">
                Confiança: {record.googleMatch.confidence}%
              </p>
            )}
          </div>
        )}
      </div>
    );

    switch (record.status) {
      case 'VALIDADO_GOOGLE':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="cursor-help bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                  data-testid={`badge-validated-${record.id}`}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Validado Google
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      
      case 'DUPLICADO_BANCO':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="cursor-help bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                  data-testid={`badge-duplicate-${record.id}`}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Duplicado
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      
      case 'NAO_ENCONTRADO_GOOGLE':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="cursor-help bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800"
                  data-testid={`badge-not-found-${record.id}`}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Não encontrado
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      
      default:
        return <Badge variant="outline" className="text-xs">-</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Importação de Planilhas</h1>
        <p className="text-muted-foreground">
          Faça upload de dados em lote através de planilhas Excel ou CSV
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Carregar Dados
            </CardTitle>
            <CardDescription>
              Envie planilhas com dados de UBS, ONGs ou pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Dados</label>
                <Select value={selectedType || ''} onValueChange={(value) => setSelectedType(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de dados da planilha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" data-testid="option-auto">🤖 Detecção Automática</SelectItem>
                    <SelectItem value="ubs" data-testid="option-ubs">UBS - Unidades Básicas de Saúde</SelectItem>
                    <SelectItem value="ongs" data-testid="option-ongs">ONGs - Organizações Não Governamentais</SelectItem>
                    <SelectItem value="pacientes" data-testid="option-pacientes">Pacientes</SelectItem>
                    <SelectItem value="equipamentos" data-testid="option-equipamentos">Equipamentos Sociais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Arraste e solte seus arquivos aqui ou clique para selecionar
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Selecionar Arquivos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Arquivos Selecionados:</h4>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  onClick={handlePreview} 
                  className="w-full mt-4"
                  disabled={selectedFiles.length === 0 || !selectedType || isProcessing}
                  data-testid="button-preview"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processando...' : 'Visualizar Dados'}
                </Button>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Formatos aceitos: .xlsx, .xls, .csv (máximo 10MB)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Modelos de Planilha
            </CardTitle>
            <CardDescription>
              Baixe os modelos para facilitar a importação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Modelo - Dados UBS
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Modelo - Dados ONGs
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Modelo - Dados Pacientes
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Instruções de Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2">1. Prepare os Dados</h4>
              <p className="text-sm text-muted-foreground">
                Use os modelos fornecidos e preencha todas as colunas obrigatórias
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Valide o Formato</h4>
              <p className="text-sm text-muted-foreground">
                Certifique-se de que CEPs, telefones e coordenadas estejam corretos
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Faça o Carregamento</h4>
              <p className="text-sm text-muted-foreground">
                O sistema validará os dados antes de importar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Preview */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Dados Extraídos da Planilha
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleImportSelected()}
                  disabled={selectedRecords.size === 0 || isProcessing}
                  data-testid="button-add-selected"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Adicionar Selecionados ({selectedRecords.size})
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddAll}
                  disabled={isProcessing}
                  data-testid="button-add-all"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Adicionar Tudo
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Revise os dados antes de importar. Registros inválidos estão marcados em vermelho.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableCaption>
                  {previewData.filter(r => r.valido).length} registros válidos de {previewData.length} total
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRecords.size === previewData.filter(r => r.valido).length && selectedRecords.size > 0}
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead className="w-16">Linha</TableHead>
                    <TableHead className="w-24">Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>CEP</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-40">Status Validação</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((record) => {
                    const tipoBadge = getTipoBadge(record.tipo);
                    
                    return (
                      <TableRow 
                        key={record.id} 
                        className={!record.valido ? 'bg-red-50 dark:bg-red-950/20' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedRecords.has(record.id)}
                            onCheckedChange={() => toggleRecordSelection(record.id)}
                            disabled={!record.valido}
                            data-testid={`checkbox-record-${record.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.linha}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tipoBadge.variant as any}>
                            {tipoBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.nome || '-'}
                          {record.erro && (
                            <p className="text-xs text-red-500 mt-1">{record.erro}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.endereco || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.cep || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.telefone || '-'}
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(record)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddIndividual(record.id)}
                            disabled={!record.valido || isProcessing}
                            data-testid={`button-add-individual-${record.id}`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportacaoPlanilhas;