import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Map, 
  Users, 
  Building2, 
  Heart, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  Home,
  UserPlus,
  FileSpreadsheet,
  Search
} from 'lucide-react';
import logoConsultorio from '@/assets/logo-consultorio-na-rua.png';

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
    title: 'Cadastro Manual',
    href: '/cadastro',
    icon: UserPlus,
    description: 'Adicionar UBS e ONGs'
  },
  {
    title: 'Import Planilhas',
    href: '/importacao',
    icon: FileSpreadsheet,
    description: 'Upload de dados em lote'
  },
  {
    title: 'Busca por CEP',
    href: '/busca',
    icon: Search,
    description: 'Localizar serviços'
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

  return (
    <div className={cn(
      "flex flex-col border-r bg-card transition-all duration-300 h-screen",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <img 
              src={logoConsultorio} 
              alt="Geo Saude" 
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Geo Saude
              </span>
              <span className="text-xs text-muted-foreground">
                Sistema de Georreferenciamento
              </span>
              <span className="text-xs text-muted-foreground">
                Assistência Social e Saúde - Samambaia, Recanto das Emas e Águas Quentes
              </span>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
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
      {!collapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground text-center">
            <p>Sistema de Georreferenciamento</p>
            <p className="mt-1">Assistência Social e Saúde</p>
            <p className="mt-2 text-primary font-medium">v2.0</p>
          </div>
        </div>
      )}
    </div>
  );
};