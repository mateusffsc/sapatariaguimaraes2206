import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AutomationRule } from '@/services/whatsappAutomationService';
import { useWhatsAppTemplates } from '@/hooks/useWhatsApp';
import { Info, Clock, DollarSign, Users, MessageSquare, AlertCircle } from 'lucide-react';

interface AutomationRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>) => void;
  rule?: AutomationRule | null;
  isLoading?: boolean;
}

const automationTypes = [
  { 
    value: 'lembrete_entrega', 
    label: 'Lembrete de Entrega', 
    icon: Clock,
    description: 'Lembrar cliente sobre retirada do serviço',
    templateCategory: 'lembrete_entrega'
  },
  { 
    value: 'cobranca_atraso', 
    label: 'Cobrança de Atraso', 
    icon: DollarSign,
    description: 'Cobrar pagamentos em atraso',
    templateCategory: 'cobranca'
  },
  { 
    value: 'pesquisa_satisfacao', 
    label: 'Pesquisa de Satisfação', 
    icon: Users,
    description: 'Solicitar avaliação do serviço prestado',
    templateCategory: 'pesquisa_satisfacao'
  },
];

const triggerConditions = [
  {
    value: 'days_after_completion',
    label: 'Dias após conclusão',
    description: 'Executar X dias após a conclusão da OS'
  },
  {
    value: 'days_after_due_date',
    label: 'Dias após vencimento',
    description: 'Executar X dias após a data de vencimento'
  },
  {
    value: 'overdue_payment',
    label: 'Pagamento em atraso',
    description: 'Executar quando pagamento estiver em atraso'
  }
];

export const AutomationRuleModal: React.FC<AutomationRuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  rule,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '' as any,
    template_id: '',
    trigger_condition: '' as any,
    trigger_value: 1,
    active: true
  });

  const { templates } = useWhatsAppTemplates();

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        type: rule.type,
        template_id: rule.template_id,
        trigger_condition: rule.trigger_condition,
        trigger_value: rule.trigger_value,
        active: rule.active
      });
    } else {
      setFormData({
        name: '',
        type: '' as any,
        template_id: '',
        trigger_condition: '' as any,
        trigger_value: 1,
        active: true
      });
    }
  }, [rule, isOpen]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.type || !formData.template_id || !formData.trigger_condition) {
      return;
    }

    onSave({
      name: formData.name.trim(),
      type: formData.type,
      template_id: formData.template_id,
      trigger_condition: formData.trigger_condition,
      trigger_value: formData.trigger_value,
      active: formData.active
    });
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: type as any,
      template_id: '', // Reset template quando tipo muda
      trigger_condition: type === 'lembrete_entrega' || type === 'pesquisa_satisfacao' 
        ? 'days_after_completion' 
        : 'days_after_due_date'
    }));
  };

  const selectedType = automationTypes.find(t => t.value === formData.type);
  const selectedTrigger = triggerConditions.find(t => t.value === formData.trigger_condition);
  const availableTemplates = templates.filter(t => 
    selectedType ? t.category === selectedType.templateCategory && t.active : false
  );

  const isFormValid = formData.name.trim() && 
                     formData.type && 
                     formData.template_id && 
                     formData.trigger_condition &&
                     formData.trigger_value > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>{rule ? 'Editar Regra' : 'Nova Regra de Automação'}</span>
          </DialogTitle>
          <DialogDescription>
            Configure uma regra para envio automático de mensagens WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nome da Regra */}
          <div>
            <Label htmlFor="name">Nome da Regra</Label>
            <Input
              id="name"
              placeholder="Ex: Lembrete de entrega após 3 dias"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Tipo de Automação */}
          <div>
            <Label htmlFor="type">Tipo de Automação</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de automação" />
              </SelectTrigger>
              <SelectContent>
                {automationTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Template */}
          {selectedType && (
            <div>
              <Label htmlFor="template">Template de Mensagem</Label>
              <Select value={formData.template_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, template_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.length > 0 ? (
                    availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{template.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {template.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Nenhum template ativo encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {availableTemplates.length === 0 && selectedType && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum template ativo encontrado para "{selectedType.label}". 
                    Crie um template da categoria "{selectedType.templateCategory}" primeiro.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Condição de Disparo */}
          <div>
            <Label htmlFor="trigger_condition">Condição de Disparo</Label>
            <Select value={formData.trigger_condition} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, trigger_condition: value as any }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a condição" />
              </SelectTrigger>
              <SelectContent>
                {triggerConditions.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    <div>
                      <div className="font-medium">{condition.label}</div>
                      <div className="text-xs text-muted-foreground">{condition.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor do Gatilho (Dias) */}
          {formData.trigger_condition && formData.trigger_condition !== 'overdue_payment' && (
            <div>
              <Label htmlFor="trigger_value">
                {formData.trigger_condition === 'days_after_completion' ? 'Dias após conclusão' : 'Dias após vencimento'}
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="trigger_value"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.trigger_value}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    trigger_value: Math.max(1, parseInt(e.target.value) || 1)
                  }))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  {formData.trigger_value === 1 ? 'dia' : 'dias'}
                </span>
              </div>
            </div>
          )}

          {/* Status Ativo */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="active">Regra Ativa</Label>
              <p className="text-sm text-muted-foreground">
                Regras ativas serão executadas automaticamente
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
          </div>

          <Separator />

          {/* Preview da Configuração */}
          {selectedType && selectedTrigger && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium">Preview da Configuração</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <selectedType.icon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{selectedType.label}</span>
                </div>
                <div className="text-muted-foreground">
                  {selectedTrigger.description}
                  {formData.trigger_condition !== 'overdue_payment' && (
                    <span> em {formData.trigger_value} {formData.trigger_value === 1 ? 'dia' : 'dias'}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={formData.active ? 'default' : 'secondary'}>
                    {formData.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                  {availableTemplates.find(t => t.id === formData.template_id) && (
                    <Badge variant="outline">
                      Template: {availableTemplates.find(t => t.id === formData.template_id)?.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Informações importantes */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Como funciona:</strong> Quando uma ordem de serviço for{' '}
              {formData.trigger_condition === 'days_after_completion' ? 'concluída' : 'criada'}, 
              o sistema agendará automaticamente o envio desta mensagem conforme a condição configurada.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Salvando...' : rule ? 'Atualizar' : 'Criar Regra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};