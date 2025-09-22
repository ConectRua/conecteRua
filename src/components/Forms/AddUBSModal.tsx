import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { UBS } from '@shared/schema';
import { MapPin, Building2, Phone, Clock, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddUBSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (ubs: Omit<UBS, 'id'>) => void;
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
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cep: '',
    telefone: '',
    latitude: '',
    longitude: '',
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
    if (!formData.latitude.trim()) newErrors.latitude = 'Latitude é obrigatória';
    if (!formData.longitude.trim()) newErrors.longitude = 'Longitude é obrigatória';
    if (formData.especialidades.length === 0) newErrors.especialidades = 'Pelo menos uma especialidade é obrigatória';

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

    const newUBS: Omit<UBS, 'id'> = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      cep: formData.cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
    };

    onAdd(newUBS);
    
    toast({
      title: "UBS Adicionada",
      description: `${formData.nome} foi adicionada ao mapa com sucesso.`,
    });

    // Reset form
    setFormData({
      nome: '',
      endereco: '',
      cep: '',
      telefone: '',
      latitude: '',
      longitude: '',
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

  const buscarCoordenadas = async () => {
    if (!formData.endereco) {
      toast({
        title: "Erro",
        description: "Digite um endereço antes de buscar as coordenadas.",
        variant: "destructive"
      });
      return;
    }

    // Simular busca de coordenadas (aqui poderia integrar com uma API de geocoding)
    toast({
      title: "Coordenadas simuladas",
      description: "Em um sistema real, isso buscaria as coordenadas automaticamente.",
    });
    
    // Coordenadas padrão para Brasília
    setFormData(prev => ({
      ...prev,
      latitude: '-15.7942',
      longitude: '-47.8822'
    }));
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
                  onClick={buscarCoordenadas}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Buscar Coordenadas
                </Button>
                <p className="text-xs text-muted-foreground">
                  Clique para obter as coordenadas automaticamente com base no endereço
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