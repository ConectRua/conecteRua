import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin, Users, Calendar, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCurrentLocation } from "@/lib/geolocation-helper";

const formSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  quantidadePessoas: z.coerce.number().min(1, "Quantidade deve ser no mínimo 1"),
  descricaoLocal: z.string().min(1, "Descrição é obrigatória"),
  endereco: z.string().optional(),
  cep: z.string().optional(),
  regiao: z.string().min(1, "Região é obrigatória"),
});

type AtividadeTerritorial = {
  id: number;
  titulo: string;
  latitude: number;
  longitude: number;
  quantidadePessoas: number;
  descricaoLocal: string;
  endereco: string | null;
  cep: string | null;
  regiao: string | null;
  dataAtividade: string | null;
  createdAt: string | null;
};

export default function AtividadesTerritoriais() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number } | null>(null);
  const { toast } = useToast();

  const { data: atividades = [], isLoading } = useQuery<AtividadeTerritorial[]>({
    queryKey: ["/api/atividades-territoriais"],
    queryFn: async () => {
      const response = await fetch("/api/atividades-territoriais", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erro ao buscar atividades");
      return response.json();
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      quantidadePessoas: 1,
      descricaoLocal: "",
      endereco: "",
      cep: "",
      regiao: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/atividades-territoriais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erro ao criar atividade");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/atividades-territoriais"] });
      toast({ title: "Atividade territorial registrada com sucesso" });
      setIsDialogOpen(false);
      setLocationData(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar atividade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/atividades-territoriais/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erro ao atualizar atividade");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/atividades-territoriais"] });
      toast({ title: "Atividade territorial atualizada com sucesso" });
      setIsDialogOpen(false);
      setEditingId(null);
      setLocationData(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar atividade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/atividades-territoriais/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erro ao deletar atividade");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/atividades-territoriais"] });
      toast({ title: "Atividade territorial removida" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover atividade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    
    getCurrentLocation({
      onSuccess: async (location) => {
        const lat = parseFloat(location.latitude);
        const lng = parseFloat(location.longitude);
        
        setLocationData({ latitude: lat, longitude: lng });
        
        // Fazer reverse geocoding para obter CEP e endereço
        try {
          const response = await fetch('/api/geocode/reverse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ latitude: lat, longitude: lng })
          });
          
          const data = await response.json();
          
          if (data.sucesso && data.cep) {
            form.setValue('cep', data.cep);
            if (data.endereco) {
              form.setValue('endereco', data.endereco);
            }
            toast({ title: "📍 Localização e endereço capturados com sucesso!" });
          } else {
            toast({ title: "📍 Localização capturada (sem endereço disponível)" });
          }
        } catch (error) {
          console.error('Erro no reverse geocoding:', error);
          toast({ title: "📍 Localização capturada (sem endereço disponível)" });
        }
        
        setIsGettingLocation(false);
      },
      onError: (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Erro ao obter localização",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!locationData && !editingId) {
      toast({
        title: "Localização não capturada",
        description: "Por favor, use o botão 'Usar GPS' para capturar a localização",
        variant: "destructive",
      });
      return;
    }
    
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          ...values,
          ...(locationData && {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          }),
        },
      });
    } else {
      createMutation.mutate({
        ...values,
        latitude: locationData!.latitude,
        longitude: locationData!.longitude,
        dataAtividade: new Date(),
      });
    }
  };

  const handleEdit = (atividade: AtividadeTerritorial) => {
    setEditingId(atividade.id);
    form.reset({
      titulo: atividade.titulo,
      quantidadePessoas: atividade.quantidadePessoas,
      descricaoLocal: atividade.descricaoLocal,
      endereco: atividade.endereco || "",
      cep: atividade.cep || "",
      regiao: atividade.regiao || undefined,
    });
    setLocationData({
      latitude: atividade.latitude,
      longitude: atividade.longitude,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta atividade?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-page">Atividades Territoriais</h1>
          <p className="text-muted-foreground">Registre e acompanhe atividades territoriais com localização GPS</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setLocationData(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-activity">
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Atividade Territorial" : "Registrar Atividade Territorial"}</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Atividade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Visita domiciliar QR 115" {...field} data-testid="input-titulo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quantidadePessoas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Pessoas</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="Ex: 5" {...field} data-testid="input-quantidade" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="descricaoLocal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Local</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o local da atividade..." 
                          {...field} 
                          data-testid="input-descricao"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Localização</FormLabel>
                  <Button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                    className="w-full"
                    variant="outline"
                    data-testid="button-get-location"
                  >
                    {isGettingLocation ? (
                      <>Capturando localização...</>
                    ) : locationData ? (
                      <>📍 Localização capturada - Clique para atualizar</>
                    ) : (
                      <>📍 Usar GPS</>
                    )}
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço (preenchido automaticamente)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Será preenchido ao usar GPS" 
                          {...field} 
                          data-testid="input-endereco"
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP (preenchido automaticamente)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Será preenchido ao usar GPS" 
                          {...field} 
                          data-testid="input-cep"
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="regiao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Região *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-regiao">
                            <SelectValue placeholder="Selecione a região" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Samambaia">Samambaia</SelectItem>
                          <SelectItem value="Recanto das Emas">Recanto das Emas</SelectItem>
                          <SelectItem value="Água Quente">Água Quente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={(editingId ? updateMutation.isPending : createMutation.isPending || !locationData)}
                  data-testid="button-submit"
                >
                  {editingId 
                    ? (updateMutation.isPending ? "Atualizando..." : "Atualizar Atividade")
                    : (createMutation.isPending ? "Registrando..." : "Registrar Atividade")
                  }
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando atividades...</div>
      ) : atividades.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade territorial registrada ainda.</p>
            <p className="text-sm mt-2">Clique em "Nova Atividade" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {atividades.map((atividade) => (
            <Card key={atividade.id} data-testid={`card-activity-${atividade.id}`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-start justify-between">
                  <span>{atividade.titulo}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(atividade)}
                      data-testid={`button-edit-${atividade.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(atividade.id)}
                      data-testid={`button-delete-${atividade.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{atividade.quantidadePessoas} pessoas</span>
                </div>
                
                {atividade.endereco && (
                  <div className="text-sm">
                    <strong>Endereço:</strong> {atividade.endereco}
                  </div>
                )}

                {atividade.cep && (
                  <div className="text-sm">
                    <strong>CEP:</strong> {atividade.cep}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>
                    {atividade.latitude.toFixed(6)}, {atividade.longitude.toFixed(6)}
                  </span>
                </div>
                
                {atividade.regiao && (
                  <div className="text-sm">
                    <strong>Região:</strong> {atividade.regiao}
                  </div>
                )}
                
                <div className="text-sm">
                  <strong>Local:</strong> {atividade.descricaoLocal}
                </div>
                
                {atividade.dataAtividade && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {format(new Date(atividade.dataAtividade), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
