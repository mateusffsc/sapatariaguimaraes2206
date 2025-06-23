import React, { useState } from 'react';
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
import { DollarSign, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  useCriarPagamento,
  useListarFormasPagamento,
  useListarContasBancarias
} from '../../hooks/usePayments';

interface NovaMovimentacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPOS_MOVIMENTACAO = [
  { 
    value: 'entrada', 
    label: 'Receita', 
    color: 'bg-green-100 text-green-800',
    icon: ArrowUpRight,
    description: 'Dinheiro que entra'
  },
  { 
    value: 'saida', 
    label: 'Despesa', 
    color: 'bg-red-100 text-red-800',
    icon: ArrowDownLeft,
    description: 'Dinheiro que sai'
  },
  { 
    value: 'transferencia', 
    label: 'Transferência', 
    color: 'bg-blue-100 text-blue-800',
    icon: ArrowRightLeft,
    description: 'Entre contas'
  },
];

const CATEGORIAS = {
  entrada: ['Serviços', 'Vendas', 'Recebimentos', 'Outros'],
  saida: ['Fornecedores', 'Funcionários', 'Aluguel', 'Contas', 'Outros'],
  transferencia: ['Transferência', 'Aplicação', 'Resgate']
};

export function NovaMovimentacaoModal({ isOpen, onClose }: NovaMovimentacaoModalProps) {
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'transferencia'>('entrada');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [contaBancaria, setContaBancaria] = useState<number | undefined>();

  const criarPagamento = useCriarPagamento();
  const { data: formasPagamento } = useListarFormasPagamento();
  const { data: contasBancarias } = useListarContasBancarias();

  const resetForm = () => {
    setTipo('entrada');
    setCategoria('');
    setDescricao('');
    setValor(0);
    setFormaPagamento('');
    setContaBancaria(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoria || !descricao || !valor) {
      return;
    }

    const movimentacao = {
      tipo,
      categoria,
      descricao,
      valor,
      forma_pagamento: formaPagamento || 'Dinheiro',
      conta_bancaria_id: contaBancaria,
      data_pagamento: new Date().toISOString(),
      status: 'pago' as const,
    };

    try {
      await criarPagamento.mutateAsync(movimentacao);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Nova Movimentação Financeira
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção do Tipo */}
          <div className="space-y-3">
            <Label>Tipo de Movimentação</Label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_MOVIMENTACAO.map((tipoOpt) => {
                const IconComponent = tipoOpt.icon;
                const isSelected = tipo === tipoOpt.value;
                
                return (
                  <button
                    key={tipoOpt.value}
                    type="button"
                    className={cn(
                      "p-3 border-2 rounded-lg text-center transition-all",
                      isSelected 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                    onClick={() => {
                      setTipo(tipoOpt.value as typeof tipo);
                      setCategoria(''); // Reset categoria
                    }}
                  >
                    <IconComponent className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-xs font-medium">{tipoOpt.label}</div>
                    <div className="text-xs text-gray-500">{tipoOpt.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS[tipo].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={valor || ''}
              onChange={(e) => setValor(Number(e.target.value))}
              placeholder="0,00"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a movimentação..."
              required
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                {formasPagamento?.map((forma) => (
                  <SelectItem key={forma.id} value={forma.name}>
                    {forma.name}
                    {forma.fee_percentage > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({forma.fee_percentage}%)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conta Bancária */}
          <div className="space-y-2">
            <Label htmlFor="conta">Conta Bancária</Label>
            <Select 
              value={contaBancaria?.toString()} 
              onValueChange={(value) => setContaBancaria(value ? Number(value) : undefined)}
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

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criarPagamento.isPending}>
              {criarPagamento.isPending ? 'Criando...' : 'Criar Movimentação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 