import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building2, Search, Plus, Edit, MapPin, Phone, Users } from 'lucide-react';

const GestaoUBS = () => {
  const mockUBS = [
    {
      id: 1,
      name: "UBS Central",
      address: "Rua das Flores, 123 - Centro",
      phone: "(11) 1234-5678",
      status: "Ativa",
      capacity: 150,
      services: ["Clínica Geral", "Pediatria", "Ginecologia"]
    },
    {
      id: 2,
      name: "UBS Norte",
      address: "Av. Norte, 456 - Zona Norte",
      phone: "(11) 2345-6789",
      status: "Ativa",
      capacity: 120,
      services: ["Clínica Geral", "Cardiologia"]
    },
    {
      id: 3,
      name: "UBS Sul",
      address: "Rua Sul, 789 - Zona Sul",
      phone: "(11) 3456-7890",
      status: "Manutenção",
      capacity: 100,
      services: ["Clínica Geral", "Dermatologia", "Psicologia"]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de UBS</h1>
          <p className="text-muted-foreground">
            Gerencie as Unidades Básicas de Saúde cadastradas
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova UBS
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome ou endereço..."
              className="flex-1"
            />
            <Button variant="outline">Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {mockUBS.map((ubs) => (
          <Card key={ubs.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{ubs.name}</h3>
                    <Badge variant={ubs.status === 'Ativa' ? 'default' : 'secondary'}>
                      {ubs.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="h-4 w-4" />
                    {ubs.address}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {ubs.phone}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Capacidade: {ubs.capacity} pacientes
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Serviços: </span>
                  {ubs.services.length}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Serviços oferecidos:</p>
                <div className="flex flex-wrap gap-1">
                  {ubs.services.map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GestaoUBS;