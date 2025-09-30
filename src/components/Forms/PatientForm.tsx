import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Geolocation } from '@capacitor/geolocation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  MapPin, 
  Loader2, 
  User, 
  Phone, 
  Calendar, 
  Heart,
  Brain,
  Activity,
  TestTube,
  Pill,
  Users,
  Stethoscope,
  FileText,
  Building2
} from 'lucide-react';
import { useApiData } from '@/hooks/useApiData';
import type { InsertPaciente } from '../../../shared/schema';
import { insertPacienteSchema } from '../../../shared/schema';
import { toast } from 'sonner';

// Schema para validação do formulário completo
const pacienteCompletoSchema = insertPacienteSchema.extend({
  // Campos obrigatórios básicos
  nome: z.string().min(1, 'Nome é obrigatório'),
  endereco: z.string().min(1, 'Endereço é obrigatório'),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve ter formato 00000-000'),
});

type PacienteFormData = z.infer<typeof pacienteCompletoSchema>;

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (paciente: InsertPaciente) => void;
}

export const PatientForm = ({ open, onOpenChange, onAdd }: PatientFormProps) => {
  const { addPaciente } = useApiData();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [formData, setFormData] = useState({ endereco: '', cep: '', latitude: '', longitude: '' });
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geocodingRequestIdRef = useRef<number>(0);

  // Funções para classificação automática de sinais vitais
  const classificarFC = (fc: string): string => {
    const valor = parseInt(fc);
    if (isNaN(valor)) return '';
    if (valor < 60) return 'BRADICARDIA';
    if (valor > 100) return 'TAQUICARDIA';
    return 'NORMAL';
  };

  const classificarFR = (fr: string): string => {
    const valor = parseInt(fr);
    if (isNaN(valor)) return '';
    if (valor === 0) return 'APNEICO';
    if (valor > 20) return 'TAQUIPNEICO';
    return 'EUPNEICO';
  };

  const form = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteCompletoSchema),
    defaultValues: {
      // Local de atendimento
      localAtendimento: '',
      dataAtendimento: new Date(),
      equipe: 'Samambaia - DF',
      
      // Identificação
      nome: '',
      nomeSocial: '',
      nomeMae: '',
      nomePai: '',
      naturalidade: '',
      dataNascimento: undefined,
      idade: undefined,
      cnsOuCpf: '',
      
      // Endereço
      endereco: '',
      cep: '',
      telefone: '',
      
      // Identidade e demografia
      identidadeGenero: '',
      corRaca: '',
      orientacaoSexual: '',
      
      // Saúde mental
      internacao: false,
      ideacaoSuicida: false,
      tentativaSuicidio: false,
      
      // Sinais vitais
      pressaoArterial: '',
      frequenciaCardiaca: '',
      fcClassificacao: '',
      frequenciaRespiratoria: '',
      frClassificacao: '',
      temperatura: '',
      peso: '',
      glicemiaCapilar: '',
      
      // Testes
      testeGravidez: '',
      testeSifilis: false,
      testeHepB: false,
      testeHepC: false,
      testeHIV: false,
      
      // Substâncias
      usoAlcool: false,
      usoMaconha: false,
      usoCocaina: false,
      usoCrack: false,
      usoSinteticos: false,
      usoVolateis: false,
      
      // Histórico familiar
      dmFamiliar: false,
      haFamiliar: false,
      avcFamiliar: false,
      iamFamiliar: false,
      caFamiliar: false,
      depressaoFamiliar: false,
      ansiedadeFamiliar: false,
      esquizoFamiliar: false,
      bipolarFamiliar: false,
      alcoolFamiliar: false,
      drogasFamiliar: false,
      
      // Comorbidades
      dm: false,
      ha: false,
      avc: false,
      iam: false,
      ca: false,
      depressao: false,
      ansiedade: false,
      esquizo: false,
      bipolar: false,
      alcoolismo: false,
      asma: false,
      
      // Medicações e serviços
      medicacaoEmUso: '',
      kitOdonto: false,
      kitHigiene: false,
      vacina: false,
      coletaSangue: false,
      admMedicacao: false,
      medicacaoAdministrada: '',
      
      // Exame físico
      estadoGeral: '',
      orientacao: '',
      consciencia: '',
      hidratacao: '',
      nutricao: '',
      coloracao: '',
      
      // Facies
      facies: '',
      faciesDescricao: '',
      
      // Pulsos
      pulsosPresenca: '',
      pulsosSimetria: '',
      
      // MMII
      mmiiPerfusao: '',
      mmiiTvp: '',
      
      // Linfonodomegalias
      linfonodomegalias: '',
      linfonodomegaliasDescricao: '',
      
      // TVP Panturrilhas
      tvpPanturrilhas: '',
      tvpSinalHomans: '',
      
      // Edema
      edemaFacies: false,
      edemaMaos: false,
      edemaPes: false,
      edemaGeneralizado: false,
      
      // Abdome
      abdomenTipo: '',
      abdomenMassas: '',
      abdomenHerniaUmbilical: false,
      abdomenHerniaInguinal: false,
      abdomenRetracoes: false,
      abdomenCirculacaoColateral: '',
      abdomenPeristalse: '',
      abdomenLesoesCutaneas: '',
      abdomenRuidosHidroaereos: '',
      abdomenSopros: '',
      abdomenDistendido: '',
      abdomenDor: '',
      abdomenSinalMurphy: '',
      abdomenSinalBlumberg: '',
      abdomenSinalGiordano: '',
      abdomenVisceromegalias: '',
      
      // Evolução
      evolucao: '',
      observacoes: '',
      
      // Sistema
      ativo: true,
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

  // Observar mudanças nos campos de FC e FR para atualizar classificações
  const watchedFC = form.watch('frequenciaCardiaca');
  const watchedFR = form.watch('frequenciaRespiratoria');
  const watchedLatitude = form.watch('latitude');
  const watchedLongitude = form.watch('longitude');
  
  useEffect(() => {
    const classificacao = classificarFC(watchedFC || '');
    form.setValue('fcClassificacao', classificacao);
  }, [watchedFC, form]);
  
  useEffect(() => {
    const classificacao = classificarFR(watchedFR || '');
    form.setValue('frClassificacao', classificacao);
  }, [watchedFR, form]);

  // Observar mudanças nas coordenadas para fazer reverse geocoding
  useEffect(() => {
    // Evitar executar no carregamento inicial
    if (watchedLatitude === undefined || watchedLongitude === undefined) return;
    if (!watchedLatitude || !watchedLongitude) return;
    
    const lat = typeof watchedLatitude === 'number' ? watchedLatitude : parseFloat(watchedLatitude as string);
    const lng = typeof watchedLongitude === 'number' ? watchedLongitude : parseFloat(watchedLongitude as string);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    // Debounce para reverse geocoding
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
    }
    
    geocodingRequestIdRef.current += 1;
    const currentRequestId = geocodingRequestIdRef.current;
    
    geocodingTimeoutRef.current = setTimeout(() => {
      // Só faz reverse geocoding se o CEP estiver vazio
      const currentCep = form.getValues('cep');
      if (!currentCep || currentCep.length < 8) {
        reverseGeocodeCoordinates(lat, lng, currentRequestId);
      }
    }, 2000);
  }, [watchedLatitude, watchedLongitude, form]);

  // Função para geocoding de endereço (CEP → Coordenadas)
  const geocodeAddress = async (endereco: string, cep: string, requestId: number) => {
    if (!endereco.trim() || !cep.trim()) return;
    
    const cepPattern = /^\d{5}-?\d{3}$/;
    if (!cepPattern.test(cep)) {
      return;
    }
    
    setIsGeocodingAddress(true);
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ endereco, cep })
      });
      
      if (geocodingRequestIdRef.current !== requestId) {
        return;
      }
      
      const data = await response.json();
      
      if (data.sucesso && data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));
          
          form.setValue('latitude', lat);
          form.setValue('longitude', lng);
          
          toast.success('📍 Localização encontrada automaticamente!');
        }
      } else {
        console.warn('Geocoding sem sucesso:', data.erro);
      }
    } catch (error) {
      if (geocodingRequestIdRef.current === requestId) {
        console.warn('Erro no geocoding:', error);
        if (!error.message?.includes('obsoleto')) {
          toast.error('Não foi possível encontrar a localização. Verifique o endereço e CEP.');
        }
      }
    } finally {
      if (geocodingRequestIdRef.current === requestId) {
        setIsGeocodingAddress(false);
      }
    }
  };

  // Função para reverse geocoding (Coordenadas → CEP)
  const reverseGeocodeCoordinates = async (latitude: number, longitude: number, requestId: number) => {
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return;
    
    setIsGeocodingAddress(true);
    try {
      const response = await fetch('/api/geocode/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ latitude, longitude })
      });
      
      if (geocodingRequestIdRef.current !== requestId) {
        return;
      }
      
      const data = await response.json();
      
      if (data.sucesso && data.cep) {
        setFormData(prev => ({
          ...prev,
          cep: data.cep,
          endereco: data.endereco || prev.endereco
        }));
        
        if (data.cep) {
          form.setValue('cep', data.cep);
        }
        
        if (data.endereco && !form.getValues('endereco')) {
          form.setValue('endereco', data.endereco);
        }
        
        toast.success('📮 CEP encontrado automaticamente!');
      }
    } catch (error) {
      if (geocodingRequestIdRef.current === requestId) {
        console.warn('Erro no reverse geocoding:', error);
      }
    } finally {
      if (geocodingRequestIdRef.current === requestId) {
        setIsGeocodingAddress(false);
      }
    }
  };

  // Trigger geocoding com debounce
  const triggerGeocoding = (endereco: string, cep: string) => {
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
      geocodingTimeoutRef.current = null;
    }
    
    geocodingRequestIdRef.current += 1;
    const currentRequestId = geocodingRequestIdRef.current;
    
    if (endereco.trim().length >= 10 && cep.trim().length >= 8) {
      geocodingTimeoutRef.current = setTimeout(() => {
        geocodeAddress(endereco, cep, currentRequestId);
      }, 1500);
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

  // Obter localização atual
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      let lat: number, lng: number;
      
      try {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        
        lat = coordinates.coords.latitude;
        lng = coordinates.coords.longitude;
        
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        
        form.setValue('latitude', lat);
        form.setValue('longitude', lng);
        
        toast.success('📍 Localização atual obtida com sucesso!');
        
        // Acionar reverse geocoding para buscar o CEP
        geocodingRequestIdRef.current += 1;
        const currentRequestId = geocodingRequestIdRef.current;
        reverseGeocodeCoordinates(lat, lng, currentRequestId);
        
        return;
      } catch (capacitorError) {
        console.log('Capacitor failed, trying browser API:', capacitorError);
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              lat = position.coords.latitude;
              lng = position.coords.longitude;
              
              setFormData(prev => ({
                ...prev,
                latitude: lat.toString(),
                longitude: lng.toString()
              }));
              
              form.setValue('latitude', lat);
              form.setValue('longitude', lng);
              
              toast.success('📍 Localização atual obtida com sucesso!');
              setIsGettingLocation(false);
              
              // Acionar reverse geocoding para buscar o CEP
              geocodingRequestIdRef.current += 1;
              const currentRequestId = geocodingRequestIdRef.current;
              reverseGeocodeCoordinates(lat, lng, currentRequestId);
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
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onSubmit = async (data: PacienteFormData) => {
    try {
      // Usar coordenadas do geocoding se disponíveis
      const coordinates = formData.latitude && formData.longitude 
        ? { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) }
        : {
            latitude: -15.8781 + (Math.random() - 0.5) * 0.1,
            longitude: -48.0958 + (Math.random() - 0.5) * 0.1,
          };

      const newPatient: InsertPaciente = {
        ...data,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };

      if (onAdd) {
        onAdd(newPatient);
      } else {
        addPaciente(newPatient);
      }

      toast.success('Paciente cadastrado com sucesso!');
      form.reset();
      setFormData({ endereco: '', cep: '', latitude: '', longitude: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error);
      toast.error('Erro ao cadastrar paciente. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ficha de Avaliação Multiprofissional
          </DialogTitle>
          <DialogDescription>
            Consultório Na Rua - Cadastro completo de paciente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* LOCAL DE ATENDIMENTO - NO TOPO */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">LOCAL DE ATENDIMENTO</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="localAtendimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local/Endereço de Atendimento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: UBS Samambaia Norte" {...field} data-testid="input-local-atendimento" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataAtendimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Atendimento</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          data-testid="input-data-atendimento"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="equipe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipe</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-equipe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SEÇÕES ORGANIZADAS EM ACCORDION */}
            <Accordion type="multiple" defaultValue={["identificacao", "endereco"]} className="w-full">
              
              {/* IDENTIFICAÇÃO COMPLETA */}
              <AccordionItem value="identificacao">
                <AccordionTrigger className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Identificação Completa</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do paciente" {...field} data-testid="input-nome" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nomeSocial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Social</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome social (se aplicável)" {...field} data-testid="input-nome-social" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nomeMae"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo da Mãe</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da mãe" {...field} data-testid="input-nome-mae" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nomePai"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo do Pai</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do pai" {...field} data-testid="input-nome-pai" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="naturalidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturalidade (Local de Nascimento)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Brasília - DF" {...field} data-testid="input-naturalidade" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataNascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                              data-testid="input-data-nascimento"
                            />
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
                              placeholder="Idade em anos" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              data-testid="input-idade"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cnsOuCpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNS ou CPF</FormLabel>
                          <FormControl>
                            <Input placeholder="Número do CNS ou CPF" {...field} data-testid="input-cns-cpf" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ENDEREÇO E LOCALIZAÇÃO */}
              <AccordionItem value="endereco">
                <AccordionTrigger className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Endereço e Localização</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Completo *</FormLabel>
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

                  <div className="grid gap-4 md:grid-cols-2">
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
                            <Input placeholder="(61) 99999-9999" {...field} data-testid="input-telefone" />
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
                        value={formData.latitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                        placeholder="-15.7942"
                        type="number"
                        step="any"
                        data-testid="input-latitude"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm font-medium">
                        Longitude
                      </Label>
                      <Input
                        id="longitude"
                        value={formData.longitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                        placeholder="-47.8822"
                        type="number"
                        step="any"
                        data-testid="input-longitude"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Localização Atual</Label>
                      <Button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="w-full"
                        variant="outline"
                        data-testid="button-get-location"
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
                </AccordionContent>
              </AccordionItem>

              {/* IDENTIDADE E DEMOGRAFIA */}
              <AccordionItem value="identidade">
                <AccordionTrigger className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Identidade e Demografia</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="identidadeGenero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identidade de Gênero</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-identidade-genero">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cisgênero">Cisgênero</SelectItem>
                              <SelectItem value="transgênero">Transgênero</SelectItem>
                              <SelectItem value="travesti">Travesti</SelectItem>
                              <SelectItem value="nao-binario">Não Binário</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="corRaca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor/Raça</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-cor-raca">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="preto">Preto</SelectItem>
                              <SelectItem value="pardo">Pardo</SelectItem>
                              <SelectItem value="branco">Branco</SelectItem>
                              <SelectItem value="indigena">Indígena</SelectItem>
                              <SelectItem value="amarelo">Amarelo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="orientacaoSexual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orientação Sexual</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-orientacao-sexual">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hetero">Hétero</SelectItem>
                              <SelectItem value="homo">Homo</SelectItem>
                              <SelectItem value="bissexual">Bissexual</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SAÚDE MENTAL */}
              <AccordionItem value="saude-mental">
                <AccordionTrigger className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span>Saúde Mental</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="internacao"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-internacao"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Histórico de Internação
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ideacaoSuicida"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-ideacao-suicida"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Ideação Suicida
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tentativaSuicidio"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-tentativa-suicidio"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Tentativa de Suicídio
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* SINAIS VITAIS */}
              <AccordionItem value="sinais-vitais">
                <AccordionTrigger className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Sinais Vitais</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="pressaoArterial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pressão Arterial</FormLabel>
                          <FormControl>
                            <Input placeholder="120/80" {...field} data-testid="input-pressao-arterial" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="frequenciaCardiaca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequência Cardíaca</FormLabel>
                            <FormControl>
                              <Input placeholder="72 bpm" {...field} data-testid="input-frequencia-cardiaca" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch('fcClassificacao') && (
                        <div className={`px-2 py-1 rounded text-sm font-medium ${
                          form.watch('fcClassificacao') === 'NORMAL' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                          form.watch('fcClassificacao') === 'TAQUICARDIA' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                        }`}>
                          {form.watch('fcClassificacao')}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="frequenciaRespiratoria"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequência Respiratória</FormLabel>
                            <FormControl>
                              <Input placeholder="16 irpm" {...field} data-testid="input-frequencia-respiratoria" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch('frClassificacao') && (
                        <div className={`px-2 py-1 rounded text-sm font-medium ${
                          form.watch('frClassificacao') === 'EUPNEICO' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                          form.watch('frClassificacao') === 'APNEICO' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                        }`}>
                          {form.watch('frClassificacao')}
                        </div>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="temperatura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperatura</FormLabel>
                          <FormControl>
                            <Input placeholder="36.5°C" {...field} data-testid="input-temperatura" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="peso"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso</FormLabel>
                          <FormControl>
                            <Input placeholder="70 kg" {...field} data-testid="input-peso" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="glicemiaCapilar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Glicemia Capilar</FormLabel>
                          <FormControl>
                            <Input placeholder="90 mg/dl" {...field} data-testid="input-glicemia-capilar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* TESTES E EXAMES */}
              <AccordionItem value="testes">
                <AccordionTrigger className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  <span>Testes e Exames</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="testeGravidez"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teste Rápido de Gravidez</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-teste-gravidez">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="positivo">Positivo</SelectItem>
                            <SelectItem value="negativo">Negativo</SelectItem>
                            <SelectItem value="nao-se-aplica">Não se aplica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="testeSifilis"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-teste-sifilis"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Sífilis
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testeHepB"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-teste-hep-b"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Hepatite B
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testeHepC"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-teste-hep-c"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Hepatite C
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="testeHIV"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-teste-hiv"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            HIV
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* PADRÃO DE USO DE SUBSTÂNCIAS */}
              <AccordionItem value="substancias">
                <AccordionTrigger className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  <span>Padrão de Uso de Substâncias</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="usoAlcool"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-uso-alcool"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Álcool
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usoMaconha"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-uso-maconha"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Maconha
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usoCocaina"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-uso-cocaina"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Cocaína
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usoCrack"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-uso-crack"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Crack
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usoSinteticos"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-uso-sinteticos"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Sintéticos
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usoVolateis"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-uso-volateis"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Voláteis
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* HISTÓRICO FAMILIAR */}
              <AccordionItem value="historico-familiar">
                <AccordionTrigger className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>Histórico de Doença Familiar</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="dmFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dm-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">DM</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="haFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-ha-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">HA</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="avcFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-avc-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">AVC</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="iamFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-iam-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">IAM</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="caFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-ca-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">CA</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="depressaoFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-depressao-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Depressão</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ansiedadeFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-ansiedade-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Ansiedade</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="esquizoFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-esquizo-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Esquizo</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bipolarFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-bipolar-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Bipolar</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="alcoolFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-alcool-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Álcool</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="drogasFamiliar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-drogas-familiar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Drogas</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* COMORBIDADES ATUAIS */}
              <AccordionItem value="comorbidades">
                <AccordionTrigger className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  <span>Comorbidades Atuais</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="dm"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-dm"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">DM</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ha"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-ha"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">HA</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="avc"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-avc"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">AVC</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="iam"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-iam"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">IAM</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ca"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-ca"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">CA</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="depressao"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-depressao"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Depressão</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ansiedade"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-ansiedade"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Ansiedade</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="esquizo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-esquizo"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Esquizo</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bipolar"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-bipolar"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Bipolar</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="alcoolismo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-alcoolismo"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Álcool</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="asma"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-asma"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Asma</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* MEDICAÇÕES E SERVIÇOS */}
              <AccordionItem value="medicacoes">
                <AccordionTrigger className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  <span>Medicações e Serviços</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="medicacaoEmUso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medicação em Uso</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Liste as medicações atuais do paciente"
                            {...field} 
                            data-testid="textarea-medicacao-uso"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="kitOdonto"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-kit-odonto"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Kit Odonto</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="kitHigiene"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-kit-higiene"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Kit Higiene</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vacina"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-vacina"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Vacina</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coletaSangue"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-coleta-sangue"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Coleta de Sangue</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="admMedicacao"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-adm-medicacao"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">ADM Medicação</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="medicacaoAdministrada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medicação Administrada</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detalhar medicação administrada durante o atendimento"
                            {...field} 
                            data-testid="textarea-medicacao-administrada"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* EXAME FÍSICO DETALHADO */}
              <AccordionItem value="exame-fisico">
                <AccordionTrigger className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  <span>Exame Físico Detalhado</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  
                  {/* ESTADO GERAL BÁSICO */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-600">Estado Geral</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="estadoGeral"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado Geral</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-estado-geral">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beg">BEG</SelectItem>
                                <SelectItem value="reg">REG</SelectItem>
                                <SelectItem value="mau-estado">Mau Estado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="orientacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Orientação</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-orientacao">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="orientado">Orientado</SelectItem>
                                <SelectItem value="desorientado-tempo">Desorientado no tempo</SelectItem>
                                <SelectItem value="desorientado-espaco">Desorientado no espaço</SelectItem>
                                <SelectItem value="desorientado-ambos">Desorientado tempo/espaço</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="consciencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Consciência</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-consciencia">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="vigil">Vigil</SelectItem>
                                <SelectItem value="sonolento">Sonolento</SelectItem>
                                <SelectItem value="obnubilado">Obnubilado</SelectItem>
                                <SelectItem value="estupor">Estupor</SelectItem>
                                <SelectItem value="coma">Coma</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hidratacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hidratação</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-hidratacao">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="hidratado">Hidratado</SelectItem>
                                <SelectItem value="desidratado-leve">Desidratado +/4+</SelectItem>
                                <SelectItem value="desidratado-moderado">Desidratado ++/4+</SelectItem>
                                <SelectItem value="desidratado-grave">Desidratado +++/4+</SelectItem>
                                <SelectItem value="desidratado-severo">Desidratado ++++/4+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nutricao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nutrição</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-nutricao">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="nutrido">Nutrido</SelectItem>
                                <SelectItem value="desnutrido-leve">Desnutrido +/4+</SelectItem>
                                <SelectItem value="desnutrido-moderado">Desnutrido ++/4+</SelectItem>
                                <SelectItem value="desnutrido-grave">Desnutrido +++/4+</SelectItem>
                                <SelectItem value="desnutrido-severo">Desnutrido ++++/4+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coloracao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coloração</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-coloracao">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="normocorado">Normocorado</SelectItem>
                                <SelectItem value="hipocromico">Hipocrômico</SelectItem>
                                <SelectItem value="acianotico">Acianótico</SelectItem>
                                <SelectItem value="cianotico">Cianótico</SelectItem>
                                <SelectItem value="anicterico">Anictérico</SelectItem>
                                <SelectItem value="icterico">Ictérico</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* FACIES */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-600">Fácies</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="facies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fácies</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-facies">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="tipica">TÍPICA</SelectItem>
                                <SelectItem value="atipica">ATÍPICA</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch('facies') === 'atipica' && (
                        <FormField
                          control={form.control}
                          name="faciesDescricao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição da Fácies Atípica</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Descreva as características atípicas da fácies"
                                  rows={2}
                                  {...field} 
                                  data-testid="textarea-facies-descricao"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  {/* PULSOS */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-600">Pulsos</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="pulsosPresenca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Presença dos Pulsos</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-pulsos-presenca">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="presentes">PRESENTES</SelectItem>
                                <SelectItem value="ausentes">AUSENTES</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pulsosSimetria"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Simetria dos Pulsos</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-pulsos-simetria">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="simetricos">SIMÉTRICOS</SelectItem>
                                <SelectItem value="assimetricos">ASSIMÉTRICOS</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* MEMBROS INFERIORES (MMII) */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-600">Membros Inferiores (MMII)</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="mmiiPerfusao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Perfusão</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-mmii-perfusao">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bem-perfundidos">BEM PERFUNDIDOS</SelectItem>
                                <SelectItem value="pouco-perfundidos">POUCO PERFUNDIDOS</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mmiiTvp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sinais de TVP</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-mmii-tvp">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sem-sinais-tvp">SEM SINAIS DE TVP /4+</SelectItem>
                                <SelectItem value="com-sinais-tvp">COM SINAIS DE TVP /4+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* LINFONODOMEGALIAS */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-600">Linfonodomegalias</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="linfonodomegalias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Linfonodomegalias</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-linfonodomegalias">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sem">SEM</SelectItem>
                                <SelectItem value="com">COM</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch('linfonodomegalias') === 'com' && (
                        <FormField
                          control={form.control}
                          name="linfonodomegaliasDescricao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição das Linfonodomegalias</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Descreva localização, tamanho e características"
                                  rows={2}
                                  {...field} 
                                  data-testid="textarea-linfonodomegalias-descricao"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  {/* TVP - PANTURRILHAS */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-600">TVP - Panturrilhas</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="tvpPanturrilhas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Panturrilhas</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-tvp-panturrilhas">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="empastadas">EMPASTADAS</SelectItem>
                                <SelectItem value="normais">NORMAIS</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tvpSinalHomans"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sinal de Homans</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-tvp-sinal-homans">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="positivo">POSITIVO</SelectItem>
                                <SelectItem value="negativo">NEGATIVO</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* EDEMA */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-600">Edema</h4>
                    <div className="grid gap-4 md:grid-cols-4">
                      <FormField
                        control={form.control}
                        name="edemaFacies"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-edema-facies"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Fácies</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="edemaMaos"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-edema-maos"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Mãos</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="edemaPes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-edema-pes"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Pés</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="edemaGeneralizado"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-edema-generalizado"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Generalizado</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* ABDOME DETALHADO */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-blue-600">Abdome</h4>
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="abdomenTipo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Abdome</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-abdomen-tipo">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="globo">GLOBO</SelectItem>
                                  <SelectItem value="escavado">ESCAVADO</SelectItem>
                                  <SelectItem value="pendular">PENDULAR</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenMassas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Massas Abdominais</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-abdomen-massas">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ausencia">AUSÊNCIA DE MASSAS</SelectItem>
                                  <SelectItem value="presenca">PRESENÇA DE MASSAS</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenCirculacaoColateral"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Circulação Colateral</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-abdomen-circulacao">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="presente">PRESENTE</SelectItem>
                                  <SelectItem value="ausente">AUSENTE</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="abdomenHerniaUmbilical"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-hernia-umbilical"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Hérnia Umbilical</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenHerniaInguinal"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-hernia-inguinal"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Hérnia Inguinal</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenRetracoes"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-abdomen-retracoes"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Retrações</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <FormField
                          control={form.control}
                          name="abdomenRuidosHidroaereos"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ruídos Hidroaéreos</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-ruidos-hidroaereos">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="+">+</SelectItem>
                                  <SelectItem value="-">-</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenSopros"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sopros</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-abdomen-sopros">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="+">+</SelectItem>
                                  <SelectItem value="-">-</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenDistendido"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Distendido</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-abdomen-distendido">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="+">+</SelectItem>
                                  <SelectItem value="-">-</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenDor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dor</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-abdomen-dor">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="doloroso">DOLOROSO</SelectItem>
                                  <SelectItem value="indolor">INDOLOR</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <FormField
                          control={form.control}
                          name="abdomenSinalMurphy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sinal de Murphy</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-sinal-murphy">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="+">+</SelectItem>
                                  <SelectItem value="-">-</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenSinalBlumberg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sinal de Blumberg</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-sinal-blumberg">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="+">+</SelectItem>
                                  <SelectItem value="-">-</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenSinalGiordano"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sinal de Giordano</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-sinal-giordano">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="+">+</SelectItem>
                                  <SelectItem value="-">-</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenVisceromegalias"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Visceromegalias</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-visceromegalias">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="+">+</SelectItem>
                                  <SelectItem value="-">-</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="abdomenPeristalse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peristalse</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Descrever peristalse (presente, ausente, aumentada, diminuída)"
                                {...field} 
                                data-testid="input-abdomen-peristalse"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="abdomenLesoesCutaneas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lesões Cutâneas</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descrever lesões cutâneas abdominais se presentes"
                                rows={2}
                                {...field} 
                                data-testid="textarea-lesoes-cutaneas"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                </AccordionContent>
              </AccordionItem>

              {/* EVOLUÇÃO E OBSERVAÇÕES */}
              <AccordionItem value="evolucao">
                <AccordionTrigger className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Evolução e Observações</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="evolucao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evolução</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição da evolução do paciente"
                            rows={4}
                            {...field} 
                            data-testid="textarea-evolucao"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Gerais</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações complementares sobre o atendimento"
                            rows={3}
                            {...field} 
                            data-testid="textarea-observacoes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
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