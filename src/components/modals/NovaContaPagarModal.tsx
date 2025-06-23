import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { useCriarContaPagar, useFornecedores } from '../../hooks/useContasPagar';
import { CreateAccountsPayable } from '../../types/database';

interface NovaContaPagarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaContaPagarModal({ open, onOpenChange }: NovaContaPagarModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    supplier_id: '',
    total_amount_due: '',
    due_date: undefined as Date | undefined,
    observacoes: ''
  });

  const { data: fornecedores } = useFornecedores();
  const criarConta = useCriarContaPagar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.total_amount_due || !formData.due_date) {
      return;
    }

    const contaData: CreateAccountsPayable = {
      description: formData.description,
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : undefined,
      total_amount_due: parseFloat(formData.total_amount_due),
      amount_paid: 0,
      balance_due: parseFloat(formData.total_amount_due),
      due_date: format(formData.due_date, 'yyyy-MM-dd'),
      status: 'open',
      created_by_user_id: 1 // TODO: Pegar do contexto de usuário
    };

    try {
      await criarConta.mutateAsync(contaData);
      
      // Reset form
      setFormData({
        description: '',
        supplier_id: '',
        total_amount_due: '',
        due_date: undefined,
        observacoes: ''
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar conta:', error);
    }
  };

  const formatarMoeda = (valor: string) => {
    const numero = parseFloat(valor);
    if (isNaN(numero)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numero);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Conta a Pagar</DialogTitle>
          <DialogDescription>
            Cadastre uma nova conta a pagar no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descrição da conta (ex: Aluguel do mês de Janeiro)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor</Label>
            <Select 
              value={formData.supplier_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar fornecedor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                                    <SelectItem value="sem_fornecedor">Sem fornecedor</SelectItem>
                {fornecedores?.map((fornecedor) => (
                  <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                    {fornecedor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor Total *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.total_amount_due}
              onChange={(e) => setFormData(prev => ({ ...prev, total_amount_due: e.target.value }))}
              required
            />
            {formData.total_amount_due && (
              <p className="text-sm text-gray-600">
                {formatarMoeda(formData.total_amount_due)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data de Vencimento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? (
                    format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={criarConta.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={criarConta.isPending || !formData.description || !formData.total_amount_due || !formData.due_date}
            >
              {criarConta.isPending ? 'Criando...' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 