import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { InsertONG } from '../../../shared/schema';
import { MapPin, Heart, Phone, Clock, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

interface AddONGModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (ong: InsertONG) => void;
}

const tiposONG = [
  'Assistência Social',
  'Educação',
  'Saúde',
  'Meio Ambiente',
  'Direitos Humanos',
  'Cultura',
  'Esporte',
  'Religião',
  'Desenvolvimento Comunitário',
  'Outros'
];

const areasAtuacao = [
  'Crianças e Adolescentes',
  'Idosos',
  'Pessoas com Deficiência',
  'Moradores de Rua',
  'Mulheres',
  'LGBTQIA+',
  'Dependentes Químicos',
  'Famílias em Vulnerabilidade',
  'Capacitação Profissional',
  'Alimentação',
  'Moradia',
  'Saúde Mental'
];

export const AddONGModal = ({ open, onOpenChange, onAdd }: AddONGModalProps) => {
  const { toast: useToastHook } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cep: '',
    telefone: '',
    email: '',
    latitude: '',
    longitude: '',
    tipo: 'Assistência Social',
    areasAtuacao: [] as string[],
    responsavel: '',
    capacidade: '',
    horarioFuncionamento: '08:00 - 17:00',
    status: 'ativo' as 'ativo' | 'inativo'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.endereco.trim()) newErrors.endereco = 'Endereço é obrigatório';
    if (!formData.cep.trim()) newErrors.cep = 'CEP é obrigatório';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    if (!formData.latitude.trim()) newErrors.latitude = 'Latitude é obrigatória';
    if (!formData.longitude.trim()) newErrors.longitude = 'Longitude é obrigatória';
    if (!formData.responsavel.trim()) newErrors.responsavel = 'Responsável é obrigatório';

    // Validar formato do CEP
    const cepPattern = /^\d{5}-?\d{3}$/;
    if (formData.cep && !cepPattern.test(formData.cep)) {
      newErrors.cep = 'CEP deve ter o formato 12345-678';
    }

    // Validar coordenadas
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (formData.latitude && (isNaN(lat) || lat < -90 || lat > 90)) {
      newErrors.latitude = 'Latitude deve estar entre -90 e 90';
    }
    if (formData.longitude && (isNaN(lng) || lng < -180 || lng > 180)) {
      newErrors.longitude = 'Longitude deve estar entre -180 e 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newONG: InsertONG = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      capacidade: formData.capacidade ? parseInt(formData.capacidade) : null,
      cep: formData.cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
    };

    onAdd(newONG);
    
    toast.success('ONG adicionada com sucesso!');

    // Reset form
    setFormData({
      nome: '',
      endereco: '',
      cep: '',
      telefone: '',
      email: '',
      latitude: '',
      longitude: '',
      tipo: 'Assistência Social',
      areasAtuacao: [],
      responsavel: '',
      capacidade: '',
      horarioFuncionamento: '08:00 - 17:00',
      status: 'ativo'
    });
    
    onOpenChange(false);
  };

  const toggleAreaAtuacao = (area: string) => {
    setFormData(prev => ({
      ...prev,
      areasAtuacao: prev.areasAtuacao.includes(area)
        ? prev.areasAtuacao.filter(a => a !== area)
        : [...prev.areasAtuacao, area]
    }));
  };

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
            <Heart className="h-5 w-5 text-green-600" />
            <span>Adicionar Nova ONG</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <div>
                <Label htmlFor="nome">Nome da ONG *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Instituto Solidário"
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome}</p>}
              </div>

              <div>
                <Label htmlFor="tipo">Tipo de ONG *</Label>
                <Select value={formData.tipo} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposONG.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responsavel">Responsável *</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder="Nome do responsável"
                  className={errors.responsavel ? 'border-red-500' : ''}
                />
                {errors.responsavel && <p className="text-sm text-red-500 mt-1">{errors.responsavel}</p>}
              </div>

              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Textarea
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                    placeholder="72302-101"
                    className={errors.cep ? 'border-red-500' : ''}
                  />
                  {errors.cep && <p className="text-sm text-red-500 mt-1">{errors.cep}</p>}
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
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@ong.org.br"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="capacidade">Capacidade de Atendimento</Label>
                  <Input
                    id="capacidade"
                    type="number"
                    value={formData.capacidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacidade: e.target.value }))}
                    placeholder="100"
                  />
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
                    placeholder="08:00 - 17:00"
                  />
                </div>
              </div>
            </div>

            {/* Localização e Áreas de Atuação */}
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
                    : 'Clique para capturar sua localização atual via GPS'
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="latitude">Latitude *</Label>
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
                  <Label htmlFor="longitude">Longitude *</Label>
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
                  <Users className="h-4 w-4" />
                  <span>Áreas de Atuação</span>
                </Label>
                
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {areasAtuacao.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={area}
                        checked={formData.areasAtuacao.includes(area)}
                        onCheckedChange={() => toggleAreaAtuacao(area)}
                      />
                      <Label htmlFor={area} className="text-sm cursor-pointer">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Áreas selecionadas */}
                {formData.areasAtuacao.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Selecionadas:</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.areasAtuacao.map((area) => (
                        <Badge key={area} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Adicionar ONG
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};