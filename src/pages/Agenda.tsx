import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, MapPin, Phone } from 'lucide-react';
import { useApiData } from '@/hooks/useApiData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Agenda = () => {
  const { pacientesList, loading } = useApiData();
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  // Filtrar pacientes que têm datas de atendimento
  const pacientesComAtendimento = pacientesList.filter(paciente => 
    paciente.ultimoAtendimento || paciente.proximoAtendimento
  );

  // Separar por último atendimento (já atendidos)
  const pacientesAtendidos = pacientesComAtendimento.filter(paciente => 
    paciente.ultimoAtendimento
  ).sort((a, b) => {
    if (!a.ultimoAtendimento || !b.ultimoAtendimento) return 0;
    return new Date(b.ultimoAtendimento).getTime() - new Date(a.ultimoAtendimento).getTime();
  });

  // Separar por próximo atendimento (agendados)
  const pacientesAgendados = pacientesComAtendimento.filter(paciente => 
    paciente.proximoAtendimento
  ).sort((a, b) => {
    if (!a.proximoAtendimento || !b.proximoAtendimento) return 0;
    return new Date(a.proximoAtendimento).getTime() - new Date(b.proximoAtendimento).getTime();
  });

  const formatarData = (data: string | Date | null) => {
    if (!data) return '';
    try {
      return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return '';
    }
  };

  const formatarDataCurta = (data: string | Date | null) => {
    if (!data) return '';
    try {
      return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return '';
    }
  };

  const isDataProxima = (data: string | Date | null) => {
    if (!data) return false;
    const dataAtendimento = new Date(data);
    const hoje = new Date();
    const diferenca = dataAtendimento.getTime() - hoje.getTime();
    const dias = Math.ceil(diferenca / (1000 * 3600 * 24));
    return dias <= 7 && dias >= 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda de Atendimentos</h1>
          <p className="text-muted-foreground mt-2">
            Visualize quem foi atendido e próximos agendamentos
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pacientesList.length}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Já Atendidos</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{pacientesAtendidos.length}</div>
            <p className="text-xs text-muted-foreground">Com último atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pacientesAgendados.length}</div>
            <p className="text-xs text-muted-foreground">Com próximo agendamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 dias</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pacientesAgendados.filter(p => isDataProxima(p.proximoAtendimento)).length}
            </div>
            <p className="text-xs text-muted-foreground">Atendimentos próximos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="agendados" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agendados" data-testid="tab-agendados">
            Próximos Atendimentos ({pacientesAgendados.length})
          </TabsTrigger>
          <TabsTrigger value="atendidos" data-testid="tab-atendidos">
            Últimos Atendimentos ({pacientesAtendidos.length})
          </TabsTrigger>
        </TabsList>

        {/* Próximos Atendimentos */}
        <TabsContent value="agendados" className="space-y-4">
          {pacientesAgendados.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum atendimento agendado
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Adicione datas de próximo atendimento nos cadastros dos pacientes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pacientesAgendados.map((paciente) => (
                <Card key={paciente.id} className="hover:shadow-md transition-shadow" data-testid={`card-agendado-${paciente.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{paciente.nome}</CardTitle>
                      {isDataProxima(paciente.proximoAtendimento) && (
                        <Badge variant="default" className="bg-amber-500">
                          Próximo
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Próximo Atendimento:</span>
                    </div>
                    <p className="text-sm font-medium text-blue-600 pl-6">
                      {formatarData(paciente.proximoAtendimento)}
                    </p>

                    {paciente.ultimoAtendimento && (
                      <>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span>Último atendimento:</span>
                          <span className="text-muted-foreground">
                            {formatarDataCurta(paciente.ultimoAtendimento)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{paciente.idade} anos</span>
                        {paciente.telefone && (
                          <>
                            <Phone className="h-4 w-4 ml-2" />
                            <span>{paciente.telefone}</span>
                          </>
                        )}
                      </div>
                      {paciente.endereco && (
                        <div className="flex items-start space-x-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span className="line-clamp-2">{paciente.endereco}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Últimos Atendimentos */}
        <TabsContent value="atendidos" className="space-y-4">
          {pacientesAtendidos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhum atendimento registrado
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Adicione datas de último atendimento nos cadastros dos pacientes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pacientesAtendidos.map((paciente) => (
                <Card key={paciente.id} className="hover:shadow-md transition-shadow" data-testid={`card-atendido-${paciente.id}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{paciente.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Último Atendimento:</span>
                    </div>
                    <p className="text-sm font-medium text-green-600 pl-6">
                      {formatarData(paciente.ultimoAtendimento)}
                    </p>

                    {paciente.proximoAtendimento && (
                      <>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>Próximo agendamento:</span>
                          <span className="text-muted-foreground">
                            {formatarDataCurta(paciente.proximoAtendimento)}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{paciente.idade} anos</span>
                        {paciente.telefone && (
                          <>
                            <Phone className="h-4 w-4 ml-2" />
                            <span>{paciente.telefone}</span>
                          </>
                        )}
                      </div>
                      {paciente.endereco && (
                        <div className="flex items-start space-x-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span className="line-clamp-2">{paciente.endereco}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Agenda;