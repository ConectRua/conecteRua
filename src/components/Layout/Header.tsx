import { Bell, User, Search, Menu, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({ onMenuClick, showMenuButton = false }: HeaderProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };
  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm px-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar UBS, ONGs, pacientes..."
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b">
              <h4 className="font-semibold">Notificações</h4>
            </div>
            <DropdownMenuItem className="p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Novo paciente cadastrado</p>
                <p className="text-xs text-muted-foreground">Ana Paula Costa - Samambaia</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">UBS atualizada</p>
                <p className="text-xs text-muted-foreground">Samambaia Sul - Novos serviços</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Relatório pronto</p>
                <p className="text-xs text-muted-foreground">Estatísticas mensais geradas</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">Admin</span>
                <span className="text-xs text-muted-foreground">Coordenador</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/perfil')} data-testid="menu-perfil">
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/configuracoes')} data-testid="menu-configuracoes">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive" 
              onClick={handleLogout}
              data-testid="menu-sair"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};