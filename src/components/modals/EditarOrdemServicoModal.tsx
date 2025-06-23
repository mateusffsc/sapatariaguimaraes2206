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
import { Edit, CalendarDays, DollarSign, Upload, X, Plus, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useClientes } from '../../hooks/useClientes';
import { useObterOrdemServico, useAtualizarOrdemServico } from '../../hooks/useServiceOrders';
import { toast } from 'sonner';
import ImageUpload from '../ImageUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface EditarOrdemServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordemId: number | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'budget', label: 'Orçamento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-purple-100 text-purple-800' },
  { value: 'completed', label: 'Pronto', color: 'bg-green-100 text-green-800' },
  { value: 'delivered', label: 'Entregue', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'partial', label: 'Parcial' },
  { value: 'paid', label: 'Pago' },
  { value: 'overdue', label: 'Em Atraso' }
];

export function EditarOrdemServicoModal({ 
  isOpen, 
  onClose, 
  ordemId, 
  onSuccess 
}: EditarOrdemServicoModalProps) {
  const [formData, setFormData] = useState({
    cliente_id: '',
    description: '',
    total_price: 0,
    status: 'budget',
    payment_status: 'pending',
    delivery_date: '',
    notes: '',
    urgent: false
  });
  
  const [imagens, setImagens] = useState<File[]>([]);
  const [imagensExistentes, setImagensExistentes] = useState<string[]>([]);

  const { data: ordem, isLoading } = useObterOrdemServico(ordemId!);
  const { data: clientes } = useClientes();
  const atualizarOrdem = useAtualizarOrdemServico();

  // Carregar dados da ordem quando disponível
  useEffect(() => {
    if (ordem) {
      setFormData({
        cliente_id: ordem.clienteId?.toString() || '',
        description: ordem.descricaoServico || '',
        total_price: ordem.valorTotal || 0,
        status: ordem.status || 'budget',
        payment_status: ordem.statusPagamento || 'pending',
        delivery_date: ordem.dataEntrega ? ordem.dataEntrega.split('T')[0] : '',
        notes: ordem.observacoes || '',
        urgent: ordem.servicoUrgente || false
      });
      
      // TODO: Carregar imagens existentes da tabela service_order_images
      setImagensExistentes([]);
    }
  }, [ordem]);

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      description: '',
      total_price: 0,
      status: 'budget',
      payment_status: 'pending',
      delivery_date: '',
      notes: '',
      urgent: false
    });
    setImagens([]);
    setImagensExistentes([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImagens(prev => [...prev, ...newFiles]);
    }
  };

  const removeImagem = (index: number) => {
    setImagens(prev => prev.filter((_, i) => i !== index));
  };

  const removeImagemExistente = (url: string) => {
    setImagensExistentes(prev => prev.filter(img => img !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ordemId) return;

    try {
      // Atualizar dados da ordem
      await atualizarOrdem.mutateAsync({
        id: ordemId,
        ...formData,
        total_price: Number(formData.total_price),
        delivery_date: formData.delivery_date ? new Date(formData.delivery_date).toISOString() : null
      });

      // TODO: Implementar upload de imagens para Supabase Storage
      if (imagens.length > 0) {
        console.log('Uploading images:', imagens);
        // Aqui implementaremos o upload para service_order_images
      }

      toast.success('Ordem de serviço atualizada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast.error('Erro ao atualizar ordem de serviço');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!ordemId) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando ordem de serviço...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const clienteSelecionado = clientes?.find(c => c.id === formData.cliente_id);
  const statusSelecionado = STATUS_OPTIONS.find(s => s.value === formData.status);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar OS #{ordem?.numeroOS}
            {statusSelecionado && (
              <Badge className={statusSelecionado.color}>
                {statusSelecionado.label}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações do Cliente</h3>
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={formData.cliente_id} onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      <div>
                        <div className="font-medium">{cliente.nome}</div>
                        <div className="text-sm text-gray-500">{cliente.telefone}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clienteSelecionado && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm">
                    <span className="font-medium">{clienteSelecionado.nome}</span>
                    <span className="mx-2">•</span>
                    <span>{clienteSelecionado.telefone}</span>
                    {clienteSelecionado.email && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{clienteSelecionado.email}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dados do Serviço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados do Serviço</h3>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Serviço *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o serviço a ser realizado..."
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_status">Status Pagamento</Label>
                <Select value={formData.payment_status} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Valores e Prazos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Valores e Prazos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_price">Valor Total (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="total_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_price: Number(e.target.value) }))}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_date">Data de Entrega</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Serviço Urgente */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="urgent"
                checked={formData.urgent}
                onChange={(e) => setFormData(prev => ({ ...prev, urgent: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="urgent" className="flex items-center gap-2">
                Serviço Urgente
              </Label>
            </div>
          </div>

          {/* Upload de Imagens */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <h3 className="text-lg font-medium">Galeria de Imagens</h3>
            </div>
            
            {ordemId && (
              <ImageUpload
                serviceOrderId={ordemId.toString()}
                showStats={true}
                allowedTypes={['before', 'after', 'progress', 'other']}
                maxImages={20}
                compressOptions={{
                  quality: 0.8,
                  maxWidth: 1200,
                  maxHeight: 1200,
                  compressFormat: 'image/jpeg'
                }}
              />
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={atualizarOrdem.isPending}>
              {atualizarOrdem.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 