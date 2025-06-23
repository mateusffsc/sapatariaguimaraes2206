import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ComponentType<any>;
}

// Mapeamento de rotas para breadcrumbs
const routeMap: Record<string, BreadcrumbItem[]> = {
  '/': [
    { label: 'Dashboard', path: '/', icon: Home }
  ],
  '/clientes': [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Clientes', path: '/clientes' }
  ],
  '/ordens-servico': [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Ordens de Serviço', path: '/ordens-servico' }
  ],
  '/vendas': [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Vendas', path: '/vendas' }
  ],
  '/crediario': [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Crediário', path: '/crediario' }
  ],
  '/financeiro': [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Financeiro', path: '/financeiro' }
  ],
  '/estoque': [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Estoque', path: '/estoque' }
  ],
  '/cadastros': [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Cadastros', path: '/cadastros' }
  ]
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Pegar os breadcrumbs para a rota atual
  const breadcrumbs = routeMap[currentPath] || [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Página Não Encontrada', path: currentPath }
  ];

  // Se está na página inicial, não mostrar breadcrumbs
  if (currentPath === '/') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = breadcrumb.icon;

        return (
          <React.Fragment key={breadcrumb.path}>
            {index > 0 && (
              <ChevronRight 
                size={16} 
                className="text-gray-400" 
              />
            )}
            
            {isLast ? (
              <span className="flex items-center font-medium text-gray-900">
                {Icon && <Icon size={16} className="mr-1" />}
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                to={breadcrumb.path}
                className="flex items-center hover:text-blue-600 transition-colors"
              >
                {Icon && <Icon size={16} className="mr-1" />}
                {breadcrumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// Hook para obter informações da página atual
export const usePageInfo = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const pageInfo = {
    '/': { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
    '/clientes': { title: 'Clientes', subtitle: 'Gerencie todos os clientes' },
    '/ordens-servico': { title: 'Ordens de Serviço', subtitle: 'Gerencie todas as ordens de serviço' },
    '/vendas': { title: 'Vendas', subtitle: 'Registre e controle as vendas' },
    '/crediario': { title: 'Crediário', subtitle: 'Controle de pagamentos a prazo' },
    '/financeiro': { title: 'Financeiro', subtitle: 'Relatórios e análises financeiras' },
    '/estoque': { title: 'Estoque', subtitle: 'Controle de produtos e materiais' },
    '/cadastros': { title: 'Cadastros', subtitle: 'Configurações e cadastros auxiliares' }
  };

  return pageInfo[currentPath as keyof typeof pageInfo] || { 
    title: 'Página', 
    subtitle: 'Navegue pelo sistema' 
  };
}; 