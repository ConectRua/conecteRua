import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { InsertUBS } from '../../../shared/schema';
import { MapPin, Building2, Phone, Clock, Stethoscope, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

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

  // Função para geocoding de endereço
  const geocodeAddress = async (endereco: string, cep: string) => {
    if (!endereco || !cep) return;
    
    setIsGeocodingAddress(true);
    try {
      const fullAddress = `${endereco}, ${cep}, Brasil`;
      const geocoder = new google.maps.Geocoder();
      
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode(
          { address: fullAddress },
          (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      const location = result[0].geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      
      setFormData(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString()
      }));
      
      toast.success('Localização encontrada automaticamente!');
    } catch (error) {
      console.warn('Erro no geocoding:', error);
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  // Handlers para inputs com geocoding automático
  const handleEnderecoChange = (value: string) => {
    setFormData(prev => ({ ...prev, endereco: value }));
    // Trigger geocoding if both address and CEP are filled
    if (value.trim() && formData.cep.trim()) {
      setTimeout(() => geocodeAddress(value, formData.cep), 1000);
    }
  };

  const handleCepChange = (value: string) => {
    setFormData(prev => ({ ...prev, cep: value }));
    // Trigger geocoding if both address and CEP are filled
    if (value.trim() && formData.endereco.trim()) {
      setTimeout(() => geocodeAddress(formData.endereco, value), 1000);
    }
  };

  // Função para obter localização atual
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      // Primeiro tenta a API Capacitor (para mobile)
      try {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        
        const location = {
          latitude: coordinates.coords.latitude.toString(),
          longitude: coordinates.coords.longitude.toString()
        };
        
        setFormData(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude
        }));
        
        toast.success('Localização obtida com sucesso!');
        return;
      } catch (capacitorError) {
        // Fallback para API do browser (para web)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString()
              };
              
              setFormData(prev => ({
                ...prev,
                latitude: location.latitude,
                longitude: location.longitude
              }));
              
              toast.success('Localização obtida com sucesso!');
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
    } finally {
      setIsGettingLocation(false);
    }
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