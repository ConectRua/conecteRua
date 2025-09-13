import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, UserCheck, MapPin, Phone, Calendar } from 'lucide-react';

const Pacientes = () => {
  const mockPacientes = [
    {
      id: 1,
      name: "Maria Silva Santos",
      cpf: "123.456.789-00",
      phone: "(11) 9999-8888",
      address: "Rua A, 123 - Centro",
      status: "Ativo",
      lastVisit: "15/03/2024",
      assignedUBS: "UBS Central"
    },
    {
      id: 2,
      name: "João Oliveira Costa",
      cpf: "987.654.321-00",
      phone: "(11) 8888-7777",
      address: "Av. B, 456 - Norte",
      status: "Ativo",
      lastVisit: "12/03/2024",
      assignedUBS: "UBS Norte"
    },
    {
      id: 3,
      name: "Ana Carolina Ferreira",
      cpf: "555.666.777-88",
      phone: "(11) 7777-6666",
      address: "Rua C, 789 - Sul",
      status: "Pendente",
      lastVisit: "10/03/2024",
      assignedUBS: "UBS Sul"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Pacientes</h1>
          <p className="text-muted-foreground">
            Cadastro e pareamento de pacientes com unidades de saúde
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground">Total Pacientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">1,180</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">54</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-sm text-muted-foreground">Pareados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Pacientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              className="flex-1"
            />
            <Button variant="outline">Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Lista de Pacientes</h2>
        
        {mockPacientes.map((paciente) => (
          <Card key={paciente.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{paciente.name}</h3>
                    <Badge variant={paciente.status === 'Ativo' ? 'default' : 'secondary'}>
                      {paciente.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">CPF: {paciente.cpf}</p>
                </div>
                <Button size="sm" variant="outline">
                  Ver Detalhes
                </Button>
              </div>
              
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {paciente.phone}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {paciente.address}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Última visita: {paciente.lastVisit}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  {paciente.assignedUBS}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Pacientes;