import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, UserCheck, MapPin, Phone, Calendar, CreditCard } from 'lucide-react';
import { PatientForm } from '@/components/Forms/PatientForm';
import { useMockData } from '@/hooks/useMockData';

const Pacientes = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { pacientesList, getEstatisticas } = useMockData();
  const stats = getEstatisticas();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Pacientes</h1>
          <p className="text-muted-foreground">
            Cadastro e pareamento de pacientes com unidades de saúde
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
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
                <p className="text-2xl font-bold">{stats.totalPacientes}</p>
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
                <p className="text-2xl font-bold">{stats.pacientesVinculados}</p>
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
                <p className="text-2xl font-bold">{stats.totalPacientes - stats.pacientesVinculados}</p>
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
                <p className="text-2xl font-bold">
                  {stats.totalPacientes > 0 ? Math.round((stats.pacientesVinculados / stats.totalPacientes) * 100) : 0}%
                </p>
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
        
        {pacientesList.map((paciente) => (
          <Card key={paciente.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{paciente.nome}</h3>
                    <Badge variant={paciente.ubsVinculada ? 'default' : 'secondary'}>
                      {paciente.ubsVinculada ? 'Ativo' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">CNS: {paciente.cns}</p>
                    <p className="text-sm text-muted-foreground">Idade: {paciente.idade} anos</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Ver Detalhes
                </Button>
              </div>
              
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {paciente.telefone}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {paciente.endereco}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  CNS: {paciente.cns}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  {paciente.necessidades.join(', ')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PatientForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
};

export default Pacientes;