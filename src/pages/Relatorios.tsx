import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Calendar, FileText, TrendingUp, Users, Building2 } from 'lucide-react';

const Relatorios = () => {
  const reports = [
    {
      id: 1,
      name: "Atendimentos Mensais",
      description: "Relatório de atendimentos por UBS no último mês",
      type: "Mensal",
      lastGenerated: "15/03/2024",
      status: "Pronto"
    },
    {
      id: 2,
      name: "Distribuição Geográfica",
      description: "Análise da cobertura territorial dos serviços",
      type: "Trimestral",
      lastGenerated: "01/03/2024",
      status: "Pronto"
    },
    {
      id: 3,
      name: "Indicadores de Saúde",
      description: "KPIs de desempenho das unidades de saúde",
      type: "Semanal",
      lastGenerated: "Em processamento",
      status: "Processando"
    }
  ];

  const stats = [
    {
      title: "Total de Atendimentos",
      value: "12,345",
      change: "+15%",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "UBS Ativas",
      value: "24",
      change: "+2",
      icon: Building2,
      color: "text-green-600"
    },
    {
      title: "Cobertura Populacional",
      value: "87%",
      change: "+3%",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Satisfação Média",
      value: "4.2/5",
      change: "+0.3",
      icon: BarChart3,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios e Análises</h1>
          <p className="text-muted-foreground">
            Visualize dados e estatísticas do sistema de saúde
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gráfico de Atendimentos
          </CardTitle>
          <CardDescription>
            Evolução dos atendimentos nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Gráfico será renderizado aqui</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios Disponíveis
          </CardTitle>
          <CardDescription>
            Gere e baixe relatórios personalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{report.name}</h4>
                    <Badge variant={report.status === 'Pronto' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                    <Badge variant="outline">{report.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{report.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Última geração: {report.lastGenerated}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Visualizar
                  </Button>
                  {report.status === 'Pronto' && (
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;