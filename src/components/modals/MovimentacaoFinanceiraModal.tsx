import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, DollarSign, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MovimentacaoFinanceira } from '../../lib/mappers';
import { 
  useCriarPagamento, 
  useAtualizarPagamento,
  useListarFormasPagamento,
  useListarContasBancarias
} from '../../hooks/usePayments';

interface MovimentacaoFinanceiraModalProps {
  isOpen: boolean;
  onClose: () => void;
  movimentacao?: MovimentacaoFinanceira | null;
  ordemServicoId?: string;
  vendaId?: string;
  mode?: 'create' | 'edit';
}

const TIPOS_MOVIMENTACAO = [
  { 
    value: 'entrada', 
    label: 'Receita', 
    color: 'bg-green-100 text-green-800',
    icon: ArrowUpRight,
    description: 'Dinheiro que entra na empresa'
  },
  { 
    value: 'saida', 
    label: 'Despesa', 
    color: 'bg-red-100 text-red-800',
    icon: ArrowDownLeft,
    description: 'Dinheiro que sai da empresa'
  },
  { 
    value: 'transferencia', 
    label: 'Transferência', 
    color: 'bg-blue-100 text-blue-800',
    icon: ArrowRightLeft,
    description: 'Movimentação entre contas'
  },
];

const CATEGORIAS_ENTRADA = [
  'Serviços', 'Vendas de Produtos', 'Recebimento Crediário', 
  'Empréstimos', 'Investimentos', 'Outros Recebimentos'
];

const CATEGORIAS_SAIDA = [
  'Fornecedores', 'Funcionários', 'Aluguel', 'Contas de Consumo',
  'Marketing', 'Equipamentos', 'Impostos', 'Outras Despesas'
];

const CATEGORIAS_TRANSFERENCIA = [
  'Transferência entre Contas', 'Aplicação Financeira', 
  'Resgate de Aplicação', 'Movimentação Interna'
];

export function MovimentacaoFinanceiraModal({
  isOpen,
  onClose,
  movimentacao,
  ordemServicoId,
  vendaId,
  mode = 'create'
}: MovimentacaoFinanceiraModalProps) {
  const [formData, setFormData] = useState<Partial<MovimentacaoFinanceira>>({
    tipo: 'entrada',
    categoria: '',
    descricao: '',
    valor: 0,
    forma_pagamento: '',
    conta_bancaria_id: undefined,
    data_pagamento: new Date().toISOString(),
    status: 'pago',
  });

  const [mostrarCamposTransferencia, setMostrarCamposTransferencia] = useState(false);
  const [contaDestino, setContaDestino] = useState<number | undefined>();
  const [dataCalendar, setDataCalendar] = useState<Date>(new Date());

  const criarPagamento = useCriarPagamento();
  const atualizarPagamento = useAtualizarPagamento();
  const { data: formasPagamento } = useListarFormasPagamento();
  const { data: contasBancarias } = useListarContasBancarias();

  const isLoading = criarPagamento.isPending || atualizarPagamento.isPending;

  useEffect(() => {
    if (movimentacao && mode === 'edit') {
      setFormData({
        ...movimentacao
      });
      if (movimentacao.data_pagamento) {
        setDataCalendar(new Date(movimentacao.data_pagamento));
      }
    } else {
      // Reset para modo criação
      setFormData({
        tipo: 'entrada',
        categoria: '',
        descricao: '',
        valor: 0,
        forma_pagamento: '',
        conta_bancaria_id: undefined,
        ordem_servico_id: ordemServicoId,
        venda_id: vendaId,
        data_pagamento: new Date().toISOString(),
        status: 'pago',
      });
      setDataCalendar(new Date());
    }
  }, [movimentacao, mode, ordemServicoId, vendaId]);

  useEffect(() => {
    setMostrarCamposTransferencia(formData.tipo === 'transferencia');
  }, [formData.tipo]);

  const getCategoriasPorTipo = () => {
    switch (formData.tipo) {
      case 'entrada':
        return CATEGORIAS_ENTRADA;
      case 'saida':
        return CATEGORIAS_SAIDA;
      case 'transferencia':
        return CATEGORIAS_TRANSFERENCIA;
      default:
        return [];
    }
  };

  const getTipoSelecionado = () => {
    return TIPOS_MOVIMENTACAO.find(t => t.value === formData.tipo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoria || !formData.descricao || !formData.valor) {
      return;
    }

    const dadosMovimentacao: Omit<MovimentacaoFinanceira, 'id' | 'created_at' | 'updated_at'> = {
      tipo: formData.tipo!,
      categoria: formData.categoria,
      descricao: formData.descricao,
      valor: Number(formData.valor),
      forma_pagamento: formData.forma_pagamento || 'Dinheiro',
      conta_bancaria_id: formData.conta_bancaria_id,
      ordem_servico_id: formData.ordem_servico_id,
      venda_id: formData.venda_id,
      data_vencimento: formData.data_vencimento,
      data_pagamento: dataCalendar.toISOString(),
      status: formData.status || 'pago',
    };

    try {
      if (mode === 'edit' && movimentacao?.id) {
        await atualizarPagamento.mutateAsync({
          id: Number(movimentacao.id),
          dados: dadosMovimentacao,
        });
      } else {
        await criarPagamento.mutateAsync(dadosMovimentacao);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error);
    }
  };

  const tipoAtual = getTipoSelecionado();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {mode === 'edit' ? 'Editar Movimentação Financeira' : 'Nova Movimentação Financeira'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Movimentação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Movimentação</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TIPOS_MOVIMENTACAO.map((tipo) => {
                const IconComponent = tipo.icon;
                const isSelected = formData.tipo === tipo.value;
                
                return (
                  <button
                    key={tipo.value}
                    type="button"
                    className={cn(
                      "p-4 border-2 rounded-lg text-left transition-all hover:bg-gray-50",
                      isSelected 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200"
                    )}
                    onClick={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        tipo: tipo.value as 'entrada' | 'saida' | 'transferencia',
                        categoria: '' // Reset categoria quando muda tipo
                      }));
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{tipo.label}</span>
                      <Badge className={tipo.color} variant="secondary">
                        {tipo.value}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{tipo.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {getCategoriasPorTipo().map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: Number(e.target.value) }))}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva a movimentação financeira..."
              rows={3}
              required
            />
          </div>

          {/* Data de Pagamento */}
          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataCalendar && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataCalendar ? format(dataCalendar, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataCalendar}
                  onSelect={(date) => date && setDataCalendar(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Detalhes de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  {formasPagamento?.map((forma) => (
                    <SelectItem key={forma.id} value={forma.name}>
                      {forma.name}
                      {forma.fee_percentage > 0 && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({forma.fee_percentage}% taxa)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta_bancaria">
                {mostrarCamposTransferencia ? 'Conta Origem' : 'Conta Bancária'}
              </Label>
              <Select
                value={formData.conta_bancaria_id?.toString()}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  conta_bancaria_id: value ? Number(value) : undefined 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias?.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id.toString()}>
                      {conta.name}
                      {conta.bank_name && (
                        <span className="text-sm text-gray-500 ml-2">
                          - {conta.bank_name}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos específicos para transferência */}
          {mostrarCamposTransferencia && (
            <div className="space-y-2">
              <Label htmlFor="conta_destino">Conta Destino</Label>
              <Select
                value={contaDestino?.toString()}
                onValueChange={(value) => setContaDestino(value ? Number(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta de destino" />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias
                    ?.filter(conta => conta.id !== formData.conta_bancaria_id)
                    ?.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        {conta.name}
                        {conta.bank_name && (
                          <span className="text-sm text-gray-500 ml-2">
                            - {conta.bank_name}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Alertas informativos */}
          {tipoAtual && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{tipoAtual.label}:</strong> {tipoAtual.description}
                {mostrarCamposTransferencia && 
                  " Selecione as contas de origem e destino para a transferência."
                }
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (mode === 'edit' ? 'Atualizando...' : 'Criando...') 
                : (mode === 'edit' ? 'Atualizar' : 'Criar')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 