import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  FileText, 
  MessageSquare, 
  Mail, 
  BarChart3, 
  Eye, 
  Code, 
  Info,
  Printer,
  Smartphone
} from 'lucide-react';
import { 
  useCriarTemplate, 
  useAtualizarTemplate, 
  useProcessarTemplate,
  useVariaveisDisponiveis 
} from '../../hooks/useTemplates';
import type { DocumentTemplate, CreateDocumentTemplate, UpdateDocumentTemplate } from '../../types/database';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: DocumentTemplate | null;
  mode: 'create' | 'edit';
}

const TIPOS_TEMPLATE = [
  { value: 'os_print', label: 'Impressão OS', icon: FileText, description: 'Template para impressão de Ordem de Serviço' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, description: 'Mensagens automáticas via WhatsApp' },
  { value: 'email', label: 'E-mail', icon: Mail, description: 'Templates para e-mails automáticos' },
  { value: 'report', label: 'Relatório', icon: BarChart3, description: 'Templates para relatórios' },
];

const TAMANHOS_PAPEL = [
  { value: 'a4', label: 'A4' },
  { value: 'thermal_80mm', label: 'Térmica 80mm' },
  { value: 'thermal_58mm', label: 'Térmica 58mm' },
];

const ORIENTACOES = [
  { value: 'portrait', label: 'Retrato' },
  { value: 'landscape', label: 'Paisagem' },
];

export function TemplateModal({ isOpen, onClose, template, mode }: TemplateModalProps) {
  const [formData, setFormData] = useState<Partial<CreateDocumentTemplate>>({
    name: '',
    type: 'os_print',
    category: '',
    template_content: '',
    variables: [],
    is_active: true,
    is_default: false,
    description: '',
    paper_size: 'a4',
    orientation: 'portrait',
  });

  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('editor');

  const criarTemplate = useCriarTemplate();
  const atualizarTemplate = useAtualizarTemplate();
  const processarTemplate = useProcessarTemplate();
  const variaveisDisponiveis = useVariaveisDisponiveis();

  const isEditing = mode === 'edit' && template;
  const isLoading = criarTemplate.isPending || atualizarTemplate.isPending;

  // Carregar dados do template para edição
  useEffect(() => {
    if (isEditing && template) {
      setFormData({
        name: template.name,
        type: template.type,
        category: template.category,
        template_content: template.template_content,
        variables: template.variables,
        is_active: template.is_active,
        is_default: template.is_default,
        description: template.description || '',
        paper_size: template.paper_size || 'a4',
        orientation: template.orientation || 'portrait',
      });
      
      // Preencher dados de preview com exemplos
      const dadosExemplo = gerarDadosExemplo(template.variables);
      setPreviewData(dadosExemplo);
    } else {
      setFormData({
        name: '',
        type: 'os_print',
        category: '',
        template_content: '',
        variables: [],
        is_active: true,
        is_default: false,
        description: '',
        paper_size: 'a4',
        orientation: 'portrait',
      });
      setPreviewData({});
    }
  }, [isEditing, template, isOpen]);

  const gerarDadosExemplo = (variaveis: string[]): Record<string, string> => {
    const exemplos: Record<string, string> = {};
    
    Object.values(variaveisDisponiveis).flat().forEach(variavel => {
      if (variaveis.includes(variavel.key)) {
        exemplos[variavel.key] = variavel.example;
      }
    });

    return exemplos;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && template) {
        await atualizarTemplate.mutateAsync({
          id: template.id,
          dados: formData as UpdateDocumentTemplate
        });
      } else {
        await criarTemplate.mutateAsync(formData as CreateDocumentTemplate);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const handleVariableInsert = (variavel: string) => {
    const textarea = document.getElementById('template_content') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBefore = formData.template_content?.substring(0, cursorPos) || '';
      const textAfter = formData.template_content?.substring(cursorPos) || '';
      const newContent = textBefore + `{{${variavel}}}` + textAfter;
      
      setFormData(prev => ({ ...prev, template_content: newContent }));
      
      // Focar e posicionar cursor após a inserção
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = cursorPos + variavel.length + 4;
        textarea.selectionEnd = cursorPos + variavel.length + 4;
      }, 10);
    }
  };

  const previewContent = processarTemplate.data || formData.template_content || '';

  const tipoSelecionado = TIPOS_TEMPLATE.find(t => t.value === formData.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tipoSelecionado?.icon && <tipoSelecionado.icon className="h-5 w-5" />}
            {isEditing ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="variaveis" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Variáveis
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="editor" className="h-full space-y-4 overflow-y-auto pr-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Template *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do template"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_TEMPLATE.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            <div className="flex items-center gap-2">
                              <tipo.icon className="h-4 w-4" />
                              {tipo.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Ex: sapataria, cliente, entrega"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do template"
                    />
                  </div>
                </div>

                {/* Configurações de Impressão (apenas para OS) */}
                {formData.type === 'os_print' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="paper_size" className="flex items-center gap-2">
                        <Printer className="h-4 w-4" />
                        Tamanho do Papel
                      </Label>
                      <Select 
                        value={formData.paper_size} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, paper_size: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TAMANHOS_PAPEL.map(tamanho => (
                            <SelectItem key={tamanho.value} value={tamanho.value}>
                              {tamanho.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orientation">Orientação</Label>
                      <Select 
                        value={formData.orientation} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, orientation: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORIENTACOES.map(orientacao => (
                            <SelectItem key={orientacao.value} value={orientacao.value}>
                              {orientacao.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Conteúdo do Template */}
                <div className="space-y-2">
                  <Label htmlFor="template_content">Conteúdo do Template *</Label>
                  <Textarea
                    id="template_content"
                    value={formData.template_content || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                    placeholder={`Digite o conteúdo do template...

Exemplo para WhatsApp:
Olá {{cliente_nome}}! 
Sua OS {{os_numero}} está pronta para retirada.
Valor: {{valor_total}}`}
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                </div>

                {/* Configurações */}
                <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Template Ativo</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                    />
                    <Label htmlFor="is_default">Template Padrão</Label>
                  </div>
                </div>

                {formData.is_default && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Este template será usado por padrão para este tipo e categoria. 
                      Outros templates padrão desta categoria serão desmarcados automaticamente.
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview" className="h-full space-y-4 overflow-y-auto pr-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Preview do Template</h3>
                  <Button
                    type="button"
                    onClick={() => {
                      const dados = gerarDadosExemplo(formData.variables || []);
                      setPreviewData(dados);
                      processarTemplate.mutateAsync({
                        templateContent: formData.template_content || '',
                        dados
                      });
                    }}
                    variant="outline"
                    disabled={processarTemplate.isPending}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Atualizar Preview
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {formData.type === 'whatsapp' && <Smartphone className="h-4 w-4" />}
                      {formData.type === 'email' && <Mail className="h-4 w-4" />}
                      {formData.type === 'os_print' && <FileText className="h-4 w-4" />}
                      {formData.type === 'report' && <BarChart3 className="h-4 w-4" />}
                      {tipoSelecionado?.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formData.type === 'os_print' ? (
                      <div 
                        className="border p-4 bg-white text-black min-h-[400px]"
                        dangerouslySetInnerHTML={{ __html: previewContent }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded border min-h-[200px]">
                        {previewContent || 'Digite o conteúdo do template para ver o preview...'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Variáveis */}
            <TabsContent value="variaveis" className="h-full space-y-4 overflow-y-auto pr-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Variáveis Disponíveis</h3>
                
                {Object.entries(variaveisDisponiveis).map(([categoria, variaveis]) => (
                  <Card key={categoria}>
                    <CardHeader>
                      <CardTitle className="text-sm capitalize">{categoria}</CardTitle>
                      <CardDescription>
                        Clique em uma variável para inserir no template
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {variaveis.map(variavel => (
                          <div
                            key={variavel.key}
                            className="p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleVariableInsert(variavel.key)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-xs">
                                {`{{${variavel.key}}}`}
                              </Badge>
                              {variavel.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Obrigatória
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm font-medium">{variavel.description}</div>
                            <div className="text-xs text-gray-500">Ex: {variavel.example}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Template')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 