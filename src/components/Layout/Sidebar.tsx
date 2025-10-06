import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { 
  Map, 
  Users, 
  Building2, 
  Heart, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  Home,
  FileSpreadsheet,
  LogOut,
  User,
  CalendarDays
} from 'lucide-react';
import logoConecteRua from '@/assets/logo-conecte-rua-final.png';
import { EquipamentoSocialIcon } from '@/components/icons/EquipamentoSocialIcon';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Visão geral do sistema'
  },
  {
    title: 'Mapa Interativo',
    href: '/mapa',
    icon: Map,
    description: 'Visualização georreferenciada'
  },
  {
    title: 'Pacientes',
    href: '/pacientes',
    icon: Users,
    description: 'Cadastro e pareamento'
  },
  {
    title: 'Agenda',
    href: '/agenda',
    icon: CalendarDays,
    description: 'Atendimentos e agendamentos'
  },
  {
    title: 'Import Planilhas',
    href: '/importacao',
    icon: FileSpreadsheet,
    description: 'Upload de dados em lote'
  },
  {
    title: 'Gestão UBS',
    href: '/ubs',
    icon: Building2,
    description: 'Unidades Básicas de Saúde'
  },
  {
    title: 'Gestão ONGs',
    href: '/ongs',
    icon: Heart,
    description: 'Organizações e Instituições'
  },
  {
    title: 'Gestão Equipamentos Sociais',
    href: '/equipamentos',
    icon: EquipamentoSocialIcon,
    description: 'Equipamentos e Serviços Sociais'
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
    description: 'Análises e estatísticas'
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    description: 'Preferências do sistema'
  }
];

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={cn(
      "flex flex-col border-r bg-card transition-all duration-300 h-screen",
      collapsed ? "w-16" : "w-80",
      className
    )}>
      {/* Header */}
      <div className="flex h-24 items-center justify-between px-4 border-b">
        {!collapsed && (
          <img 
            src={logoConecteRua} 
            alt="ConecteRua - Sistema de Georreferenciamento" 
            className="max-w-[280px] h-auto object-contain"
          />
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8 p-0", collapsed && "mx-auto")}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform",
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3 text-left",
                    collapsed && "px-3",
                    isActive && "bg-gradient-primary text-white shadow-md"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 shrink-0",
                    !collapsed && "mr-3"
                  )} />
                  
                  {!collapsed && (
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {item.title}
                      </span>
                      {item.description && (
                        <span className={cn(
                          "text-xs opacity-70",
                          isActive ? "text-white/70" : "text-muted-foreground"
                        )}>
                          {item.description}
                        </span>
                      )}
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        {!collapsed && user && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoading}
            className={cn(
              "w-full justify-start",
              collapsed && "px-3"
            )}
            data-testid="button-logout"
          >
            <LogOut className={cn(
              "h-4 w-4",
              !collapsed && "mr-2"
            )} />
            {!collapsed && "Sair"}
          </Button>
        </div>
        
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center mt-4">
            <p>Sistema de Georreferenciamento</p>
            <p className="mt-1">Assistência Social e Saúde</p>
            <p className="mt-2 text-primary font-medium">v2.0</p>
          </div>
        )}
      </div>
    </div>
  );
};