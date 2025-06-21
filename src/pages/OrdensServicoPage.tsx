
import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, FileText } from 'lucide-react';

interface OrdemServico {
  id: number;
  numero: string;
  cliente: string;
  cpf: string;
  artigo: string;
  servico: string;
  status: 'orçamento' | 'em-andamento' | 'pronto' | 'entregue' | 'cancelada';
  cadastro: string;
  entrega: string;
  valor: number;
  entrada: number;
  restante: number;
  tecnico: string;
}

const mockOS: OrdemServico[] = [
  {
    id: 1,
    numero: 'OS-001234',
    cliente: 'João Silva',
    cpf: '123.456.789-00',
    artigo: 'Sapato Social Preto',
    servico: 'Conserto de solado',
    status: 'em-andamento',
    cadastro: '18/06/2024',
    entrega: '25/06/2024',
    valor: 85.50,
    entrada: 40.00,
    restante: 45.50,
    tecnico: 'Carlos Santos'
  },
  {
    id: 2,
    numero: 'OS-001235',
    cliente: 'Maria Santos',
    cpf: '987.654.321-00',
    artigo: 'Tênis Branco',
    servico: 'Limpeza especial',
    status: 'pronto',
    cadastro: '20/06/2024',
    entrega: '22/06/2024',
    valor: 45.00,
    entrada: 45.00,
    restante: 0.00,
    tecnico: 'Ana Costa'
  }
];

const statusColors = {
  'orçamento': 'bg-yellow-100 text-yellow-800',
  'em-andamento': 'bg-blue-100 text-blue-800',
  'pronto': 'bg-green-100 text-green-800',
  'entregue': 'bg-gray-100 text-gray-800',
  'cancelada': 'bg-red-100 text-red-800'
};

export const OrdensServicoPage: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>(mockOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const filteredOrdens = ordens.filter(ordem => {
    const matchesSearch = ordem.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ordem.cpf.includes(searchTerm) ||
                         ordem.artigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || ordem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-gray-600">Gerencie todas as ordens de serviço</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus size={20} />
          <span>Nova OS</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por OS, cliente, CPF ou artigo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os status</option>
              <option value="orçamento">Orçamento</option>
              <option value="em-andamento">Em Andamento</option>
              <option value="pronto">Pronto</option>
              <option value="entregue">Entregue</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artigo/Serviço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Técnico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrdens.map((ordem) => (
                <tr key={ordem.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ordem.numero}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ordem.cliente}</div>
                      <div className="text-sm text-gray-500">{ordem.cpf}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ordem.artigo}</div>
                      <div className="text-sm text-gray-500">{ordem.servico}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[ordem.status]}`}>
                      {ordem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">Cadastro: {ordem.cadastro}</div>
                      <div className="text-sm text-gray-500">Entrega: {ordem.entrega}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Total: R$ {ordem.valor.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">Entrada: R$ {ordem.entrada.toFixed(2)}</div>
                      {ordem.restante > 0 && (
                        <div className="text-sm text-red-600">Restante: R$ {ordem.restante.toFixed(2)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ordem.tecnico}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                        <Eye size={16} />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900 p-1 rounded">
                        <Edit size={16} />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1 rounded">
                        <FileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
