import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Download, AlertCircle, X, CheckCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const ImportacaoPlanilhas = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para importar",
        variant: "destructive"
      });
      return;
    }

    // Simular upload
    toast({
      title: "Importação iniciada",
      description: `Processando ${selectedFiles.length} arquivo(s)...`,
    });

    // Aqui seria implementada a lógica real de upload
    setTimeout(() => {
      toast({
        title: "Importação concluída",
        description: "Todos os arquivos foram processados com sucesso",
      });
      setSelectedFiles([]);
    }, 2000);
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
                <Button onClick={handleUpload} className="w-full mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Arquivos ({selectedFiles.length})
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
    </div>
  );
};

export default ImportacaoPlanilhas;