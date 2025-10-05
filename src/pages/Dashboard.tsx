import { useApiData } from '@/hooks/useApiData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import { MapComponent } from '@/components/Map/MapComponent';
import { HealthChart } from '@/components/Analytics/HealthChart';
import { GeographicInsights } from '@/components/Analytics/GeographicInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Heart, 
  TrendingUp,
  MapPin,
  Activity,
  Clock,
  Phone,
  BarChart3,
  Map as MapIcon,
  Home
} from 'lucide-react';
import { useState } from 'react';
import { AddEquipamentoModal } from '@/components/Forms/AddEquipamentoModal';
import { EquipamentoSocialIcon } from '@/components/icons/EquipamentoSocialIcon';

const Dashboard = () => {
  // Use real API data directly
  const { ubsList, ongsList, pacientesList, equipamentosSociais, getEstatisticas, loading, error, addEquipamentoSocial } = useApiData();
  const [showAddEquipamento, setShowAddEquipamento] = useState(false);
  
  const analytics = useAnalytics(ubsList, pacientesList, equipamentosSociais);
  const stats = getEstatisticas();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-hero rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Sistema de Georreferenciamento
        </h1>
        <p className="text-white/90 text-lg">
          Assistência Social e Saúde - Samambaia, Recanto das Emas e Águas Claras
        </p>
        <div className="flex items-center mt-4 space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Sistema Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Última atualização: Agora</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total UBS"
          value={stats.totalUBS}
          description="Unidades Básicas de Saúde"
          icon={Building2}
          trend={{ value: 12, label: "este mês", isPositive: true }}
        />
        <StatsCard
          title="ONGs/Instituições"
          value={stats.totalONGs}
          description="Organizações cadastradas"
          icon={Heart}
          trend={{ value: 8, label: "este mês", isPositive: true }}
        />
        <StatsCard
          title="Equipamentos Sociais"
          value={equipamentosSociais.length}
          description="Equipamentos cadastrados"
          icon={MapPin}
          trend={{ value: 94, label: "total", isPositive: true }}
        />
        <StatsCard
          title="Pacientes"
          value={stats.totalPacientes}
          description="Cadastros ativos"
          icon={Users}
          trend={{ value: 15, label: "este mês", isPositive: true }}
        />
        <StatsCard
          title="Taxa de Vinculação"
          value={`${Math.round((stats.pacientesVinculados / stats.totalPacientes) * 100)}%`}
          description="Pacientes com UBS vinculada"
          icon={TrendingUp}
          trend={{ value: 5, label: "melhoria", isPositive: true }}
        />
      </div>

      {/* Main Content - Tabs for different views */}
      <Tabs defaultValue="mapa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mapa" className="flex items-center space-x-2">
            <MapIcon className="h-4 w-4" />
            <span>Mapa Interativo</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics Avançados</span>
          </TabsTrigger>
          <TabsTrigger value="geografia" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Análise Geográfica</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map Section - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Mapa da Rede de Assistência</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MapComponent height="500px" />
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>UBS ({ubsList.length})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>ONGs ({ongsList.length})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>Equipamentos ({equipamentosSociais.length})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Pacientes ({pacientesList.length})</span>
                      </div>
                    </div>
                    <Button size="sm">
                      Ver Mapa Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Coverage by Region */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cobertura por Região</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(stats.coberturaPorRegiao).map(([regiao, count]) => (
                    <div key={regiao} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{regiao}</span>
                      <Badge variant="secondary">{Number(count) || 0} pacientes</Badge>
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-accent rounded-lg">
                    <div className="text-sm text-muted-foreground">Distância Média</div>
                    <div className="text-lg font-semibold">
                      {stats.distanciaMedia.toFixed(1)} km
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Atividades Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Hospital Regional adicionado</p>
                        <p className="text-xs text-muted-foreground">Hospital Regional de Samambaia - há 1 hora</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Equipamentos sociais mapeados</p>
                        <p className="text-xs text-muted-foreground">94 equipamentos cadastrados - há 30 min</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Paciente vinculado</p>
                        <p className="text-xs text-muted-foreground">Ana Paula - UBS mais próxima</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Relatório gerado</p>
                        <p className="text-xs text-muted-foreground">Estatísticas mensais</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" size="sm">
                    <Building2 className="h-4 w-4 mr-2" />
                    Cadastrar UBS
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Adicionar ONG
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddEquipamento(true)}
                  >
                    <EquipamentoSocialIcon className="h-4 w-4 mr-2" />
                    Novo Equipamento Social
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Importar Pacientes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <HealthChart 
            data={{
              especialidades: analytics.especialidades,
              necessidades: analytics.necessidades,
              tiposEquipamentos: analytics.tiposEquipamentos,
              distribuicaoIdade: analytics.distribuicaoIdade
            }}
          />
        </TabsContent>

        <TabsContent value="geografia" className="space-y-6">
          <GeographicInsights 
            data={{
              coberturaRegional: analytics.coberturaRegional,
              metricas: analytics.metricas
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Add Equipamento Social Modal */}
      <AddEquipamentoModal
        open={showAddEquipamento}
        onOpenChange={setShowAddEquipamento}
        onAdd={(equipamento) => {
          addEquipamentoSocial(equipamento);
          setShowAddEquipamento(false);
        }}
      />
    </div>
  );
};

export default Dashboard;