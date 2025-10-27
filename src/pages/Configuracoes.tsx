import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Shield, Bell, Database, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const Configuracoes = () => {
  const { toast } = useToast();
  
  // Estados para perfil
  const [profileData, setProfileData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: ''
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estados para senha
  const [passwordData, setPasswordData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    atual: false,
    nova: false,
    confirmar: false
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Carregar dados do usuário ao montar
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const data = await apiRequest('GET', '/api/usuarios/perfil');
      setProfileData({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        cargo: data.cargo || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  // Validar perfil
  const validateProfile = () => {
    const errors: Record<string, string> = {};

    if (!profileData.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (!profileData.email.trim()) errors.email = 'E-mail é obrigatório';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (profileData.email && !emailRegex.test(profileData.email)) {
      errors.email = 'E-mail inválido';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Salvar perfil
  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    setIsSavingProfile(true);
    try {
      await apiRequest('PUT', '/api/usuarios/perfil', profileData);
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar o perfil.",
        variant: "destructive"
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Validar senha
  const validatePassword = () => {
    const errors: Record<string, string> = {};

    if (!passwordData.senhaAtual.trim()) errors.senhaAtual = 'Senha atual é obrigatória';
    if (!passwordData.novaSenha.trim()) errors.novaSenha = 'Nova senha é obrigatória';
    
    if (passwordData.novaSenha.length < 6) {
      errors.novaSenha = 'A senha deve ter no mínimo 6 caracteres';
    }
    
    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      errors.confirmarSenha = 'As senhas não conferem';
    }

    if (passwordData.senhaAtual === passwordData.novaSenha) {
      errors.novaSenha = 'A nova senha deve ser diferente da atual';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Atualizar senha
  const handleUpdatePassword = async () => {
    if (!validatePassword()) return;

    setIsSavingPassword(true);
    try {
      await apiRequest('PUT', '/api/usuarios/senha', {
        senhaAtual: passwordData.senhaAtual,
        novaSenha: passwordData.novaSenha
      });

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso."
      });

      // Limpar campos
      setPasswordData({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });
      setPasswordErrors({});
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message || "Verifique se a senha atual está correta.",
        variant: "destructive"
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as preferências e configurações do sistema
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil do Usuário
            </CardTitle>
            <CardDescription>
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input 
                  id="nome" 
                  placeholder="Seu nome completo"
                  value={profileData.nome}
                  onChange={(e) => setProfileData(prev => ({ ...prev, nome: e.target.value }))}
                  className={profileErrors.nome ? 'border-red-500' : ''}
                />
                {profileErrors.nome && (
                  <p className="text-sm text-red-500">{profileErrors.nome}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className={profileErrors.email ? 'border-red-500' : ''}
                />
                {profileErrors.email && (
                  <p className="text-sm text-red-500">{profileErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input 
                  id="telefone" 
                  placeholder="(11) 99999-9999"
                  value={profileData.telefone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input 
                  id="cargo" 
                  placeholder="Seu cargo"
                  value={profileData.cargo}
                  onChange={(e) => setProfileData(prev => ({ ...prev, cargo: e.target.value }))}
                />
              </div>
            </div>
            <Button 
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configure suas preferências de segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha-atual">Senha Atual *</Label>
              <div className="relative">
                <Input 
                  id="senha-atual" 
                  type={showPasswords.atual ? 'text' : 'password'}
                  value={passwordData.senhaAtual}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, senhaAtual: e.target.value }))}
                  className={passwordErrors.senhaAtual ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, atual: !prev.atual }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.atual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.senhaAtual && (
                <p className="text-sm text-red-500">{passwordErrors.senhaAtual}</p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nova-senha">Nova Senha *</Label>
                <div className="relative">
                  <Input 
                    id="nova-senha" 
                    type={showPasswords.nova ? 'text' : 'password'}
                    value={passwordData.novaSenha}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, novaSenha: e.target.value }))}
                    className={passwordErrors.novaSenha ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, nova: !prev.nova }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.nova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.novaSenha && (
                  <p className="text-sm text-red-500">{passwordErrors.novaSenha}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar-senha">Confirmar Nova Senha *</Label>
                <div className="relative">
                  <Input 
                    id="confirmar-senha" 
                    type={showPasswords.confirmar ? 'text' : 'password'}
                    value={passwordData.confirmarSenha}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                    className={passwordErrors.confirmarSenha ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirmar: !prev.confirmar }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.confirmarSenha && (
                  <p className="text-sm text-red-500">{passwordErrors.confirmarSenha}</p>
                )}
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticação de Dois Fatores</Label>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança
                </p>
              </div>
              <Switch />
            </div>
            <Button 
              onClick={handleUpdatePassword}
              disabled={isSavingPassword}
            >
              {isSavingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Senha'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como você quer receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba atualizações importantes por e-mail
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações em tempo real no navegador
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Relatórios Semanais</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba um resumo semanal das atividades
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sistema
            </CardTitle>
            <CardDescription>
              Configurações gerais do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Fazer backup dos dados automaticamente
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar modo de manutenção do sistema
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Logs Detalhados</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar logs detalhados das operações
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline">Fazer Backup Manual</Button>
              <Button variant="outline">Exportar Configurações</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuracoes;