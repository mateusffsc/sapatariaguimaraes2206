import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { FormaPagamentoModal } from '../components/modals/FormaPagamentoModal';
import {
  useListarFormasPagamento,
  useExcluirFormaPagamento
} from '../hooks/usePayments';
import type { PaymentMethod } from '../types/database';

export const FormasPagamentoPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFormaPagamento, setSelectedFormaPagamento] = useState<PaymentMethod | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const { data: formasPagamento, isLoading } = useListarFormasPagamento();
  const excluirFormaPagamento = useExcluirFormaPagamento();

  const handleNovaFormaPagamento = () => {
    setSelectedFormaPagamento(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditarFormaPagamento = (formaPagamento: PaymentMethod) => {
    setSelectedFormaPagamento(formaPagamento);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleExcluirFormaPagamento = async (id: number) => {
    try {
      await excluirFormaPagamento.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao excluir forma de pagamento:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getTaxaTotal = (formaPagamento: PaymentMethod) => {
    const valorExemplo = 100;
    const taxaPercentual = (valorExemplo * formaPagamento.fee_percentage) / 100;
    const taxaFixa = formaPagamento.fee_fixed;
    return taxaPercentual + taxaFixa;
  };

  const getTaxaDisplay = (formaPagamento: PaymentMethod) => {
    const components = [];
    
    if (formaPagamento.fee_percentage > 0) {
      components.push(formatPercentage(formaPagamento.fee_percentage));
    }
    
    if (formaPagamento.fee_fixed > 0) {
      components.push(formatCurrency(formaPagamento.fee_fixed));
    }
    
    if (components.length === 0) {
      return 'Sem taxa';
    }
    
    return components.join(' + ');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formas de Pagamento"
        subtitle="Gerencie os métodos de pagamento e suas configurações"
        icon={CreditCard}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Formas de Pagamento', href: '/formas-pagamento' }
        ]}
      />

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>
                Configure taxas, prazos de liquidação e integração com fluxo de caixa
              </CardDescription>
            </div>
            <Button onClick={handleNovaFormaPagamento}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Forma de Pagamento
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Carregando formas de pagamento...</div>
            </div>
          ) : !formasPagamento || formasPagamento.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">Nenhuma forma de pagamento cadastrada</div>
              <p className="text-sm text-gray-400 mb-4">
                Cadastre métodos de pagamento para facilitar o controle financeiro
              </p>
              <Button onClick={handleNovaFormaPagamento} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeira Forma de Pagamento
              </Button>
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Total</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formasPagamento.length}
                  </div>
                  <div className="text-xs text-blue-600">formas de pagamento</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Sem Taxa</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {formasPagamento.filter(f => f.fee_percentage === 0 && f.fee_fixed === 0).length}
                  </div>
                  <div className="text-xs text-green-600">métodos gratuitos</div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-600">Liquidação Média</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {formasPagamento.length > 0 
                      ? Math.round(formasPagamento.reduce((sum, f) => sum + f.liquidation_days, 0) / formasPagamento.length)
                      : 0
                    }
                  </div>
                  <div className="text-xs text-yellow-600">dias</div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Tabela de Formas de Pagamento */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Taxas</TableHead>
                      <TableHead>Liquidação</TableHead>
                      <TableHead>Taxa Total (R$ 100)</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formasPagamento.map((formaPagamento) => (
                      <TableRow key={formaPagamento.id}>
                        <TableCell>
                          <div className="font-medium">{formaPagamento.name}</div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {formaPagamento.fee_percentage === 0 && formaPagamento.fee_fixed === 0 ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Sem taxa
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {getTaxaDisplay(formaPagamento)}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {formaPagamento.liquidation_days === 0 
                                ? 'Imediato' 
                                : `${formaPagamento.liquidation_days} dia${formaPagamento.liquidation_days > 1 ? 's' : ''}`
                              }
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge 
                            variant={getTaxaTotal(formaPagamento) === 0 ? "secondary" : "outline"}
                            className={getTaxaTotal(formaPagamento) === 0 ? "bg-green-100 text-green-800" : ""}
                          >
                            {formatCurrency(getTaxaTotal(formaPagamento))}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditarFormaPagamento(formaPagamento)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza de que deseja excluir a forma de pagamento "{formaPagamento.name}"?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleExcluirFormaPagamento(formaPagamento.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre Integração com Fluxo de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Integração com Fluxo de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Como funciona a integração:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• As taxas configuradas são aplicadas automaticamente nos pagamentos</li>
                <li>• O prazo de liquidação afeta o cálculo do fluxo de caixa projetado</li>
                                  <li>• Métodos com liquidação &gt; 0 dias aparecem como "pendentes" no fluxo</li>
                <li>• Relatórios financeiros consideram as taxas no cálculo de receita líquida</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Modal de Forma de Pagamento */}
      <FormaPagamentoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        formaPagamento={selectedFormaPagamento}
        mode={modalMode}
      />
    </div>
  );
}; 