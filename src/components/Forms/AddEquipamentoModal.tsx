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
import type { InsertEquipamentoSocial } from '../../../shared/schema';
import { MapPin, Building, Phone, Clock, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

interface AddEquipamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (equipamento: InsertEquipamentoSocial) => void;
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

export const AddEquipamentoModal = ({ open, onOpenChange, onAdd }: AddEquipamentoModalProps) => {
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
    plusCode: '',
    tipo: 'CRAS - Centro de Referência de Assistência Social',
    servicos: [] as string[],
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
    if (!formData.responsavel.trim()) newErrors.responsavel = 'Responsável é obrigatório';

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

    const newEquipamento: InsertEquipamentoSocial = {
      nome: formData.nome,
      tipo: formData.tipo,
      endereco: formData.endereco,
      cep: formData.cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      telefone: formData.telefone || null,
      email: formData.email || null,
      horarioFuncionamento: formData.horarioFuncionamento || null,
      servicos: formData.servicos.length > 0 ? formData.servicos : undefined,
      responsavel: formData.responsavel || null,
      ativo: true
    };

    onAdd(newEquipamento);
    
    toast.success('Equipamento social adicionado com sucesso!');

    // Reset form
    setFormData({
      nome: '',
      endereco: '',
      cep: '',
      telefone: '',
      email: '',
      latitude: '',
      longitude: '',
      plusCode: '',
      tipo: 'CRAS - Centro de Referência de Assistência Social',
      servicos: [],
      responsavel: '',
      capacidade: '',
      horarioFuncionamento: '08:00 - 17:00',
      status: 'ativo'
    });
    
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
            <Building className="h-5 w-5 text-purple-600" />
            <span>Adicionar Novo Equipamento Social</span>
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
                  <SelectTrigger>
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
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Ex: Quadra 302, Conjunto 05, Lote 01 - Recanto das Emas"
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
                  placeholder="contato@equipamento.df.gov.br"
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
                    placeholder="50"
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

                {/* Serviços selecionados */}
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
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Adicionar Equipamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};