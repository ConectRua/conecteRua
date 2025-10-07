import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { EquipamentoSocial } from '../../../shared/schema';
import { MapPin, Building, Phone, Clock, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentLocation as getLocation } from '@/lib/geolocation-helper';

interface EditEquipamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamento: EquipamentoSocial;
  onUpdate: (id: number, data: Partial<EquipamentoSocial>) => void;
}

const tiposEquipamento = [
  'CAPS - Centro de Atenção Psicossocial',
  'CAPS AD - CAPS Álcool e Drogas',
  'CAPS III - CAPS 24h',
  'CAPS i - CAPS Infantojuvenil',
  'CRAS - Centro de Referência de Assistência Social',
  'CREAS - Centro de Referência Especializado de Assistência Social',
  'Centro POP - Centro de Referência para População em Situação de Rua',
  'Casa de Passagem',
  'Abrigo Institucional',
  'Casa Lar',
  'Residência Terapêutica',
  'Centro-Dia',
  'Núcleo de Convivência',
  'Centro de Convivência',
  'Outros'
];

const servicosDisponiveis = [
  'Acompanhamento Psicossocial',
  'Atendimento Individual',
  'Atendimento em Grupo',
  'Atendimento Familiar',
  'Oficinas Terapêuticas',
  'Atividades Comunitárias',
  'Acolhimento Institucional',
  'Acolhimento Familiar',
  'Orientação e Apoio Sociofamiliar',
  'Encaminhamento e Articulação',
  'Benefícios Eventuais',
  'Cadastro Único',
  'Bolsa Família',
  'BPC - Benefício de Prestação Continuada',
  'Serviços de Habilitação e Reabilitação',
  'Atenção Integral à Saúde Mental'
];

export const EditEquipamentoModal = ({ open, onOpenChange, equipamento, onUpdate }: EditEquipamentoModalProps) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cep: '',
    telefone: '',
    email: '',
    latitude: '',
    longitude: '',
    tipo: 'CRAS - Centro de Referência de Assistência Social',
    servicos: [] as string[],
    responsavel: '',
    horarioFuncionamento: '08:00 - 17:00',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geocodingRequestIdRef = useRef(0);

  useEffect(() => {
    if (equipamento) {
      setFormData({
        nome: equipamento.nome || '',
        endereco: equipamento.endereco || '',
        cep: equipamento.cep || '',
        telefone: equipamento.telefone || '',
        email: equipamento.email || '',
        latitude: equipamento.latitude?.toString() || '',
        longitude: equipamento.longitude?.toString() || '',
        tipo: equipamento.tipo || 'CRAS - Centro de Referência de Assistência Social',
        servicos: equipamento.servicos || [],
        responsavel: equipamento.responsavel || '',
        horarioFuncionamento: equipamento.horarioFuncionamento || '08:00 - 17:00',
      });
    }
  }, [equipamento]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.endereco.trim()) newErrors.endereco = 'Endereço é obrigatório';
    if (!formData.cep.trim()) newErrors.cep = 'CEP é obrigatório';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    if (!formData.responsavel.trim()) newErrors.responsavel = 'Responsável é obrigatório';

    const cepPattern = /^\d{5}-?\d{3}$/;
    if (formData.cep && !cepPattern.test(formData.cep)) {
      newErrors.cep = 'CEP deve ter o formato 12345-678';
    }

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

    const updatedData: Partial<EquipamentoSocial> = {
      nome: formData.nome,
      tipo: formData.tipo,
      endereco: formData.endereco,
      cep: formData.cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      telefone: formData.telefone || null,
      email: formData.email || null,
      horarioFuncionamento: formData.horarioFuncionamento || null,
      servicos: formData.servicos.length > 0 ? formData.servicos : [],
      responsavel: formData.responsavel || null,
    };

    onUpdate(equipamento.id, updatedData);
    toast.success('Equipamento social atualizado com sucesso!');
    onOpenChange(false);
  };

  const toggleServico = (servico: string) => {
    setFormData(prev => ({
      ...prev,
      servicos: prev.servicos.includes(servico)
        ? prev.servicos.filter(s => s !== servico)
        : [...prev.servicos, servico]
    }));
  };

  // Função de geocodificação automática
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
        if (error instanceof Error && !error.message.includes('obsoleto')) {
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
    }

    // Incrementar ID da requisição para invalidar anteriores
    geocodingRequestIdRef.current += 1;
    const currentRequestId = geocodingRequestIdRef.current;

    // Definir novo timeout (debounce de 1.5 segundos)
    geocodingTimeoutRef.current = setTimeout(() => {
      geocodeAddress(endereco, cep, currentRequestId);
    }, 1500);
  };

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
            <Building className="h-5 w-5 text-purple-600" />
            <span>Editar Equipamento Social</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <div>
                <Label htmlFor="nome">Nome do Equipamento *</Label>
                <Input
                  id="nome"
                  data-testid="input-equipamento-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: CAPS Recanto das Emas"
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome}</p>}
              </div>

              <div>
                <Label htmlFor="tipo">Tipo de Equipamento *</Label>
                <Select value={formData.tipo} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger data-testid="select-equipamento-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEquipamento.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responsavel">Responsável *</Label>
                <Input
                  id="responsavel"
                  data-testid="input-equipamento-responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder="Nome do coordenador/responsável"
                  className={errors.responsavel ? 'border-red-500' : ''}
                />
                {errors.responsavel && <p className="text-sm text-red-500 mt-1">{errors.responsavel}</p>}
              </div>

              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Textarea
                  id="endereco"
                  data-testid="input-equipamento-endereco"
                  value={formData.endereco}
                  onChange={(e) => {
                    const newEndereco = e.target.value;
                    setFormData(prev => ({ ...prev, endereco: newEndereco }));
                    triggerGeocoding(newEndereco, formData.cep);
                  }}
                  placeholder="Ex: Quadra 302, Conjunto 05, Lote 01 - Recanto das Emas"
                  className={errors.endereco ? 'border-red-500' : ''}
                  rows={2}
                />
                {errors.endereco && <p className="text-sm text-red-500 mt-1">{errors.endereco}</p>}
                {isGeocodingAddress && (
                  <p className="text-xs text-blue-600 mt-1">Buscando localização...</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    data-testid="input-equipamento-cep"
                    value={formData.cep}
                    onChange={(e) => {
                      const newCep = e.target.value;
                      setFormData(prev => ({ ...prev, cep: newCep }));
                      triggerGeocoding(formData.endereco, newCep);
                    }}
                    placeholder="72302-101"
                    className={errors.cep ? 'border-red-500' : ''}
                  />
                  {errors.cep && <p className="text-sm text-red-500 mt-1">{errors.cep}</p>}
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    data-testid="input-equipamento-telefone"
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
                  data-testid="input-equipamento-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@equipamento.df.gov.br"
                />
              </div>

              <div>
                <Label htmlFor="horario">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Horário de Funcionamento
                </Label>
                <Input
                  id="horario"
                  data-testid="input-equipamento-horario"
                  value={formData.horarioFuncionamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, horarioFuncionamento: e.target.value }))}
                  placeholder="08:00 - 17:00"
                />
              </div>
            </div>

            {/* Localização e Serviços */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Localização</h3>
              
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full"
                  data-testid="button-get-location"
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="latitude">Latitude (Opcional)</Label>
                  <Input
                    id="latitude"
                    data-testid="input-equipamento-latitude"
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
                    data-testid="input-equipamento-longitude"
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
                  <span>Serviços Oferecidos</span>
                </Label>
                
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {servicosDisponiveis.map((servico) => (
                    <div key={servico} className="flex items-center space-x-2">
                      <Checkbox
                        id={servico}
                        checked={formData.servicos.includes(servico)}
                        onCheckedChange={() => toggleServico(servico)}
                      />
                      <Label htmlFor={servico} className="text-sm cursor-pointer">
                        {servico}
                      </Label>
                    </div>
                  ))}
                </div>

                {formData.servicos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Selecionados:</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.servicos.map((servico) => (
                        <Badge key={servico} variant="secondary" className="text-xs">
                          {servico}
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
              data-testid="button-cancel-edit"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" data-testid="button-save-equipamento">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
