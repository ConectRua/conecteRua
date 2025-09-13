import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockData } from '@/hooks/useMockData';
import { 
  Heart, 
  Phone, 
  MapPin, 
  User, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const GestaoONGs = () => {
  const { ongsList, loading } = useMockData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Heart className="h-8 w-8 text-green-600" />
            <span>Gestão de ONGs</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Organizações não governamentais e instituições filantrópicas
          </p>
        </div>
        
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova ONG
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total ONGs</p>
                <p className="text-2xl font-bold">{ongsList.length}</p>
              </div>
              <Heart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {ongsList.filter(ong => ong.status === 'ativo').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assistência Social</p>
                <p className="text-2xl font-bold">
                  {ongsList.filter(ong => ong.tipo === 'Assistência Social').length}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filantrópicas</p>
                <p className="text-2xl font-bold">
                  {ongsList.filter(ong => ong.tipo === 'Filantrópica').length}
                </p>
              </div>
              <Heart className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ONGs List */}
      <div className="grid gap-4">
        {ongsList.map((ong) => (
          <Card key={ong.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-green-600" />
                    <span>{ong.nome}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge 
                      variant={ong.status === 'ativo' ? 'default' : 'secondary'}
                      className={ong.status === 'ativo' ? 'bg-green-600' : ''}
                    >
                      {ong.status === 'ativo' ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Badge variant="outline">{ong.tipo}</Badge>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Endereço</p>
                      <p className="text-sm text-muted-foreground">{ong.endereco}</p>
                      <p className="text-sm text-muted-foreground">CEP: {ong.cep}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Contato</p>
                      <p className="text-sm text-muted-foreground">{ong.telefone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Responsável</p>
                      <p className="text-sm text-muted-foreground">{ong.responsavel}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Serviços Oferecidos</p>
                  <div className="flex flex-wrap gap-1">
                    {ong.servicos.map((servico, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {servico}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  <p>Coordenadas: {ong.latitude.toFixed(4)}, {ong.longitude.toFixed(4)}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Ver no Mapa
                  </Button>
                  <Button variant="outline" size="sm">
                    Contatar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GestaoONGs;