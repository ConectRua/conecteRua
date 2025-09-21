import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Users, Building2, Clock } from 'lucide-react';

interface GeographicInsightsProps {
  data: {
    coberturaRegional: Array<{
      regiao: string;
      ubsCount: number;
      pacientesCount: number;
      distanciaMedia: number;
      cobertura: number;
      status: 'excelente' | 'boa' | 'regular' | 'precária';
    }>;
    metricas: {
      menorDistancia: number;
      maiorDistancia: number;
      mediaGeral: number;
      pacientesSemVinculacao: number;
    };
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excelente': return 'bg-green-500';
    case 'boa': return 'bg-blue-500';
    case 'regular': return 'bg-yellow-500';
    case 'precária': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'excelente': return 'default';
    case 'boa': return 'secondary';
    case 'regular': return 'outline';
    case 'precária': return 'destructive';
    default: return 'default';
  }
};

export const GeographicInsights = ({ data }: GeographicInsightsProps) => {
  return (
    <div className="grid gap-6">
      {/* Métricas Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <div className="text-sm text-muted-foreground">Menor Distância</div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {data.metricas.menorDistancia.toFixed(1)} km
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-red-600" />
              <div className="text-sm text-muted-foreground">Maior Distância</div>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {data.metricas.maiorDistancia.toFixed(1)} km
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="text-sm text-muted-foreground">Distância Média</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {data.metricas.mediaGeral.toFixed(1)} km
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div className="text-sm text-muted-foreground">Sem Vinculação</div>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {data.metricas.pacientesSemVinculacao}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Região */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise de Cobertura por Região</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.coberturaRegional.map((regiao, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{regiao.regiao}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>{regiao.ubsCount} UBS</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{regiao.pacientesCount} pacientes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{regiao.distanciaMedia.toFixed(1)} km média</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(regiao.status)}>
                    {regiao.status.charAt(0).toUpperCase() + regiao.status.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cobertura da Região</span>
                    <span className="font-medium">{regiao.cobertura}%</span>
                  </div>
                  <Progress 
                    value={regiao.cobertura} 
                    className="h-2"
                  />
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  {regiao.status === 'excelente' && "✅ Cobertura adequada com boa distribuição"}
                  {regiao.status === 'boa' && "✅ Cobertura satisfatória"}
                  {regiao.status === 'regular' && "⚠️ Cobertura moderada, pode melhorar"}
                  {regiao.status === 'precária' && "🚨 Necessita melhorias urgentes na cobertura"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};