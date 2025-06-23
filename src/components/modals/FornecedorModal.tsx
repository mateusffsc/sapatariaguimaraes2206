import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useCriarFornecedor, useAtualizarFornecedor, useFornecedor } from '@/hooks/useFornecedores';
import { CreateSupplier, UpdateSupplier, SupplierWithRelations } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FornecedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedorId?: string;
  mode: 'create' | 'edit' | 'view';
}

interface FormData {
  name: string;
  contact_info: string;
  active: boolean;
}

export function FornecedorModal({ open, onOpenChange, fornecedorId, mode }: FornecedorModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contact_info: '',
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const isReadonly = mode === 'view';
  const isEditing = mode === 'edit';

  // Hooks
  const { data: fornecedor, isLoading: isLoadingFornecedor } = useFornecedor(fornecedorId) as { data: SupplierWithRelations | null; isLoading: boolean };
  const criarFornecedor = useCriarFornecedor();
  const atualizarFornecedor = useAtualizarFornecedor();

  // Efeito para carregar dados do fornecedor
  useEffect(() => {
    if (fornecedor) {
      setFormData({
        name: fornecedor.name,
        contact_info: fornecedor.contact_info || '',
        active: fornecedor.active ?? true,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        contact_info: '',
        active: true,
      });
    }
  }, [fornecedor, mode]);

  // Validação
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (mode === 'create') {
        const novoFornecedor: CreateSupplier = {
          name: formData.name.trim(),
          contact_info: formData.contact_info.trim() || undefined,
          active: formData.active,
        };
        
        await criarFornecedor.mutateAsync(novoFornecedor);
      } else if (mode === 'edit' && fornecedorId) {
        const dadosAtualizacao: UpdateSupplier = {
          name: formData.name.trim(),
          contact_info: formData.contact_info.trim() || undefined,
          active: formData.active,
        };
        
        await atualizarFornecedor.mutateAsync({ id: fornecedorId, data: dadosAtualizacao });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Novo Fornecedor';
      case 'edit': return 'Editar Fornecedor';
      case 'view': return 'Detalhes do Fornecedor';
      default: return 'Fornecedor';
    }
  };

  const getModalDescription = () => {
    switch (mode) {
      case 'create': return 'Cadastre um novo fornecedor no sistema';
      case 'edit': return 'Edite as informações do fornecedor'; 
      case 'view': return 'Visualize os detalhes e estatísticas do fornecedor';
      default: return '';
    }
  };

  const parseContactInfo = (contactInfo: string) => {
    if (!contactInfo) return { phone: '', email: '', address: '' };
    
    try {
      return JSON.parse(contactInfo);
    } catch {
      // Se não for JSON, assumir que é apenas telefone
      return { phone: contactInfo, email: '', address: '' };
    }
  };

  const renderContactInfo = () => {
    if (!formData.contact_info) return null;
    
    const contact = parseContactInfo(formData.contact_info);
    
    return (
      <div className="space-y-2">
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {contact.phone}
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {contact.email}
          </div>
        )}
        {contact.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {contact.address}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingFornecedor && (mode === 'edit' || mode === 'view')) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>

        {mode === 'view' && fornecedor ? (
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    {fornecedor.name}
                    <Badge variant={(fornecedor.active ?? true) ? "default" : "secondary"}>
                      {(fornecedor.active ?? true) ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderContactInfo()}
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Data de Cadastro</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(fornecedor.created_at)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Última Atualização</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(fornecedor.updated_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="estatisticas" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Contas em Aberto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {fornecedor.accounts_payable?.filter(c => c.status === 'open').length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatCurrency(
                        fornecedor.accounts_payable?.filter(c => c.status === 'open')
                          .reduce((sum, c) => sum + c.balance_due, 0) || 0
                      )}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Contas Pagas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {fornecedor.accounts_payable?.filter(c => c.status === 'paid').length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatCurrency(
                        fornecedor.accounts_payable?.filter(c => c.status === 'paid')
                          .reduce((sum, c) => sum + c.total_amount_due, 0) || 0
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {fornecedor.accounts_payable && fornecedor.accounts_payable.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contas Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {fornecedor.accounts_payable.slice(0, 5).map((conta) => (
                        <div key={conta.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{conta.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Vencimento: {formatDate(conta.due_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(conta.balance_due)}</p>
                            <Badge variant={conta.status === 'paid' ? 'default' : 'destructive'}>
                              {conta.status === 'paid' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Fornecedor *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Distribuidora ABC"
                  disabled={isReadonly}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_info">
                  Informações de Contato
                </Label>
                <Textarea
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => handleInputChange('contact_info', e.target.value)}
                  placeholder="Telefone, email, endereço, etc."
                  disabled={isReadonly}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Adicione telefone, email, endereço ou outras informações relevantes
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => handleInputChange('active', checked)}
                  disabled={isReadonly}
                />
                <Label htmlFor="active">Fornecedor ativo</Label>
              </div>
            </div>

            {!isReadonly && (
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={criarFornecedor.isPending || atualizarFornecedor.isPending}
                >
                  {(criarFornecedor.isPending || atualizarFornecedor.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {mode === 'create' ? 'Criar Fornecedor' : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 