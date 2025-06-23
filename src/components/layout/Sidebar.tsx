import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  Package,
  Truck,
  ShoppingBag,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  UserCheck,
  Shield,
  BarChart3,
  ClipboardList,
  MessageSquare,
  Database,
  Banknote
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path?: string;
  permissions?: string[];
  requiredRole?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { 
    icon: Home, 
    label: 'Dashboard', 
    path: '/',
    permissions: ['dashboard.view']
  },
  { 
    icon: Users, 
    label: 'Clientes', 
    path: '/clientes',
    permissions: ['clientes.view']
  },
  { 
    icon: FileText, 
    label: 'Ordens de Serviço', 
    path: '/ordens-servico',
    permissions: ['ordens_servico.view']
  },
  { 
    icon: ShoppingCart, 
    label: 'Vendas', 
    path: '/vendas',
    permissions: ['vendas.view']
  },
  { 
    icon: CreditCard, 
    label: 'Crediário', 
    path: '/crediario',
    permissions: ['vendas.view']
  },
  { 
    icon: TrendingUp, 
    label: 'Financeiro', 
    path: '/financeiro',
    permissions: ['financeiro.view']
  },
  {
    icon: Database,
    label: 'Cadastros',
    children: [
      { 
        icon: Package, 
        label: 'Estoque', 
        path: '/estoque',
        permissions: ['estoque.view']
      },
      { 
        icon: Truck, 
        label: 'Fornecedores', 
        path: '/fornecedores',
        permissions: ['estoque.view']
      },
      { 
        icon: ShoppingBag, 
        label: 'Compras', 
        path: '/compras',
        permissions: ['estoque.view']
      },
      { 
        icon: Zap, 
        label: 'Serviços', 
        path: '/servicos',
        permissions: ['configuracoes.view']
      },
      { 
        icon: UserCheck, 
        label: 'Técnicos', 
        path: '/tecnicos',
        permissions: ['configuracoes.view']
      },
      { 
        icon: CreditCard, 
        label: 'Formas de Pagamento', 
        path: '/formas-pagamento',
        permissions: ['configuracoes.view']
      },
      { 
        icon: Banknote, 
        label: 'Bancos', 
        path: '/bancos',
        permissions: ['configuracoes.view']
      },
      { 
        icon: Shield, 
        label: 'Usuários', 
        path: '/usuarios',
        permissions: ['users.view']
      }
    ]
  },
  { 
    icon: BarChart3, 
    label: 'Analytics', 
    path: '/analytics',
    requiredRole: 'manager'
  },
  { 
    icon: ClipboardList, 
    label: 'Relatórios', 
    path: '/relatorios',
    requiredRole: 'manager'
  },
  { 
    icon: MessageSquare, 
    label: 'WhatsApp', 
    path: '/whatsapp',
    requiredRole: 'manager'
  },
  { 
    icon: Settings, 
    label: 'Configurações', 
    path: '/configuracoes',
    requiredRole: 'manager'
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Cadastros']);

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isMenuExpanded = (label: string) => expandedMenus.includes(label);

  const isChildActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some(child => child.path === location.pathname);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = item.icon;
    const isActive = item.path === location.pathname;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = isMenuExpanded(item.label);
    const hasActiveChild = isChildActive(item.children);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => isOpen && toggleMenu(item.label)}
            className={`relative flex items-center w-full px-4 py-3 mx-2 rounded-lg transition-all duration-200 group ${
              hasActiveChild 
                ? 'bg-blue-50 text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {hasActiveChild && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
            )}
            <Icon 
              size={20} 
              className={`flex-shrink-0 transition-all duration-200 ${
                hasActiveChild ? 'text-blue-600' : 'group-hover:text-blue-500'
              }`} 
            />
            {isOpen && (
              <>
                <span className={`ml-3 font-medium transition-all duration-200 flex-1 text-left ${
                  hasActiveChild ? 'text-blue-600' : 'group-hover:text-gray-900'
                }`}>
                  {item.label}
                </span>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </>
            )}
            {!isOpen && hasActiveChild && (
              <div className="absolute left-full ml-2 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </button>
          
          {isOpen && isExpanded && item.children && (
            <div className="ml-4 space-y-1">
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Item simples (sem filhos)
    return (
      <Link
        key={item.path}
        to={item.path!}
        className={`relative flex items-center px-4 py-3 mx-2 rounded-lg transition-all duration-200 group ${
          level > 0 ? 'ml-4' : ''
        } ${
          isActive 
            ? 'bg-blue-50 text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
        )}
        <Icon 
          size={level > 0 ? 18 : 20} 
          className={`flex-shrink-0 transition-all duration-200 ${
            isActive ? 'text-blue-600' : 'group-hover:text-blue-500'
          }`} 
        />
        {isOpen && (
          <span className={`ml-3 font-medium transition-all duration-200 ${
            level > 0 ? 'text-sm' : ''
          } ${
            isActive ? 'text-blue-600' : 'group-hover:text-gray-900'
          }`}>
            {item.label}
          </span>
        )}
        {!isOpen && isActive && (
          <div className="absolute left-full ml-2 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-20'
    }`}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className={`flex items-center space-x-2 ${!isOpen && 'justify-center'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SP</span>
          </div>
          {isOpen && (
            <div>
              <h1 className="font-bold text-gray-800">SapatariaPro</h1>
              <p className="text-xs text-gray-500">Sistema de Gestão</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
      
      <nav className="mt-6 overflow-y-auto h-[calc(100vh-120px)]">
        <div className="space-y-1">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </nav>
    </div>
  );
};
