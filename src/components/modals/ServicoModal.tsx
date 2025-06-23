import React, { useState, useEffect } from 'react';
import { useCreateService, useUpdateService, useServiceValidation } from '@/hooks/useServices';
import { Service, CreateService, UpdateService } from '@/types/database';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, DollarSign, Tag, FileText, Zap } from 'lucide-react';

interface ServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  servico?: Service;
  mode?: 'create' | 'edit';
}

interface FormData {
  name: string;
  description: string;
  category: string;
  price: string;
  estimated_time_minutes: string;
  active: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  name: '',
  description: '',
  category: '',
  price: '',
  estimated_time_minutes: '',
  active: true,
};

export function ServicoModal({ isOpen, onClose, servico, mode = 'create' }: ServicoModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<string[]>([]);

  const { categories, validateService, formatPrice, formatTime } = useServiceValidation();
  const createService = useCreateService();
  const updateService = useUpdateService();

  const isEditing = mode === 'edit' && servico;
  const isLoading = createService.isPending || updateService.isPending;

  // Carregar dados do serviço para edição
  useEffect(() => {
    if (isEditing && servico) {
      setFormData({
        name: servico.name,
        description: servico.description || '',
        category: servico.category,
        price: servico.price.toString(),
        estimated_time_minutes: servico.estimated_time_minutes?.toString() || '',
        active: servico.active,
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setErrors([]);
  }, [isEditing, servico, isOpen]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erros ao editar
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Converter strings para números
    const priceValue = parseFloat(formData.price) || 0;
    const timeValue = formData.estimated_time_minutes ? 
      parseInt(formData.estimated_time_minutes) : undefined;

    const serviceData: CreateService | UpdateService = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category,
      price: priceValue,
      estimated_time_minutes: timeValue,
      active: formData.active,
    };

    // Validar dados
    const validation = validateService(serviceData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      if (isEditing && servico) {
        await updateService.mutateAsync({
          id: servico.id.toString(),
          updates: serviceData as UpdateService
        });
      } else {
        await createService.mutateAsync(serviceData as CreateService);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alertas de erro */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Nome do serviço */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Nome do Serviço *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Troca de Sola"
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categoria *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid com preço e tempo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preço */}
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Preço Base *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0,00"
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
              {formData.price && (
                <div className="text-sm text-muted-foreground">
                  {formatPrice(parseFloat(formData.price) || 0)}
                </div>
              )}
            </div>

            {/* Tempo estimado */}
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tempo Estimado
              </Label>
              <div className="relative">
                <Input
                  id="time"
                  type="number"
                  min="0"
                  value={formData.estimated_time_minutes}
                  onChange={(e) => handleInputChange('estimated_time_minutes', e.target.value)}
                  placeholder="60"
                  disabled={isLoading}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                  min
                </span>
              </div>
              {formData.estimated_time_minutes && (
                <div className="text-sm text-muted-foreground">
                  {formatTime(parseInt(formData.estimated_time_minutes))}
                </div>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva os detalhes do serviço..."
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Status ativo */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Status do Serviço</Label>
              <p className="text-sm text-muted-foreground">
                {formData.active 
                  ? 'Serviço ativo e disponível para uso' 
                  : 'Serviço inativo e não disponível'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={formData.active ? "default" : "secondary"}>
                {formData.active ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => handleInputChange('active', checked)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Preview do serviço */}
          {(formData.name || formData.category || formData.price) && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Preview do Serviço</h4>
              <div className="space-y-2 text-sm">
                {formData.name && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formData.name}</span>
                  </div>
                )}
                {formData.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{formData.category}</Badge>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  {formData.price && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatPrice(parseFloat(formData.price) || 0)}</span>
                    </div>
                  )}
                  {formData.estimated_time_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(parseInt(formData.estimated_time_minutes))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Serviço'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 