import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin, Users, Calendar, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  quantidadePessoas: z.number().min(1, "Quantidade deve ser no mínimo 1"),
  descricaoLocal: z.string().min(1, "Descrição é obrigatória"),
  regiao: z.string().optional(),
});

type AtividadeTerritorial = {
  id: number;
  titulo: string;
  latitude: number;
  longitude: number;
  quantidadePessoas: number;
  descricaoLocal: string;
  regiao: string | null;
  dataAtividade: string | null;
  createdAt: string | null;
};

export default function AtividadesTerritoriais() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
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
      regiao: "",
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoadingLocation(true);
    
    getCurrentLocation({
      onSuccess: (location) => {
        setLoadingLocation(false);
        
        createMutation.mutate({
          ...values,
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          dataAtividade: new Date(),
        });
      },
      onError: (error) => {
        setLoadingLocation(false);
        toast({
          title: "Erro ao obter localização",
          description: error.message,
          variant: "destructive",
        });
      },
    });
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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-activity">
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Atividade Territorial</DialogTitle>
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
                
                <FormField
                  control={form.control}
                  name="regiao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Região (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Samambaia" {...field} data-testid="input-regiao" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  A localização GPS será capturada automaticamente ao salvar
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMutation.isPending || loadingLocation}
                  data-testid="button-submit"
                >
                  {loadingLocation ? "Capturando localização..." : "Registrar Atividade"}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(atividade.id)}
                    data-testid={`button-delete-${atividade.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{atividade.quantidadePessoas} pessoas</span>
                </div>
                
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
