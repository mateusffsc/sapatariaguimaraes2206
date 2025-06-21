
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: FileText, label: 'Ordens de Serviço', path: '/ordens-servico' },
  { icon: ShoppingCart, label: 'Vendas', path: '/vendas' },
  { icon: CreditCard, label: 'Crediário', path: '/crediario' },
  { icon: TrendingUp, label: 'Financeiro', path: '/financeiro' },
  { icon: Package, label: 'Estoque', path: '/estoque' },
  { icon: Settings, label: 'Cadastros', path: '/cadastros' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

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
      
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {isOpen && <span className="ml-3">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
