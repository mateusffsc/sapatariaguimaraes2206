import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import ClienteServiceNew from '../services/clienteServiceNew';
import { 
  Loader2, 
  FileText, 
  User, 
  Phone, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors = {
  'orçamento': 'bg-yellow-100 text-yellow-800',
  'em-andamento': 'bg-blue-100 text-blue-800',
  'pronto': 'bg-green-100 text-green-800',
  'entregue': 'bg-gray-100 text-gray-800',
  'cancelada': 'bg-red-100 text-red-800'
};

const statusLabels = {
  'orçamento': 'Orçamento',
  'em-andamento': 'Em Andamento',
  'pronto': 'Pronto',
  'entregue': 'Entregue',
  'cancelada': 'Cancelada'
};

const statusIcons = {
  'orçamento': AlertCircle,
  'em-andamento': Clock,
  'pronto': CheckCircle,
  'entregue': CheckCircle,
  'cancelada': XCircle
};

const paymentStatusLabels = {
  'pending': 'Pendente',
  'partial': 'Parcial',
  'paid': 'Pago',
  'overdue': 'Vencido'
};

const paymentStatusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'partial': 'bg-blue-100 text-blue-800',
  'paid': 'bg-green-100 text-green-800',
  'overdue': 'bg-red-100 text-red-800'
};

export function ConsultaPublicaPage() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>();

  const { data: ordemServico, isLoading, error } = useQuery({
    queryKey: ['consulta-publica', 'ordem-servico', id],
    queryFn: async () => {
      if (!id) throw new Error('ID não fornecido');
      return await OrdemServicoServiceNew.getById(id);
    },
    enabled: tipo === 'os' && !!id,
  });

  const { data: cliente } = useQuery({
    queryKey: ['consulta-publica', 'cliente', ordemServico?.cliente_id],
    queryFn: async () => {
      if (!ordemServico?.cliente_id) throw new Error('Cliente não encontrado');
             return await ClienteServiceNew.getById(ordemServico.cliente_id);
    },
    enabled: !!ordemServico?.cliente_id,
  });

  // Configura título da página
  useEffect(() => {
    if (ordemServico) {
      document.title = `OS #${ordemServico.numero} - ${ordemServico.descricao}`;
    }
  }, [ordemServico]);

  if (tipo !== 'os') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tipo de consulta inválido</h2>
            <p className="text-gray-600">
              O tipo de consulta especificado não é suportado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Carregando...</h2>
            <p className="text-gray-600">
              Buscando informações da ordem de serviço.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !ordemServico) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ordem de serviço não encontrada</h2>
            <p className="text-gray-600 mb-4">
              Não foi possível encontrar a ordem de serviço solicitada.
            </p>
            <Button onClick={() => window.history.back()}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusIcons[ordemServico.status as keyof typeof statusIcons];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Ordem de Serviço #{ordemServico.numero}
            </CardTitle>
            <div className="flex items-center justify-center gap-2 mt-2">
              <StatusIcon className="h-5 w-5" />
              <Badge className={statusColors[ordemServico.status as keyof typeof statusColors]}>
                {statusLabels[ordemServico.status as keyof typeof statusLabels]}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Informações da OS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Artigo:</label>
              <p className="text-base mt-1 font-medium">{ordemServico.artigo}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Descrição:</label>
              <p className="text-base mt-1">{ordemServico.descricao}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Data de Entrada:</label>
                <p className="text-base mt-1">
                  {format(new Date(ordemServico.data_entrada), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Previsão de Entrega:</label>
                <p className="text-base mt-1">
                  {ordemServico.data_entrega_prevista 
                    ? format(new Date(ordemServico.data_entrega_prevista), 'dd/MM/yyyy', { locale: ptBR })
                    : 'Não definida'
                  }
                </p>
              </div>
            </div>

            {ordemServico.data_entrega_real && (
              <div>
                <label className="text-sm font-medium text-gray-600">Data de Entrega Real:</label>
                <p className="text-base mt-1 text-green-600 font-medium">
                  {format(new Date(ordemServico.data_entrega_real), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Valor Total:</label>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">
                    R$ {ordemServico.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Valor Pago:</label>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-600">
                    R$ {ordemServico.valor_entrada?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
            </div>

            {ordemServico.valor_restante > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Valor Restante:</label>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  <span className="text-lg font-semibold text-orange-600">
                    R$ {ordemServico.valor_restante?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </span>
                </div>
              </div>
            )}

            {ordemServico.observacoes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600">Observações:</label>
                  <p className="text-base mt-1 text-gray-700">{ordemServico.observacoes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Informações do Cliente */}
        {cliente && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Nome:</label>
                <p className="text-base mt-1 font-medium">{cliente.nome}</p>
              </div>
              
              {cliente.telefone && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Telefone:</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{cliente.telefone}</span>
                  </div>
                </div>
              )}

              {cliente.email && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Email:</label>
                  <p className="text-base mt-1">{cliente.email}</p>
                </div>
              )}

              {cliente.endereco && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Endereço:</label>
                  <p className="text-base mt-1">{cliente.endereco}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botões de ação */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Imprimir Comprovante
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Consulta gerada em {format(new Date(), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}</p>
          <p className="mt-1">Sistema de Gestão de Sapatarias</p>
        </div>
      </div>
    </div>
      );
  } 
