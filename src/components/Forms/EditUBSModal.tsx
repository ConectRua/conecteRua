import { useState, useRef, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { UBS, InsertUBS } from '../../../shared/schema';
import { MapPin, Building2, Phone, Clock, Stethoscope, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

interface EditUBSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: number, ubs: Partial<UBS>) => void;
  ubs: UBS | null;
}

const especialidadesDisponiveis = [
  'Clínica Geral',
  'Pediatria',
  'Ginecologia',
  'Odontologia',
  'Enfermagem',
  'Vacinação',
  'Saúde da Família',
  'Saúde Mental',
  'Cardiologia',
  'Dermatologia',
  'Psicologia',
  'Fisioterapia',
  'Nutrição'
];

export const EditUBSModal = ({ open, onOpenChange, onEdit, ubs }: EditUBSModalProps) => {
  const { toast: useToastHook } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geocodingRequestIdRef = useRef<number>(0);

  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cep: '',
    telefone: '',
    email: '',
    latitude: '',
    longitude: '',
    plusCode: '',
    especialidades: [] as string[],
    horarioFuncionamento: '07:00 - 17:00',
    gestor: '',
    ativo: true
  });

  // Preencher dados quando UBS é definida
  useEffect(() => {
    if (ubs && open) {
      setFormData({
        nome: ubs.nome || '',
        endereco: ubs.endereco || '',
        cep: ubs.cep || '',
        telefone: ubs.telefone || '',
        email: ubs.email || '',
        latitude: ubs.latitude?.toString() || '',
        longitude: ubs.longitude?.toString() || '',
        plusCode: '',
        especialidades: ubs.especialidades || [],
        horarioFuncionamento: ubs.horarioFuncionamento || '07:00 - 17:00',
        gestor: ubs.gestor || '',
        ativo: ubs.ativo ?? true
      });
    }
  }, [ubs, open]);

  // Cleanup timeout quando modal fecha
  useEffect(() => {
    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.endereco.trim()) newErrors.endereco = 'Endereço é obrigatório';
    if (!formData.cep.trim()) newErrors.cep = 'CEP é obrigatório';

    // Validar formato do CEP
    const cepRegex = /^\d{5}-?\d{3}$/;
    if (formData.cep && !cepRegex.test(formData.cep)) {
      newErrors.cep = 'CEP deve estar no formato 00000-000';
    }

    // Validar email se fornecido
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    triggerGeocoding(value, formData.cep);
  };

  const handleCepChange = (value: string) => {
    setFormData(prev => ({ ...prev, cep: value }));
    triggerGeocoding(formData.endereco, value);
  };

  const handleEspecialidadeChange = (especialidade: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      especialidades: checked
        ? [...prev.especialidades, especialidade]
        : prev.especialidades.filter(e => e !== especialidade)
    }));
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      setFormData(prev => ({
        ...prev,
        latitude: coordinates.coords.latitude.toString(),
        longitude: coordinates.coords.longitude.toString()
      }));
      
      toast.success('Localização atual obtida com sucesso!');
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      toast.error('Não foi possível obter a localização atual.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !ubs) return;

    const ubsData: Partial<UBS> = {
      nome: formData.nome,
      endereco: formData.endereco,
      cep: formData.cep,
      telefone: formData.telefone,
      email: formData.email || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      especialidades: formData.especialidades.length > 0 ? formData.especialidades : undefined,
      horarioFuncionamento: formData.horarioFuncionamento,
      gestor: formData.gestor || undefined,
      ativo: formData.ativo
    };

    onEdit(ubs.id, ubsData);
    onOpenChange(false);
  };

  const resetForm = () => {
    if (ubs) {
      setFormData({
        nome: ubs.nome || '',
        endereco: ubs.endereco || '',
        cep: ubs.cep || '',
        telefone: ubs.telefone || '',
        email: ubs.email || '',
        latitude: ubs.latitude?.toString() || '',
        longitude: ubs.longitude?.toString() || '',
        plusCode: '',
        especialidades: ubs.especialidades || [],
        horarioFuncionamento: ubs.horarioFuncionamento || '07:00 - 17:00',
        gestor: ubs.gestor || '',
        ativo: ubs.ativo ?? true
      });
    }
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  if (!ubs) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar UBS
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome da UBS *
              </Label>
              <Input
                id="nome"
                data-testid="input-nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: UBS Central"
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm font-medium">
                Telefone *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="telefone"
                  data-testid="input-telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(61) 9999-9999"
                  className={`pl-10 ${errors.telefone ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.telefone && <p className="text-sm text-red-500">{errors.telefone}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="endereco" className="text-sm font-medium">
                Endereço *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="endereco"
                  data-testid="input-endereco"
                  value={formData.endereco}
                  onChange={(e) => handleEnderecoChange(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className={`pl-10 ${errors.endereco ? 'border-red-500' : ''}`}
                  rows={2}
                />
              </div>
              {errors.endereco && <p className="text-sm text-red-500">{errors.endereco}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep" className="text-sm font-medium">
                CEP *
              </Label>
              <Input
                id="cep"
                data-testid="input-cep"
                value={formData.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                className={errors.cep ? 'border-red-500' : ''}
              />
              {errors.cep && <p className="text-sm text-red-500">{errors.cep}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contato@ubs.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gestor" className="text-sm font-medium">
                Gestor Responsável
              </Label>
              <Input
                id="gestor"
                data-testid="input-gestor"
                value={formData.gestor}
                onChange={(e) => setFormData(prev => ({ ...prev, gestor: e.target.value }))}
                placeholder="Nome do gestor"
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="horarioFuncionamento" className="text-sm font-medium">
              Horário de Funcionamento
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="horarioFuncionamento"
                data-testid="input-horario"
                value={formData.horarioFuncionamento}
                onChange={(e) => setFormData(prev => ({ ...prev, horarioFuncionamento: e.target.value }))}
                placeholder="07:00 - 17:00"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Especialidades Disponíveis
            </Label>
            <div className="grid gap-2 md:grid-cols-3">
              {especialidadesDisponiveis.map((especialidade) => (
                <div key={especialidade} className="flex items-center space-x-2">
                  <Checkbox
                    id={especialidade}
                    data-testid={`checkbox-${especialidade.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={formData.especialidades.includes(especialidade)}
                    onCheckedChange={(checked) => 
                      handleEspecialidadeChange(especialidade, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={especialidade} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {especialidade}
                  </Label>
                </div>
              ))}
            </div>
            {formData.especialidades.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.especialidades.map((esp, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {esp}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="ativo"
              data-testid="checkbox-ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, ativo: checked as boolean }))
              }
            />
            <Label htmlFor="ativo" className="text-sm font-medium cursor-pointer">
              UBS Ativa
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              data-testid="button-save"
              disabled={isGeocodingAddress || isGettingLocation}
            >
              {isGeocodingAddress || isGettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};