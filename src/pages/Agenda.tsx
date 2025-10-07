import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DayPicker } from 'react-day-picker';
import { Calendar, Clock, User, MapPin, Phone, ChevronLeft, ChevronRight, Route, Navigation, ExternalLink, MoreVertical, Trash2, CalendarClock, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { useApiData } from '@/hooks/useApiData';
import { format, startOfMonth, startOfWeek, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentLocation } from '@/lib/geolocation-helper';

type EventType = {
  paciente: any;
  date: Date;
  type: 'ultimo' | 'proximo';
};

const Agenda = () => {
  const { pacientesList, loading } = useApiData();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedPacienteForReschedule, setSelectedPacienteForReschedule] = useState<any>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState<Date | undefined>(undefined);
  const [addAppointmentDialogOpen, setAddAppointmentDialogOpen] = useState(false);
  const [selectedPacienteForAdd, setSelectedPacienteForAdd] = useState<any>(null);
  const [addAppointmentDate, setAddAppointmentDate] = useState<Date | undefined>(undefined);
  const [openCombobox, setOpenCombobox] = useState(false);
  const { toast } = useToast();

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

  // Mapear eventos por data para o calendário
  const eventsByDate = useMemo(() => {
    const events: { [key: string]: EventType[] } = {};
    
    pacientesComAtendimento.forEach(paciente => {
      if (paciente.ultimoAtendimento) {
        const dateKey = format(new Date(paciente.ultimoAtendimento), 'yyyy-MM-dd');
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push({
          paciente,
          date: new Date(paciente.ultimoAtendimento),
          type: 'ultimo'
        });
      }
      
      if (paciente.proximoAtendimento) {
        const dateKey = format(new Date(paciente.proximoAtendimento), 'yyyy-MM-dd');
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push({
          paciente,
          date: new Date(paciente.proximoAtendimento),
          type: 'proximo'
        });
      }
    });
    
    return events;
  }, [pacientesComAtendimento]);

  // Obter eventos do dia selecionado
  const selectedDateEvents = selectedCalendarDate 
    ? eventsByDate[format(selectedCalendarDate, 'yyyy-MM-dd')] || []
    : [];

  // Filtrar apenas próximos atendimentos (visitas agendadas) com coordenadas válidas
  const proximosAtendimentosComCoordenadas = useMemo(() => {
    return selectedDateEvents
      .filter(event => event.type === 'proximo')
      .filter(event => event.paciente.latitude && event.paciente.longitude)
      .map(event => ({
        id: event.paciente.id,
        nome: event.paciente.nome,
        latitude: event.paciente.latitude,
        longitude: event.paciente.longitude,
        endereco: event.paciente.endereco
      }));
  }, [selectedDateEvents]);

  // Mutation para calcular rota otimizada
  const optimizeRouteMutation = useMutation({
    mutationFn: async () => {
      if (proximosAtendimentosComCoordenadas.length < 1) {
        throw new Error('É necessário pelo menos 1 paciente agendado para otimizar rota');
      }

      // Capturar localização atual do usuário
      return new Promise((resolve, reject) => {
        getCurrentLocation({
          onSuccess: async (location) => {
            try {
              // Usar localização atual como origem
              const origin = {
                id: 0, // ID especial para localização atual
                nome: 'Sua Localização',
                latitude: parseFloat(location.latitude),
                longitude: parseFloat(location.longitude),
                endereco: 'Localização Atual'
              };
              
              // Todos os pacientes agendados são destinos
              const destinations = proximosAtendimentosComCoordenadas;

              const response = await fetch('/api/routes/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ origin, destinations })
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao calcular rota');
              }

              const result = await response.json();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
          onError: (error) => {
            reject(new Error('Não foi possível obter sua localização'));
          }
        });
      });
    },
    onSuccess: (data: any) => {
      setOptimizedRoute(data);
      
      // Verificar se foi usado cálculo aproximado
      const isApproximateCalculation = data.errorMessage?.includes('aproximada');
      
      toast({
        title: isApproximateCalculation ? "Rota calculada (aproximada)" : "Rota otimizada calculada!",
        description: isApproximateCalculation 
          ? `⚠️ ${data.errorMessage}. Distância: ${data.totalDistanceText}, Tempo estimado: ${data.totalDurationText}`
          : `Distância total: ${data.totalDistanceText}, Tempo: ${data.totalDurationText}`,
        variant: isApproximateCalculation ? "default" : "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao calcular rota",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Limpar rota otimizada quando a data selecionada mudar
  useEffect(() => {
    setOptimizedRoute(null);
  }, [selectedCalendarDate]);

  // Mutation para remover da agenda (limpar proximoAtendimento)
  const removeFromAgendaMutation = useMutation({
    mutationFn: async (pacienteId: number) => {
      const response = await fetch(`/api/pacientes/${pacienteId}/agendamento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ proximoAtendimento: null })
      });

      if (!response.ok) {
        throw new Error('Erro ao remover agendamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pacientes'] });
      toast({
        title: "Removido da agenda",
        description: "O agendamento foi removido com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para remarcar agendamento
  const rescheduleMutation = useMutation({
    mutationFn: async ({ pacienteId, newDate }: { pacienteId: number; newDate: Date }) => {
      const response = await fetch(`/api/pacientes/${pacienteId}/agendamento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ proximoAtendimento: newDate.toISOString() })
      });

      if (!response.ok) {
        throw new Error('Erro ao remarcar agendamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pacientes'] });
      toast({
        title: "Agendamento remarcado",
        description: "A data foi atualizada com sucesso."
      });
      setRescheduleDialogOpen(false);
      setSelectedPacienteForReschedule(null);
      setNewAppointmentDate(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remarcar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para adicionar novo agendamento
  const addAppointmentMutation = useMutation({
    mutationFn: async ({ pacienteId, date }: { pacienteId: number; date: Date }) => {
      const response = await fetch(`/api/pacientes/${pacienteId}/agendamento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ proximoAtendimento: date.toISOString() })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar agendamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pacientes'] });
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso."
      });
      setAddAppointmentDialogOpen(false);
      setSelectedPacienteForAdd(null);
      setAddAppointmentDate(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Funções auxiliares
  const handleRemoveFromAgenda = (paciente: any) => {
    if (confirm(`Deseja remover ${paciente.nome} da agenda?`)) {
      removeFromAgendaMutation.mutate(paciente.id);
    }
  };

  const handleReschedule = (paciente: any) => {
    setSelectedPacienteForReschedule(paciente);
    setNewAppointmentDate(paciente.proximoAtendimento ? new Date(paciente.proximoAtendimento) : undefined);
    setRescheduleDialogOpen(true);
  };

  const confirmReschedule = () => {
    if (!selectedPacienteForReschedule || !newAppointmentDate) return;
    
    rescheduleMutation.mutate({
      pacienteId: selectedPacienteForReschedule.id,
      newDate: newAppointmentDate
    });
  };

  const handleAddAppointment = () => {
    setAddAppointmentDialogOpen(true);
    setSelectedPacienteForAdd(null);
    setAddAppointmentDate(undefined);
  };

  const confirmAddAppointment = () => {
    if (!selectedPacienteForAdd || !addAppointmentDate) return;
    
    addAppointmentMutation.mutate({
      pacienteId: selectedPacienteForAdd.id,
      date: addAppointmentDate
    });
  };

  // Função para gerar URL do Google Maps com a rota otimizada
  const generateGoogleMapsUrl = () => {
    if (!optimizedRoute || proximosAtendimentosComCoordenadas.length === 0) return '';

    // Origem: localização atual do usuário (armazenada na rota otimizada)
    const originCoords = optimizedRoute.userLocation 
      ? `${optimizedRoute.userLocation.latitude},${optimizedRoute.userLocation.longitude}`
      : '';

    if (!originCoords) return '';

    // Destino: último paciente na ordem otimizada
    const lastIndex = optimizedRoute.optimizedOrder[optimizedRoute.optimizedOrder.length - 1];
    const destination = proximosAtendimentosComCoordenadas[lastIndex];
    const destinationCoords = `${destination.latitude},${destination.longitude}`;

    // Waypoints: pacientes intermediários na ordem otimizada
    const waypoints = optimizedRoute.optimizedOrder
      .slice(0, -1) // Remove o último (que já é o destino)
      .map((index: number) => {
        const paciente = proximosAtendimentosComCoordenadas[index];
        return `${paciente.latitude},${paciente.longitude}`;
      })
      .join('|');

    // Montar URL do Google Maps
    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const params = new URLSearchParams({
      origin: originCoords,
      destination: destinationCoords,
      travelmode: 'driving'
    });

    if (waypoints) {
      params.append('waypoints', waypoints);
    }

    return `${baseUrl}&${params.toString()}`;
  };

  // Navegar entre meses
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

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

  // Componente customizado para os dias do calendário
  const DayContent = ({ date, isCurrentMonth }: { date: Date; isCurrentMonth: boolean }) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEvents = isCurrentMonth ? eventsByDate[dateKey] || [] : [];
    const hasEvents = dayEvents.length > 0;
    const proximoCount = dayEvents.filter(e => e.type === 'proximo').length;
    const ultimoCount = dayEvents.filter(e => e.type === 'ultimo').length;
    
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span className={cn(
          "text-sm",
          isSameDay(date, new Date()) && "font-bold",
          hasEvents && "font-medium",
          !isCurrentMonth && "opacity-50"
        )}>
          {format(date, 'd')}
        </span>
        {hasEvents && (
          <div className="absolute bottom-0.5 flex items-center space-x-0.5">
            {proximoCount > 0 && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${proximoCount} próximo(s) atendimento(s)`} />
            )}
            {ultimoCount > 0 && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title={`${ultimoCount} último(s) atendimento(s)`} />
            )}
            {dayEvents.length > 2 && (
              <span className="text-xs bg-gray-500 text-white rounded-full px-1 min-w-4 h-4 flex items-center justify-center">
                {dayEvents.length}
              </span>
            )}
          </div>
        )}
      </div>
    );
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
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
          <Button 
            onClick={handleAddAppointment}
            data-testid="button-add-appointment"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agendados" data-testid="tab-agendados">
            Próximos Atendimentos ({pacientesAgendados.length})
          </TabsTrigger>
          <TabsTrigger value="atendidos" data-testid="tab-atendidos">
            Últimos Atendimentos ({pacientesAtendidos.length})
          </TabsTrigger>
          <TabsTrigger value="calendario" data-testid="tab-calendario">
            Calendário
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

        {/* Calendário */}
        <TabsContent value="calendario" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendário */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>{format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousMonth}
                        data-testid="btn-previous-month"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextMonth}
                        data-testid="btn-next-month"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Próximos atendimentos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Últimos atendimentos</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {eachDayOfInterval({
                      start: startOfWeek(startOfMonth(currentMonth), { locale: ptBR, weekStartsOn: 0 }),
                      end: addDays(startOfWeek(startOfMonth(currentMonth), { locale: ptBR, weekStartsOn: 0 }), 41)
                    }).map((date, index) => {
                      const dateKey = format(date, 'yyyy-MM-dd');
                      const hasEvents = eventsByDate[dateKey]?.length > 0;
                      const isSelected = selectedCalendarDate && isSameDay(date, selectedCalendarDate);
                      const isToday = isSameDay(date, new Date());
                      const isCurrentMonth = isSameMonth(date, currentMonth);
                      
                      return (
                        <Button
                          key={index}
                          variant={isSelected ? "default" : "ghost"}
                          className={cn(
                            "h-16 p-1 relative",
                            isToday && !isSelected && "border border-primary",
                            hasEvents && "hover:bg-muted",
                            !isCurrentMonth && "text-muted-foreground bg-muted/30"
                          )}
                          onClick={() => setSelectedCalendarDate(date)}
                          data-testid={`day-${dateKey}`}
                        >
                          <DayContent date={date} isCurrentMonth={isCurrentMonth} />
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Painel de detalhes do dia selecionado */}
            <div className="lg:col-span-1">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedCalendarDate 
                      ? `Eventos de ${format(selectedCalendarDate, "dd 'de' MMMM", { locale: ptBR })}`
                      : "Selecione um dia"
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedCalendarDate ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Clique em um dia no calendário para ver os eventos.
                    </p>
                  ) : selectedDateEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum evento neste dia.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border bg-muted/30 relative"
                          data-testid={`event-${event.type}-${event.paciente.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={cn(
                                "w-3 h-3 rounded-full",
                                event.type === 'proximo' ? "bg-blue-500" : "bg-green-500"
                              )} />
                              <span className="font-medium text-sm">{event.paciente.nome}</span>
                            </div>
                            
                            {/* Menu de ações - apenas para próximos atendimentos */}
                            {event.type === 'proximo' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    data-testid={`menu-${event.paciente.id}`}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleReschedule(event.paciente)}
                                    disabled={rescheduleMutation.isPending || removeFromAgendaMutation.isPending}
                                    data-testid={`reschedule-${event.paciente.id}`}
                                  >
                                    <CalendarClock className="h-4 w-4 mr-2" />
                                    Remarcar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveFromAgenda(event.paciente)}
                                    disabled={rescheduleMutation.isPending || removeFromAgendaMutation.isPending}
                                    className="text-destructive"
                                    data-testid={`remove-${event.paciente.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {removeFromAgendaMutation.isPending ? "Removendo..." : "Remover da Agenda"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center space-x-2">
                              {event.type === 'proximo' ? (
                                <Calendar className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              <span>
                                {event.type === 'proximo' ? 'Próximo atendimento' : 'Último atendimento'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="h-3 w-3" />
                              <span>{event.paciente.idade} anos</span>
                            </div>
                            {event.paciente.telefone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3 w-3" />
                                <span>{event.paciente.telefone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seção de Rota Otimizada - Nova funcionalidade */}
              {selectedCalendarDate && proximosAtendimentosComCoordenadas.length >= 1 && (
                <Card className="mt-4 h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Route className="h-5 w-5" />
                      <span>Rota Otimizada</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!optimizedRoute ? (
                      <div className="text-center py-4">
                        <Button
                          onClick={() => optimizeRouteMutation.mutate()}
                          disabled={optimizeRouteMutation.isPending}
                          className="w-full"
                          data-testid="button-optimize-route"
                        >
                          {optimizeRouteMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Calculando...
                            </>
                          ) : (
                            <>
                              <Navigation className="h-4 w-4 mr-2" />
                              Calcular Melhor Rota
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          {proximosAtendimentosComCoordenadas.length} visitas agendadas
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Distância total:</span>
                            <span className="font-semibold">{optimizedRoute.totalDistanceText}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-muted-foreground">Tempo estimado:</span>
                            <span className="font-semibold">{optimizedRoute.totalDurationText}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Ordem sugerida de visitas:</p>
                          
                          {/* Ponto de partida: Sua Localização */}
                          <div
                            className="flex items-center space-x-2 p-2 rounded-lg bg-green-500/20 border border-green-500/30"
                            data-testid="route-step-start"
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-medium">
                              📍
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">Sua Localização</p>
                              <p className="text-xs text-muted-foreground">Ponto de partida</p>
                            </div>
                          </div>

                          {/* Pacientes na ordem otimizada */}
                          {optimizedRoute.optimizedOrder.map((index: number, position: number) => {
                            const paciente = proximosAtendimentosComCoordenadas[index];
                            const leg = optimizedRoute.legs[position];
                            return (
                              <div
                                key={index}
                                className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30"
                                data-testid={`route-step-${position + 1}`}
                              >
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                  {position + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{paciente?.nome || 'Paciente'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {leg?.distanceText} • {leg?.durationText}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={() => window.open(generateGoogleMapsUrl(), '_blank')}
                            className="flex-1"
                            data-testid="button-open-google-maps"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir no Google Maps
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOptimizedRoute(null)}
                            className="flex-1"
                          >
                            Limpar Rota
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo de Novo Agendamento */}
      <Dialog open={addAppointmentDialogOpen} onOpenChange={setAddAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecionar Paciente</label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                    data-testid="button-select-patient"
                  >
                    {selectedPacienteForAdd
                      ? selectedPacienteForAdd.nome
                      : "Buscar paciente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar paciente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {pacientesList.map((paciente) => (
                          <CommandItem
                            key={paciente.id}
                            value={`${paciente.nome} ${paciente.cnsOuCpf || ''}`}
                            onSelect={() => {
                              setSelectedPacienteForAdd(paciente);
                              setOpenCombobox(false);
                            }}
                            data-testid={`patient-option-${paciente.id}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedPacienteForAdd?.id === paciente.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{paciente.nome}</span>
                              {paciente.cnsOuCpf && (
                                <span className="text-xs text-muted-foreground">
                                  {paciente.cnsOuCpf}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedPacienteForAdd && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecionar Data</label>
                  <div className="flex justify-center">
                    <DayPicker
                      mode="single"
                      selected={addAppointmentDate}
                      onSelect={setAddAppointmentDate}
                      locale={ptBR}
                      className="border rounded-md p-3"
                      disabled={{ before: new Date() }}
                    />
                  </div>
                </div>
                
                {!addAppointmentDate && (
                  <p className="text-sm text-amber-600 text-center">
                    Por favor, selecione uma data para continuar
                  </p>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddAppointmentDialogOpen(false);
                setSelectedPacienteForAdd(null);
                setAddAppointmentDate(undefined);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAddAppointment}
              disabled={!selectedPacienteForAdd || !addAppointmentDate || addAppointmentMutation.isPending}
              data-testid="button-confirm-add-appointment"
            >
              {addAppointmentMutation.isPending ? "Criando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Remarcar Agendamento */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remarcar Agendamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione a nova data para o agendamento de <strong>{selectedPacienteForReschedule?.nome}</strong>
            </p>
            
            <div className="flex justify-center">
              <DayPicker
                mode="single"
                selected={newAppointmentDate}
                onSelect={setNewAppointmentDate}
                locale={ptBR}
                className="border rounded-md p-3"
                disabled={{ before: new Date() }}
              />
            </div>
            
            {!newAppointmentDate && (
              <p className="text-sm text-amber-600 text-center">
                Por favor, selecione uma data para continuar
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReschedule}
              disabled={!newAppointmentDate || rescheduleMutation.isPending}
              data-testid="button-confirm-reschedule"
            >
              {rescheduleMutation.isPending ? "Remarcando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;