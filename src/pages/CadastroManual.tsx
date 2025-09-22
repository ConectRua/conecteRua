import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  Building2, 
  Heart, 
  MapPin, 
  Phone,
  Check,
  X
} from 'lucide-react';

const CadastroManual = () => {
  const { addUBS, addONG, isCreating } = useApiData();
  const { toast } = useToast();
  const [tipoEntidade, setTipoEntidade] = useState<'ubs' | 'ong'>('ubs');
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cep: '',
    telefone: '',
    tipo: '',
    responsavel: '',
    horarioFuncionamento: '',
    especialidades: [] as string[],
    servicos: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (tipoEntidade === 'ubs') {
        await addUBS({
          nome: formData.nome,
          endereco: formData.endereco,
          cep: formData.cep,
          telefone: formData.telefone,
          especialidades: formData.especialidades,
          gestor: formData.responsavel,
          horarioFuncionamento: formData.horarioFuncionamento,
          ativo: true
        });
      } else {
        await addONG({
          nome: formData.nome,
          endereco: formData.endereco,
          cep: formData.cep,
          telefone: formData.telefone,
          servicos: formData.servicos,
          responsavel: formData.responsavel,
          ativo: true
        });
      }
      
      // Reset form on success
      setFormData({
        nome: '',
        endereco: '',
        cep: '',
        telefone: '',
        tipo: '',
        responsavel: '',
        horarioFuncionamento: '',
        especialidades: [],
        servicos: []
      });
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <UserPlus className="h-8 w-8 text-primary" />
          <span>Cadastro Manual</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Adicionar novas UBS, ONGs e instituições ao sistema
        </p>
      </div>

      {/* Entity Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Entidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              variant={tipoEntidade === 'ubs' ? 'default' : 'outline'}
              onClick={() => setTipoEntidade('ubs')}
              className="flex items-center space-x-2"
            >
              <Building2 className="h-4 w-4" />
              <span>UBS / Unidade de Saúde</span>
            </Button>
            <Button
              variant={tipoEntidade === 'ong' ? 'default' : 'outline'}
              onClick={() => setTipoEntidade('ong')}
              className="flex items-center space-x-2"
            >
              <Heart className="h-4 w-4" />
              <span>ONG / Instituição</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da {tipoEntidade === 'ubs' ? 'UBS' : 'ONG'}</Label>
                <Input
                  id="nome"
                  placeholder={tipoEntidade === 'ubs' ? 'Ex: UBS Samambaia Norte' : 'Ex: Instituto Solidário'}
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoEntidade === 'ubs' ? (
                      <>
                        <SelectItem value="UBS">UBS - Unidade Básica de Saúde</SelectItem>
                        <SelectItem value="Hospital">Hospital</SelectItem>
                        <SelectItem value="Clínica">Clínica Especializada</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="ONG">ONG</SelectItem>
                        <SelectItem value="Filantrópica">Instituição Filantrópica</SelectItem>
                        <SelectItem value="Assistência Social">Assistência Social</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Textarea
                  id="endereco"
                  placeholder="Ex: QS 101, Conjunto A, Lote 1, Samambaia"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(61) 0000-0000"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specific Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Informações Específicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tipoEntidade === 'ubs' ? (
                <>
                  <div>
                    <Label htmlFor="horario">Horário de Funcionamento</Label>
                    <Input
                      id="horario"
                      placeholder="Ex: 07:00 - 17:00"
                      value={formData.horarioFuncionamento}
                      onChange={(e) => setFormData(prev => ({ ...prev, horarioFuncionamento: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Especialidades Disponíveis</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['Clínica Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Psicologia', 'Enfermagem'].map((esp) => (
                        <div key={esp} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={esp}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, especialidades: [...prev.especialidades, esp] }));
                              } else {
                                setFormData(prev => ({ ...prev, especialidades: prev.especialidades.filter(e => e !== esp) }));
                              }
                            }}
                          />
                          <Label htmlFor={esp} className="text-sm">{esp}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Input
                      id="responsavel"
                      placeholder="Nome do responsável"
                      value={formData.responsavel}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Serviços Oferecidos</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {['Distribuição de Alimentos', 'Acompanhamento Psicológico', 'Cursos Profissionalizantes', 'Abrigo Temporário', 'Assistência Jurídica', 'Reintegração Social'].map((servico) => (
                        <div key={servico} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={servico}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, servicos: [...prev.servicos, servico] }));
                              } else {
                                setFormData(prev => ({ ...prev, servicos: prev.servicos.filter(s => s !== servico) }));
                              }
                            }}
                          />
                          <Label htmlFor={servico} className="text-sm">{servico}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                <p>• As coordenadas serão geradas automaticamente a partir do CEP</p>
                <p>• Todos os campos marcados com * são obrigatórios</p>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" type="button">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Salvar {tipoEntidade === 'ubs' ? 'UBS' : 'ONG'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Preview */}
      {formData.nome && (
        <Card>
          <CardHeader>
            <CardTitle>Preview do Cadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {tipoEntidade === 'ubs' ? 
                  <Building2 className="h-5 w-5 text-blue-600" /> : 
                  <Heart className="h-5 w-5 text-green-600" />
                }
                <span className="font-medium">{formData.nome}</span>
                {formData.tipo && <Badge variant="outline">{formData.tipo}</Badge>}
              </div>
              {formData.endereco && (
                <p className="text-sm text-muted-foreground">📍 {formData.endereco}</p>
              )}
              {tipoEntidade === 'ubs' && formData.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.especialidades.map((esp, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{esp}</Badge>
                  ))}
                </div>
              )}
              {tipoEntidade === 'ong' && formData.servicos.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.servicos.map((servico, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{servico}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CadastroManual;