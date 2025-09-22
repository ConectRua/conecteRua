import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Geolocation } from '@capacitor/geolocation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Loader2 } from 'lucide-react';
import { useApiData } from '@/hooks/useApiData';
import type { InsertPaciente } from '../../../shared/schema';
import { insertPacienteSchema } from '../../../shared/schema';
import { toast } from 'sonner';

// Use the shared schema from the backend for consistency
const patientSchema = insertPacienteSchema.extend({
  condicoesSaude: z.array(z.string()).min(1, 'Selecione pelo menos uma condição de saúde'),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (paciente: InsertPaciente) => void;
}

const condicoesSaudeOptions = [
  'Hipertensão',
  'Diabetes',
  'Cardiopatia',
  'Asma',
  'Obesidade',
  'Depressão',
  'Ansiedade',
  'Artrite',
  'Osteoporose',
  'Problemas Renais',
  'Problemas Visuais',
  'Problemas Auditivos'
];

export const PatientForm = ({ open, onOpenChange, onAdd }: PatientFormProps) => {
  const { addPaciente } = useApiData();
  const [selectedCondicoesSaude, setSelectedCondicoesSaude] = useState<string[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nome: '',
      endereco: '',
      cep: '',
      telefone: '',
      idade: 0,
      condicoesSaude: [],
    },
  });

  const getCurrentLocation = async () => {
    console.log('=== INICIO getCurrentLocation ===');
    setIsGettingLocation(true);
    try {
      console.log('Solicitando localização...');
      
      // Primeiro tenta a API Capacitor (para mobile)
      try {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        
        console.log('Coordenadas recebidas via Capacitor:', coordinates);
        
        const location = {
          latitude: coordinates.coords.latitude,
          longitude: coordinates.coords.longitude
        };
        
        console.log('Localização formatada:', location);
        setCurrentLocation(location);
        toast.success('Localização obtida com sucesso!');
        console.log('=== FIM getCurrentLocation (sucesso via Capacitor) ===');
        return;
      } catch (capacitorError) {
        console.log('Capacitor failed, trying browser API:', capacitorError);
        
        // Fallback para API do browser (para web)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Coordenadas recebidas via Browser:', position);
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              console.log('Localização formatada (browser):', location);
              setCurrentLocation(location);
              toast.success('Localização obtida com sucesso!');
              console.log('=== FIM getCurrentLocation (sucesso via Browser) ===');
              setIsGettingLocation(false);
            },
            (error) => {
              console.error('Erro browser geolocation:', error);
              throw error;
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
          return;
        } else {
          throw new Error('Geolocalização não suportada pelo navegador');
        }
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      toast.error('Não foi possível obter a localização. Verifique as permissões.');
      console.log('=== FIM getCurrentLocation (erro) ===');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onSubmit = async (data: PatientFormData) => {
    console.log('=== INICIO onSubmit ===');
    console.log('Dados do formulário:', data);
    console.log('Condições de saúde selecionadas:', selectedCondicoesSaude);
    console.log('Localização atual:', currentLocation);
    
    try {
      // Usar localização atual se disponível, senão simular coordenadas baseadas no CEP
      const coordinates = currentLocation || {
        latitude: -15.8781 + (Math.random() - 0.5) * 0.1,
        longitude: -48.0958 + (Math.random() - 0.5) * 0.1,
      };
      
      console.log('Coordenadas a serem usadas:', coordinates);

      const newPatient: InsertPaciente = {
        nome: data.nome,
        endereco: data.endereco,
        cep: data.cep,
        telefone: data.telefone,
        idade: data.idade,
        condicoesSaude: selectedCondicoesSaude,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        ativo: true,
      };
      
      console.log('Objeto paciente criado:', newPatient);

      console.log('Chamando addPaciente...');
      
      // Usar o callback se fornecido, senão usar o hook diretamente
      if (onAdd) {
        console.log('Usando callback onAdd...');
        onAdd(newPatient);
      } else {
        console.log('Usando addPaciente do hook...');
        addPaciente(newPatient); // addPaciente uses mutation with automatic toast handling
      }
      
      toast.success('Paciente cadastrado com sucesso!');
      form.reset();
      setSelectedCondicoesSaude([]);
      setCurrentLocation(null);
      onOpenChange(false);
      console.log('=== FIM onSubmit (sucesso) ===');
    } catch (error) {
      console.error('Erro no onSubmit:', error);
      toast.error('Erro ao cadastrar paciente');
      console.log('=== FIM onSubmit (erro) ===');
    }
  };

  const handleCondicaoSaudeChange = (condicao: string, checked: boolean) => {
    console.log('handleCondicaoSaudeChange:', { condicao, checked });
    
    let newCondicoes: string[];
    if (checked) {
      newCondicoes = [...selectedCondicoesSaude, condicao];
    } else {
      newCondicoes = selectedCondicoesSaude.filter(c => c !== condicao);
    }
    
    console.log('Novas condições:', newCondicoes);
    setSelectedCondicoesSaude(newCondicoes);
    
    // Atualizar o formulário com as novas condições
    form.setValue('condicoesSaude', newCondicoes);
    
    // Trigger validation manually
    form.trigger('condicoesSaude');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
          <DialogDescription>
            Cadastre um novo paciente no sistema
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do paciente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botão de Localização */}
            <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Localização Atual</Label>
                <p className="text-xs text-muted-foreground">
                  {currentLocation 
                    ? `Lat: ${currentLocation.latitude.toFixed(6)}, Long: ${currentLocation.longitude.toFixed(6)}`
                    : 'Use sua localização atual para um cadastro mais preciso'
                  }
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-2"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {isGettingLocation ? 'Obtendo...' : 'Obter Localização'}
              </Button>
            </div>


            <div>
              <Label className="text-sm font-medium">Condições de Saúde</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {condicoesSaudeOptions.map((condicao) => (
                  <div key={condicao} className="flex items-center space-x-2">
                    <Checkbox
                      id={condicao}
                      checked={selectedCondicoesSaude.includes(condicao)}
                      onCheckedChange={(checked) => 
                        handleCondicaoSaudeChange(condicao, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={condicao}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {condicao}
                    </Label>
                  </div>
                ))}
              </div>
              {form.formState.errors.condicoesSaude && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.condicoesSaude.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Cadastrar Paciente</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};