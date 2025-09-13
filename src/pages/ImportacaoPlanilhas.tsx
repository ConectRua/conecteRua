import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Download, AlertCircle } from 'lucide-react';

const ImportacaoPlanilhas = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Import de Planilhas</h1>
        <p className="text-muted-foreground">
          Faça upload de dados em lote através de planilhas Excel ou CSV
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Dados
            </CardTitle>
            <CardDescription>
              Envie planilhas com dados de UBS, ONGs ou pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Arraste e solte seus arquivos aqui ou clique para selecionar
              </p>
              <Button>
                Selecionar Arquivos
              </Button>
            </div>
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
            Instruções de Import
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
              <h4 className="font-medium mb-2">3. Faça o Upload</h4>
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