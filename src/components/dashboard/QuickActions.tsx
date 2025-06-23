import React, { useState } from 'react';
import { Plus, FileText, Users, DollarSign } from 'lucide-react';
import { ClienteModal } from '@/components/modals/ClienteModal';
import { NovaOrdemServicoModal } from '@/components/modals/NovaOrdemServicoModal';
import { NovaMovimentacaoModal } from '@/components/modals/NovaMovimentacaoModal';
import PermissionGate from '../PermissionGate';

const actions = [
  {
    title: 'Nova OS',
    description: 'Criar nova ordem de serviço',
    icon: FileText,
    color: 'bg-blue-500 hover:bg-blue-600',
    permissions: ['ordens_servico.create']
  },
  {
    title: 'Nova Transação',
    description: 'Registrar movimentação financeira',
    icon: DollarSign,
    color: 'bg-green-500 hover:bg-green-600',
    permissions: ['financeiro.gerenciar']
  },
  {
    title: 'Novo Cliente',
    description: 'Cadastrar novo cliente',
    icon: Users,
    color: 'bg-purple-500 hover:bg-purple-600',
    permissions: ['clientes.create']
  }
];

export const QuickActions: React.FC = () => {
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [ordemServicoModalOpen, setOrdemServicoModalOpen] = useState(false);
  const [transacaoModalOpen, setTransacaoModalOpen] = useState(false);

  const handleActionClick = (action: typeof actions[0]) => {
    switch (action.title) {
      case 'Novo Cliente':
        setClienteModalOpen(true);
        break;
      case 'Nova OS':
        setOrdemServicoModalOpen(true);
        break;
      case 'Nova Transação':
        setTransacaoModalOpen(true);
        break;
      default:
        console.log(`Ação não implementada: ${action.title}`);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Plus size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <PermissionGate
                key={index}
                requiredPermissions={action.permissions}
                requireAnyPermission={true}
              >
                <button
                  onClick={() => handleActionClick(action)}
                  className={`${action.color} text-white p-4 rounded-lg transition-colors group hover:shadow-lg`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Icon size={24} className="group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs opacity-90">{action.description}</p>
                    </div>
                  </div>
                </button>
              </PermissionGate>
            );
          })}
        </div>
      </div>

      {/* Modal de Cliente */}
      <ClienteModal
        isOpen={clienteModalOpen}
        onClose={() => setClienteModalOpen(false)}
        mode="create"
      />

      {/* Modal de Nova Ordem de Serviço */}
      <NovaOrdemServicoModal 
        isOpen={ordemServicoModalOpen}
        onClose={() => setOrdemServicoModalOpen(false)}
      />

      {/* Modal de Nova Transação */}
      <NovaMovimentacaoModal
        isOpen={transacaoModalOpen}
        onClose={() => setTransacaoModalOpen(false)}
      />
    </>
  );
};
