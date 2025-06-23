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
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { CreditCard, Percent, Clock, Info } from 'lucide-react';
import type { PaymentMethod, CreatePaymentMethod } from '../../types/database';
import { 
  useCriarFormaPagamento, 
  useAtualizarFormaPagamento
} from '../../hooks/usePayments';

interface FormaPagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  formaPagamento?: PaymentMethod | null;
  mode?: 'create' | 'edit';
}

export function FormaPagamentoModal({
  isOpen,
  onClose,
  formaPagamento,
  mode = 'create'
}: FormaPagamentoModalProps) {
  const [formData, setFormData] = useState<Partial<CreatePaymentMethod>>({
    name: '',
    fee_percentage: 0,
    fee_fixed: 0,
    liquidation_days: 0,
  });

  const criarFormaPagamento = useCriarFormaPagamento();
  const atualizarFormaPagamento = useAtualizarFormaPagamento();

  const isLoading = criarFormaPagamento.isPending || atualizarFormaPagamento.isPending;

  useEffect(() => {
    if (formaPagamento && mode === 'edit') {
      setFormData({
        name: formaPagamento.name,
        fee_percentage: formaPagamento.fee_percentage,
        fee_fixed: formaPagamento.fee_fixed,
        liquidation_days: formaPagamento.liquidation_days,
      });
    } else {
      // Reset para modo criação
      setFormData({
        name: '',
        fee_percentage: 0,
        fee_fixed: 0,
        liquidation_days: 0,
      });
    }
  }, [formaPagamento, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      return;
    }

    const dadosFormaPagamento: CreatePaymentMethod = {
      name: formData.name,
      fee_percentage: formData.fee_percentage || 0,
      fee_fixed: formData.fee_fixed || 0,
      liquidation_days: formData.liquidation_days || 0,
    };

    try {
      if (mode === 'edit' && formaPagamento?.id) {
        await atualizarFormaPagamento.mutateAsync({
          id: formaPagamento.id,
          dados: dadosFormaPagamento,
        });
      } else {
        await criarFormaPagamento.mutateAsync(dadosFormaPagamento);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar forma de pagamento:', error);
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

  const calcularTaxa = () => {
    if (!formData.fee_percentage && !formData.fee_fixed) return 0;
    
    const valorExemplo = 100; // R$ 100 como exemplo
    const taxaPercentual = (valorExemplo * (formData.fee_percentage || 0)) / 100;
    const taxaFixa = formData.fee_fixed || 0;
    
    return taxaPercentual + taxaFixa;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {mode === 'edit' ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome da Forma de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Forma de Pagamento *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Cartão de Crédito, PIX, Boleto..."
              required
            />
          </div>

          <Separator />

          {/* Taxas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-blue-600" />
              <Label className="text-base font-medium">Configuração de Taxas</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fee_percentage">Taxa Percentual (%)</Label>
                <Input
                  id="fee_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.fee_percentage || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fee_percentage: e.target.value ? parseFloat(e.target.value) : 0 
                  }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee_fixed">Taxa Fixa (R$)</Label>
                <Input
                  id="fee_fixed"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fee_fixed || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fee_fixed: e.target.value ? parseFloat(e.target.value) : 0 
                  }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Exemplo de cálculo de taxa */}
            {(formData.fee_percentage || formData.fee_fixed) && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Exemplo:</strong> Para um pagamento de R$ 100,00, a taxa será de{' '}
                  <Badge variant="secondary" className="ml-1">
                    {formatCurrency(calcularTaxa())}
                  </Badge>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Prazo de Liquidação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <Label className="text-base font-medium">Prazo de Liquidação</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="liquidation_days">Dias para Liquidação</Label>
              <Input
                id="liquidation_days"
                type="number"
                min="0"
                max="365"
                value={formData.liquidation_days || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  liquidation_days: e.target.value ? parseInt(e.target.value) : 0 
                }))}
                placeholder="0"
              />
              <p className="text-sm text-gray-600">
                Quantos dias o pagamento leva para ser liquidado/compensado
              </p>
            </div>

            {formData.liquidation_days && formData.liquidation_days > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Os pagamentos com esta forma serão considerados liquidados após{' '}
                  <strong>{formData.liquidation_days} dia{formData.liquidation_days > 1 ? 's' : ''}</strong>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name?.trim()}>
              {isLoading ? 'Salvando...' : mode === 'edit' ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 