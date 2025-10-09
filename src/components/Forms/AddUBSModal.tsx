import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { GooglePlacesAutocomplete } from '@/components/GooglePlacesAutocomplete';
import type { InsertUBS } from '../../../shared/schema';
import { MapPin, Building2, Phone, Clock, Stethoscope, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { getCurrentLocation as getLocation } from '@/lib/geolocation-helper';

interface AddUBSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (ubs: InsertUBS) => void;
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

export const AddUBSModal = ({ open, onOpenChange, onAdd }: AddUBSModalProps) => {
  const { toast: useToastHook } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geocodingRequestIdRef = useRef<number>(0);

  // Cleanup timeout quando modal fecha
  useEffect(() => {
    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, []);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cep: '',
    telefone: '',
    latitude: '',
    longitude: '',
    plusCode: '',
    tipo: 'UBS' as 'UBS' | 'Hospital' | 'Clínica',
    especialidades: [] as string[],
    horarioFuncionamento: '07:00 - 17:00',
    status: 'ativo' as 'ativo' | 'inativo'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.endereco.trim()) newErrors.endereco = 'Endereço é obrigatório';
    if (!formData.cep.trim()) newErrors.cep = 'CEP é obrigatório';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    if (formData.especialidades.length === 0) newErrors.especialidades = 'Pelo menos uma especialidade é obrigatória';

    // Validar formato do CEP
    const cepPattern = /^\d{5}-?\d{3}$/;
    if (formData.cep && !cepPattern.test(formData.cep)) {
      newErrors.cep = 'CEP deve ter o formato 12345-678';
    }

    // Validar coordenadas (opcionais)
    if (formData.latitude) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude deve estar entre -90 e 90';
      }
    }
    if (formData.longitude) {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude deve estar entre -180 e 180';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newUBS: InsertUBS = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      cep: formData.cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
    };

    onAdd(newUBS);
    
    toast.success(`${formData.nome} foi adicionada ao mapa com sucesso.`);

    // Reset form
    setFormData({
      nome: '',
      endereco: '',
      cep: '',
      telefone: '',
      latitude: '',
      longitude: '',
      plusCode: '',
      tipo: 'UBS',
      especialidades: [],
      horarioFuncionamento: '07:00 - 17:00',
      status: 'ativo'
    });
    
    onOpenChange(false);
  };

  const toggleEspecialidade = (especialidade: string) => {
    setFormData(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(especialidade)
        ? prev.especialidades.filter(e => e !== especialidade)
        : [...prev.especialidades, especialidade]
    }));
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

  // Função para obter localização atual
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    await getLocation({
      onSuccess: (location) => {
        setFormData(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude
        }));
        setIsGettingLocation(false);
      },
      onError: () => {
        setIsGettingLocation(false);
      },
      timeout: 10000,
      enableHighAccuracy: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Adicionar Nova UBS</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Busca no Google Maps */}
          <div className="border-b pb-4">
            <GooglePlacesAutocomplete
              onPlaceSelected={(place) => {
                // Preencher os campos com os dados do estabelecimento selecionado
                setFormData(prev => ({
                  ...prev,
                  nome: place.nome || prev.nome,
                  endereco: place.endereco || prev.endereco,
                  cep: place.cep || prev.cep,
                  latitude: place.latitude ? place.latitude.toString() : prev.latitude,
                  longitude: place.longitude ? place.longitude.toString() : prev.longitude,
                  telefone: place.telefone || prev.telefone,
                  horarioFuncionamento: place.horarioFuncionamento || prev.horarioFuncionamento
                }));
              }}
              placeholder="Ex: UBS 1 Samambaia, Hospital Regional de Samambaia..."
              label="Buscar Unidade de Saúde no Google Maps"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <div>
                <Label htmlFor="nome">Nome da UBS *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: UBS Samambaia Norte"
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome}</p>}
              </div>

              <div>
                <Label htmlFor="tipo">Tipo de Unidade *</Label>
                <Select value={formData.tipo} onValueChange={(value: 'UBS' | 'Hospital' | 'Clínica') => 
                  setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UBS">UBS - Unidade Básica de Saúde</SelectItem>
                    <SelectItem value="Hospital">Hospital</SelectItem>
                    <SelectItem value="Clínica">Clínica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Textarea
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleEnderecoChange(e.target.value)}
                  placeholder="Ex: Quadra 302, Conjunto 05, Lote 01 - Samambaia"
                  className={errors.endereco ? 'border-red-500' : ''}
                  rows={2}
                />
                {errors.endereco && <p className="text-sm text-red-500 mt-1">{errors.endereco}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="72302-101"
                    className={errors.cep ? 'border-red-500' : ''}
                  />
                  {errors.cep && <p className="text-sm text-red-500 mt-1">{errors.cep}</p>}
                {isGeocodingAddress && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Buscando localização automaticamente...
                  </p>
                )}
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(61) 3458-5424"
                    className={errors.telefone ? 'border-red-500' : ''}
                  />
                  {errors.telefone && <p className="text-sm text-red-500 mt-1">{errors.telefone}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="horario">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Horário de Funcionamento
                </Label>
                <Input
                  id="horario"
                  value={formData.horarioFuncionamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, horarioFuncionamento: e.target.value }))}
                  placeholder="07:00 - 17:00"
                />
              </div>
            </div>

            {/* Localização e Especialidades */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Localização</h3>
              
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full"
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  {isGettingLocation ? 'Obtendo Localização...' : 'Obter Localização Atual'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {formData.latitude && formData.longitude 
                    ? `Lat: ${parseFloat(formData.latitude).toFixed(6)}, Long: ${parseFloat(formData.longitude).toFixed(6)}`
                    : 'Clique para capturar sua localização atual via GPS (opcional)'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="plusCode">Plus Code (Opcional)</Label>
                <Input
                  id="plusCode"
                  value={formData.plusCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, plusCode: e.target.value }))}
                  placeholder="Ex: 8FRP5QXG+XH"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Plus Code é um sistema de códigos para localização
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="latitude">Latitude (Opcional)</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="-15.8822"
                    className={errors.latitude ? 'border-red-500' : ''}
                  />
                  {errors.latitude && <p className="text-sm text-red-500 mt-1">{errors.latitude}</p>}
                </div>

                <div>
                  <Label htmlFor="longitude">Longitude (Opcional)</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="-48.0910"
                    className={errors.longitude ? 'border-red-500' : ''}
                  />
                  {errors.longitude && <p className="text-sm text-red-500 mt-1">{errors.longitude}</p>}
                </div>
              </div>

              <div>
                <Label className="flex items-center space-x-2 mb-3">
                  <Stethoscope className="h-4 w-4" />
                  <span>Especialidades Disponíveis *</span>
                </Label>
                {errors.especialidades && <p className="text-sm text-red-500 mb-2">{errors.especialidades}</p>}
                
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {especialidadesDisponiveis.map((especialidade) => (
                    <div key={especialidade} className="flex items-center space-x-2">
                      <Checkbox
                        id={especialidade}
                        checked={formData.especialidades.includes(especialidade)}
                        onCheckedChange={() => toggleEspecialidade(especialidade)}
                      />
                      <Label htmlFor={especialidade} className="text-sm cursor-pointer">
                        {especialidade}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Especialidades selecionadas */}
                {formData.especialidades.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Selecionadas:</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.especialidades.map((esp) => (
                        <Badge key={esp} variant="secondary" className="text-xs">
                          {esp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Building2 className="h-4 w-4 mr-2" />
              Adicionar UBS
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};