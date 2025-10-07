import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { User, Mail, Calendar, Shield } from 'lucide-react';

const Perfil = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <User className="h-8 w-8 text-primary" />
          <span>Meu Perfil</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Informações da sua conta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Informações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input 
                id="username" 
                value={user.username} 
                disabled 
                data-testid="input-username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="email" 
                  value={user.email} 
                  disabled 
                  data-testid="input-email"
                />
                {user.emailVerified && (
                  <Shield className="h-5 w-5 text-green-600" />
                )}
              </div>
              {!user.emailVerified && (
                <p className="text-xs text-muted-foreground">
                  Email não verificado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Informações da Conta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data de Criação</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Última Atualização</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(user.updatedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para alterar suas informações pessoais ou senha, entre em contato com o administrador do sistema.
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" data-testid="button-editar-perfil">
              Editar Perfil (Em breve)
            </Button>
            <Button variant="outline" data-testid="button-alterar-senha">
              Alterar Senha (Em breve)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Perfil;
