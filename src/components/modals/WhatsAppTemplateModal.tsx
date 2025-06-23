import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WhatsAppTemplate } from '@/services/whatsappService';
import { Info, MessageSquare, Users, Clock, DollarSign, AlertTriangle } from 'lucide-react';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>) => void;
  template?: WhatsAppTemplate | null;
  isLoading?: boolean;
}

const templateCategories = [
  { value: 'ordem_criada', label: 'Ordem Criada', icon: MessageSquare },
  { value: 'ordem_concluida', label: 'Ordem Concluída', icon: MessageSquare },
  { value: 'lembrete_entrega', label: 'Lembrete de Entrega', icon: Clock },
  { value: 'cobranca', label: 'Cobrança', icon: DollarSign },
  { value: 'pesquisa_satisfacao', label: 'Pesquisa de Satisfação', icon: Users },
] as const;

const availableVariables = {
  ordem_criada: [
    { key: 'cliente_nome', description: 'Nome do cliente' },
    { key: 'numero_os', description: 'Número da OS' },
    { key: 'servicos', description: 'Lista de serviços' },
    { key: 'tecnico', description: 'Nome do técnico' },
    { key: 'valor_total', description: 'Valor total' },
    { key: 'prazo_estimado', description: 'Prazo estimado' }
  ],
  ordem_concluida: [
    { key: 'cliente_nome', description: 'Nome do cliente' },
    { key: 'numero_os', description: 'Número da OS' },
    { key: 'valor_total', description: 'Valor total' }
  ],
  lembrete_entrega: [
    { key: 'cliente_nome', description: 'Nome do cliente' },
    { key: 'numero_os', description: 'Número da OS' },
    { key: 'data_entrega', description: 'Data de entrega' }
  ],
  cobranca: [
    { key: 'cliente_nome', description: 'Nome do cliente' },
    { key: 'numero_os', description: 'Número da OS' },
    { key: 'valor_total', description: 'Valor total' },
    { key: 'dias_atraso', description: 'Dias de atraso' }
  ],
  pesquisa_satisfacao: [
    { key: 'cliente_nome', description: 'Nome do cliente' },
    { key: 'numero_os', description: 'Número da OS' },
    { key: 'link_pesquisa', description: 'Link da pesquisa' }
  ]
};

const defaultTemplates = {
  ordem_criada: `Olá {{cliente_nome}}! 🔧

Sua ordem de serviço foi criada com sucesso!

📋 **Detalhes:**
• OS: {{numero_os}}
• Serviços: {{servicos}}
• Técnico: {{tecnico}}
• Valor: {{valor_total}}
• Prazo: {{prazo_estimado}}

Em breve entraremos em contato. Obrigado! 😊`,

  ordem_concluida: `Olá {{cliente_nome}}! ✅

Sua ordem de serviço {{numero_os}} foi concluída!

💰 **Valor total:** {{valor_total}}

Você pode retirar seu calçado na nossa loja.

Obrigado pela confiança! 🙏`,

  lembrete_entrega: `Olá {{cliente_nome}}! ⏰

Lembramos que sua ordem {{numero_os}} está pronta para retirada desde {{data_entrega}}.

Nosso horário de funcionamento:
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h

Aguardamos você! 😊`,

  cobranca: `Olá {{cliente_nome}}! 💰

Identificamos que a OS {{numero_os}} no valor de {{valor_total}} está em atraso há {{dias_atraso}} dias.

Por favor, entre em contato conosco para regularizar a situação.

Obrigado! 🙏`,

  pesquisa_satisfacao: `Olá {{cliente_nome}}! ⭐

Esperamos que tenha ficado satisfeito com nosso serviço na OS {{numero_os}}.

Sua opinião é muito importante! Por favor, avalie nosso atendimento: {{link_pesquisa}}

Obrigado! 😊`
};

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  template,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '' as any,
    template: '',
    active: true,
    variables: [] as string[]
  });

  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        category: template.category,
        template: template.template,
        active: template.active,
        variables: template.variables
      });
    } else {
      setFormData({
        name: '',
        category: '' as any,
        template: '',
        active: true,
        variables: []
      });
    }
    setPreviewVariables({});
  }, [template, isOpen]);

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category: category as any,
      template: defaultTemplates[category as keyof typeof defaultTemplates] || '',
      variables: availableVariables[category as keyof typeof availableVariables]?.map(v => v.key) || []
    }));
    
    // Reset preview variables
    const categoryVars = availableVariables[category as keyof typeof availableVariables] || [];
    const newPreviewVars: Record<string, string> = {};
    categoryVars.forEach(variable => {
      newPreviewVars[variable.key] = `[${variable.description}]`;
    });
    setPreviewVariables(newPreviewVars);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.category || !formData.template.trim()) {
      return;
    }

    onSave({
      name: formData.name.trim(),
      category: formData.category,
      template: formData.template.trim(),
      active: formData.active,
      variables: formData.variables
    });
  };

  const insertVariable = (variableKey: string) => {
    const placeholder = `{{${variableKey}}}`;
    const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = formData.template.substring(0, start) + placeholder + formData.template.substring(end);
      setFormData(prev => ({ ...prev, template: newText }));
      
      // Restaurar posição do cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const generatePreview = () => {
    let preview = formData.template;
    Object.entries(previewVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      preview = preview.replace(new RegExp(placeholder, 'g'), value);
    });
    return preview;
  };

  const categoryInfo = templateCategories.find(cat => cat.value === formData.category);
  const categoryVariables = formData.category ? availableVariables[formData.category] || [] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>{template ? 'Editar Template' : 'Novo Template'}</span>
          </DialogTitle>
          <DialogDescription>
            Configure um template de mensagem WhatsApp para automações
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                placeholder="Ex: Confirmação de Ordem"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {templateCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Template Ativo</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="template-textarea">Mensagem Template</Label>
              <Textarea
                id="template-textarea"
                placeholder="Digite sua mensagem aqui..."
                value={formData.template}
                onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                rows={8}
                className="resize-none"
              />
            </div>

            {/* Variáveis Disponíveis */}
            {categoryVariables.length > 0 && (
              <div>
                <Label>Variáveis Disponíveis</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {categoryVariables.map((variable) => (
                    <Button
                      key={variable.key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.key)}
                      className="justify-start text-xs h-8"
                    >
                      <code className="mr-2 text-xs">
                        {`{{${variable.key}}}`}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {variable.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium">Preview da Mensagem</Label>
              {formData.category && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-3">
                    {categoryInfo && <categoryInfo.icon className="h-4 w-4 text-green-600" />}
                    <Badge variant="secondary">{categoryInfo?.label}</Badge>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-3 max-h-64 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm">
                      {generatePreview() || 'Digite o template para ver o preview...'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info sobre variáveis */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Como usar:</strong> Use {`{{variavel}}`} para inserir dados dinâmicos. 
                Exemplo: {`{{cliente_nome}}`} será substituído pelo nome real do cliente.
              </AlertDescription>
            </Alert>

            {/* Validações */}
            {formData.template && (
              <div className="space-y-2">
                <Label className="text-sm">Validações</Label>
                <div className="space-y-1">
                  {formData.template.length > 1600 && (
                    <div className="flex items-center space-x-2 text-orange-600 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Mensagem muito longa (máx. 1600 caracteres)</span>
                    </div>
                  )}
                  
                  {formData.template.length <= 1600 && (
                    <div className="flex items-center space-x-2 text-green-600 text-xs">
                      <Info className="h-3 w-3" />
                      <span>{formData.template.length}/1600 caracteres</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.name.trim() || !formData.category || !formData.template.trim() || isLoading}
          >
            {isLoading ? 'Salvando...' : template ? 'Atualizar' : 'Criar Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 