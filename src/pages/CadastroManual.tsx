import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useState, useRef, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { useApiData } from '@/hooks/useApiData';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Building2, 
  Heart, 
  MapPin, 
  Phone,
  Check,
  X,
  Loader2
} from 'lucide-react';

const CadastroManual = () => {
  const { addUBS, addONG, isCreating } = useApiData();
  const { toast } = useToast();
  const [tipoEntidade, setTipoEntidade] = useState<'ubs' | 'ong'>('ubs');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geocodingRequestIdRef = useRef<number>(0);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cep: '',
    telefone: '',
    tipo: '',
    responsavel: '',
    horarioFuncionamento: '',
    latitude: '',
    longitude: '',
    especialidades: [] as string[],
    servicos: [] as string[]
  });

  // Cleanup timeout quando componente desmonta
  useEffect(() => {
    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, []);

  // Função para geocoding de endereço
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

  // Função para trigger geocoding com debounce
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
    try {
      // Primeiro tenta a API Capacitor (para mobile)
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
        return;
      } catch (capacitorError) {
        console.log('Capacitor failed, trying browser API:', capacitorError);
        
        // Fallback para API do browser (para web)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setFormData(prev => ({
                ...prev,
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString()
              }));
              toast.success('Localização atual obtida com sucesso!');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const coordinates = formData.latitude && formData.longitude 
        ? { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) }
        : undefined;
      
      if (tipoEntidade === 'ubs') {
        await addUBS({
          nome: formData.nome,
          endereco: formData.endereco,
          cep: formData.cep,
          telefone: formData.telefone,
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
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
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
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
        latitude: '',
        longitude: '',
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
                <Label htmlFor="endereco">Endereço Completo *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="endereco"
                    placeholder="Ex: QS 101, Conjunto A, Lote 1, Samambaia"
                    className="pl-10"
                    value={formData.endereco}
                    onChange={(e) => handleEnderecoChange(e.target.value)}
                    data-testid="input-endereco"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    data-testid="input-cep"
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
                <p>• As coordenadas são encontradas automaticamente pelo endereço/CEP</p>
                <p>• Use o botão 'Usar GPS' para capturar sua localização atual</p>
                <p>• Todos os campos marcados com * são obrigatórios</p>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" type="button">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isGeocodingAddress || isGettingLocation || isCreating}
                  data-testid="button-submit"
                >
                  {isGeocodingAddress || isGettingLocation || isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvar {tipoEntidade === 'ubs' ? 'UBS' : 'ONG'}
                    </>
                  )}
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