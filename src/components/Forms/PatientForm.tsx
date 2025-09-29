import { useState, useRef, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Loader2, User, Phone, Calendar, Heart } from 'lucide-react';
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
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [formData, setFormData] = useState({ endereco: '', cep: '', latitude: '', longitude: '' });
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geocodingRequestIdRef = useRef<number>(0);

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

  // Cleanup timeout quando modal fecha
  useEffect(() => {
    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, []);

  // Função para geocoding de endereço com melhor tratamento
  const geocodeAddress = async (endereco: string, cep: string, requestId: number) => {
    if (!endereco.trim() || !cep.trim()) return;
    
    // Verificar se Google Maps API está disponível
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      toast.error('Google Maps não está disponível. Tente novamente.');
      return;
    }
    
    // Validar formato do CEP
    const cepPattern = /^\d{5}-?\d{3}$/;
    if (!cepPattern.test(cep)) {
      return; // CEP inválido, não faz geocoding
    }
    
    setIsGeocodingAddress(true);
    try {
      const fullAddress = `${endereco}, ${cep}, Brasil`;
      const geocoder = new google.maps.Geocoder();
      
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode(
          { address: fullAddress },
          (results, status) => {
            // Verificar se esta resposta ainda é relevante
            if (geocodingRequestIdRef.current !== requestId) {
              reject(new Error('Request obsoleto'));
              return;
            }
            
            if (status === 'OK' && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      // Verificar novamente se esta resposta ainda é relevante
      if (geocodingRequestIdRef.current === requestId) {
        const location = result[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        
        toast.success('Localização encontrada automaticamente!');
      }
    } catch (error) {
      if (geocodingRequestIdRef.current === requestId) {
        console.warn('Erro no geocoding:', error);
        // Só mostrar erro se não for um request obsoleto
        if (!error.message.includes('obsoleto')) {
          toast.error('Não foi possível encontrar a localização. Verifique o endereço e CEP.');
        }
      }
    } finally {
      if (geocodingRequestIdRef.current === requestId) {
        setIsGeocodingAddress(false);
      }
    }
  };

  // Função para trigger geocoding com debounce adequado
  const triggerGeocoding = (endereco: string, cep: string) => {
    // Cancelar timeout anterior se existir
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
      geocodingTimeoutRef.current = null;
    }
    
    // Incrementar request ID para invalidar requests anteriores
    geocodingRequestIdRef.current += 1;
    const currentRequestId = geocodingRequestIdRef.current;
    
    // Só fazer geocoding se ambos campos estão preenchidos e endereço tem tamanho mínimo
    if (endereco.trim().length >= 10 && cep.trim().length >= 8) {
      geocodingTimeoutRef.current = setTimeout(() => {
        geocodeAddress(endereco, cep, currentRequestId);
      }, 1500); // 1.5 segundos de debounce
    }
  };

  // Handlers para inputs com geocoding automático
  const handleEnderecoChange = (value: string) => {
    setFormData(prev => ({ ...prev, endereco: value }));
    form.setValue('endereco', value);
    triggerGeocoding(value, formData.cep);
  };

  const handleCepChange = (value: string) => {
    setFormData(prev => ({ ...prev, cep: value }));
    form.setValue('cep', value);
    triggerGeocoding(formData.endereco, value);
  };

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
        setFormData(prev => ({
          ...prev,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString()
        }));
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
              setFormData(prev => ({
                ...prev,
                latitude: location.latitude.toString(),
                longitude: location.longitude.toString()
              }));
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

      // Usar coordenadas do geocoding se disponíveis
      const coordinates = formData.latitude && formData.longitude 
        ? { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) }
        : {
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
      setFormData({ endereco: '', cep: '', latitude: '', longitude: '' });
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
                  <FormLabel>Endereço *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        placeholder="Rua, número, bairro"
                        className="pl-10"
                        rows={2}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleEnderecoChange(e.target.value);
                        }}
                        data-testid="input-endereco"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00000-000" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          handleCepChange(e.target.value);
                        }}
                        data-testid="input-cep"
                      />
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

            {/* Coordenadas GPS */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-sm font-medium">
                  Latitude {isGeocodingAddress && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
                </Label>
                <Input
                  id="latitude"
                  data-testid="input-latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="-15.7942"
                  type="number"
                  step="any"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-sm font-medium">
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  data-testid="input-longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="-47.8822"
                  type="number"
                  step="any"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Localização Atual</Label>
                <Button
                  type="button"
                  data-testid="button-get-location"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full"
                  variant="outline"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Obtendo...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Usar GPS
                    </>
                  )}
                </Button>
              </div>
            </div>

            {(formData.latitude && formData.longitude) && (
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  📍 Localização encontrada: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                </p>
              </div>
            )}

            {/* Botão de Localização (removido - substituído pelos campos acima) */}


            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Condições de Saúde
              </Label>
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
              <Button 
                type="submit"
                disabled={isGeocodingAddress || isGettingLocation}
                data-testid="button-submit"
              >
                {isGeocodingAddress || isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Cadastrar Paciente'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};