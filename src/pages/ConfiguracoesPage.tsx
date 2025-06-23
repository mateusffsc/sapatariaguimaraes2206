import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Settings,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Database,
  Download,
  Upload,
  HardDrive,
  FileText,
  Copy,
  MessageSquare,
  Mail,
  BarChart3
} from 'lucide-react';
import { FormaPagamentoModal } from '../components/modals/FormaPagamentoModal';
import { TemplateModal } from '../components/modals/TemplateModal';
import {
  useListarFormasPagamento,
  useExcluirFormaPagamento
} from '../hooks/usePayments';
import {
  useConfiguracaoEmpresa,
  useSalvarConfiguracaoEmpresa,
  useConfiguracoesCategorizadas,
  useDefinirConfiguracaoSistema,
  useExcluirConfiguracaoSistema,
  useInicializarConfiguracoesDefault,
  useEstatisticasConfiguracao
} from '../hooks/useConfig';
import {
  useListarTemplates,
  useExcluirTemplate,
  useDuplicarTemplate,
  useEstatisticasTemplates,
  useInicializarTemplatesPadrao
} from '../hooks/useTemplates';
import type { PaymentMethod, UpdateCompanySettings, DocumentTemplate } from '../types/database';

export const ConfiguracoesPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFormaPagamento, setSelectedFormaPagamento] = useState<PaymentMethod | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  
  // Estados para templates
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [templateModalMode, setTemplateModalMode] = useState<'create' | 'edit'>('create');
  
  // Estado para configuração da empresa
  const [empresaData, setEmpresaData] = useState<UpdateCompanySettings>({});

  // Hooks para formas de pagamento
  const { data: formasPagamento, isLoading } = useListarFormasPagamento();
  const excluirFormaPagamento = useExcluirFormaPagamento();

  // Hooks para configurações
  const { data: configuracaoEmpresa } = useConfiguracaoEmpresa();
  const salvarConfiguracaoEmpresa = useSalvarConfiguracaoEmpresa();
  const { data: configuracoesCategorizadas } = useConfiguracoesCategorizadas();
  const definirConfiguracao = useDefinirConfiguracaoSistema();
  const excluirConfiguracao = useExcluirConfiguracaoSistema();
  const inicializarConfiguracoes = useInicializarConfiguracoesDefault();
  const estatisticasConfig = useEstatisticasConfiguracao();

  // Hooks para templates
  const { data: templates } = useListarTemplates();
  const excluirTemplate = useExcluirTemplate();
  const duplicarTemplate = useDuplicarTemplate();
  const estatisticasTemplates = useEstatisticasTemplates();
  const inicializarTemplatesPadrao = useInicializarTemplatesPadrao();

  // Carregar dados da empresa quando disponível
  React.useEffect(() => {
    if (configuracaoEmpresa) {
      setEmpresaData(configuracaoEmpresa);
    }
  }, [configuracaoEmpresa]);

  // Handlers para formas de pagamento
  const handleNovaFormaPagamento = () => {
    setSelectedFormaPagamento(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditarFormaPagamento = (formaPagamento: PaymentMethod) => {
    setSelectedFormaPagamento(formaPagamento);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleExcluirFormaPagamento = async (id: number) => {
    try {
      await excluirFormaPagamento.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao excluir forma de pagamento:', error);
    }
  };

  // Handler para salvar configuração da empresa
  const handleSalvarEmpresa = async () => {
    try {
      await salvarConfiguracaoEmpresa.mutateAsync(empresaData);
    } catch (error) {
      console.error('Erro ao salvar configuração da empresa:', error);
    }
  };

  // Handlers para templates
  const handleNovoTemplate = () => {
    setSelectedTemplate(null);
    setTemplateModalMode('create');
    setTemplateModalOpen(true);
  };

  const handleEditarTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setTemplateModalMode('edit');
    setTemplateModalOpen(true);
  };

  const handleExcluirTemplate = async (id: number) => {
    try {
      await excluirTemplate.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao excluir template:', error);
    }
  };

  const handleDuplicarTemplate = async (id: number) => {
    const template = templates?.find(t => t.id === id);
    if (template) {
      const novoNome = `${template.name} - Cópia`;
      try {
        await duplicarTemplate.mutateAsync({ id, novoNome });
      } catch (error) {
        console.error('Erro ao duplicar template:', error);
      }
    }
  };

  const handleInicializarTemplatesPadrao = async () => {
    try {
      await inicializarTemplatesPadrao.mutateAsync();
    } catch (error) {
      console.error('Erro ao inicializar templates padrão:', error);
    }
  };

  // Funções utilitárias
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getTaxaTotal = (formaPagamento: PaymentMethod) => {
    const valorExemplo = 100;
    const taxaPercentual = (valorExemplo * formaPagamento.fee_percentage) / 100;
    const taxaFixa = formaPagamento.fee_fixed;
    return taxaPercentual + taxaFixa;
  };

  const getTaxaDisplay = (formaPagamento: PaymentMethod) => {
    const components = [];
    
    if (formaPagamento.fee_percentage > 0) {
      components.push(formatPercentage(formaPagamento.fee_percentage));
    }
    
    if (formaPagamento.fee_fixed > 0) {
      components.push(formatCurrency(formaPagamento.fee_fixed));
    }
    
    if (components.length === 0) {
      return 'Sem taxa';
    }
    
    return components.join(' + ');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações do Sistema"
        subtitle="Gerencie as configurações gerais, dados da empresa e parâmetros do sistema"
      />

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Aba Empresa */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Configure as informações básicas da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    value={empresaData.company_name || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Digite o nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade_name">Nome Fantasia</Label>
                  <Input
                    id="trade_name"
                    value={empresaData.trade_name || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, trade_name: e.target.value }))}
                    placeholder="Nome fantasia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={empresaData.cnpj || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={empresaData.cpf || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={empresaData.email || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={empresaData.phone || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={empresaData.website || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={empresaData.city || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={empresaData.state || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="UF"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={empresaData.zip_code || ''}
                    onChange={(e) => setEmpresaData(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Textarea
                  id="address"
                  value={empresaData.address || ''}
                  onChange={(e) => setEmpresaData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo da empresa"
                  rows={3}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleSalvarEmpresa}
                  disabled={salvarConfiguracaoEmpresa.isPending}
                >
                  {salvarConfiguracaoEmpresa.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Sistema */}
        <TabsContent value="sistema">
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <div className="text-2xl font-bold">{estatisticasConfig.total}</div>
                  <div className="text-xs text-gray-600">configurações</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Categorias</span>
                  </div>
                  <div className="text-2xl font-bold">{estatisticasConfig.categorias}</div>
                  <div className="text-xs text-gray-600">diferentes</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Públicas</span>
                  </div>
                  <div className="text-2xl font-bold">{estatisticasConfig.publicas}</div>
                  <div className="text-xs text-gray-600">visíveis</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Privadas</span>
                  </div>
                  <div className="text-2xl font-bold">{estatisticasConfig.privadas}</div>
                  <div className="text-xs text-gray-600">restritas</div>
                </CardContent>
              </Card>
            </div>

            {/* Configurações por Categoria */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Parâmetros do Sistema</CardTitle>
                    <CardDescription>
                      Configure os parâmetros operacionais do sistema
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => inicializarConfiguracoes.mutateAsync()}
                    variant="outline"
                    disabled={inicializarConfiguracoes.isPending}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Inicializar Padrões
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {configuracoesCategorizadas && Object.keys(configuracoesCategorizadas).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(configuracoesCategorizadas).map(([categoria, configs]) => (
                      <div key={categoria}>
                        <h3 className="text-lg font-semibold mb-3 capitalize">{categoria}</h3>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Configuração</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Visibilidade</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {configs.map((config) => (
                                <TableRow key={config.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{config.setting_key}</div>
                                      {config.description && (
                                        <div className="text-sm text-gray-500">{config.description}</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {config.setting_value}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">
                                      {config.setting_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={config.is_public ? "default" : "secondary"}
                                      className={config.is_public ? "bg-green-100 text-green-800" : ""}
                                    >
                                      {config.is_public ? 'Pública' : 'Privada'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Tem certeza de que deseja excluir a configuração "{config.setting_key}"?
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => excluirConfiguracao.mutateAsync(config.setting_key)}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Excluir
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-500 mb-2">Nenhuma configuração encontrada</div>
                    <p className="text-sm text-gray-400 mb-4">
                      Inicialize as configurações padrão para começar
                    </p>
                    <Button 
                      onClick={() => inicializarConfiguracoes.mutateAsync()}
                      variant="outline"
                      disabled={inicializarConfiguracoes.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Inicializar Configurações Padrão
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Templates */}
        <TabsContent value="templates">
          <div className="space-y-6">
            {/* Estatísticas dos Templates */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{estatisticasTemplates.total}</div>
                    <div className="text-sm text-gray-600">Total Templates</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{estatisticasTemplates.ativos}</div>
                    <div className="text-sm text-gray-600">Ativos</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{estatisticasTemplates.inativos}</div>
                    <div className="text-sm text-gray-600">Inativos</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Info className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{estatisticasTemplates.padrao}</div>
                    <div className="text-sm text-gray-600">Padrão</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card Principal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Templates e Documentos
                    </CardTitle>
                    <CardDescription>
                      Gerencie templates para impressão de OS, mensagens WhatsApp, e-mails e relatórios
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInicializarTemplatesPadrao}
                      variant="outline"
                      disabled={inicializarTemplatesPadrao.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Inicializar Padrões
                    </Button>
                    <Button onClick={handleNovoTemplate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Template
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {templates && templates.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Padrão</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {templates.map((template) => (
                          <TableRow key={template.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                {template.description && (
                                  <div className="text-sm text-gray-500">{template.description}</div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {template.type === 'os_print' && <FileText className="h-4 w-4 text-blue-600" />}
                                {template.type === 'whatsapp' && <MessageSquare className="h-4 w-4 text-green-600" />}
                                {template.type === 'email' && <Mail className="h-4 w-4 text-purple-600" />}
                                {template.type === 'report' && <BarChart3 className="h-4 w-4 text-orange-600" />}
                                <span className="text-sm">
                                  {template.type === 'os_print' && 'Impressão OS'}
                                  {template.type === 'whatsapp' && 'WhatsApp'}
                                  {template.type === 'email' && 'E-mail'}
                                  {template.type === 'report' && 'Relatório'}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline">{template.category}</Badge>
                            </TableCell>

                            <TableCell>
                              <Badge variant={template.is_active ? "default" : "secondary"}>
                                {template.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              {template.is_default && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Padrão
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditarTemplate(template)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicarTemplate(template.id)}
                                  disabled={duplicarTemplate.isPending}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza de que deseja excluir o template "{template.name}"?
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleExcluirTemplate(template.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Nenhum template encontrado</p>
                    <p className="text-sm">Clique em "Novo Template" ou "Inicializar Padrões" para começar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

                  {/* Aba Pagamentos (conteúdo existente) */}
        <TabsContent value="pagamentos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle>Formas de Pagamento</CardTitle>
                    <CardDescription>
                      Gerencie os métodos de pagamento disponíveis no sistema
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={handleNovaFormaPagamento}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Forma de Pagamento
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Carregando formas de pagamento...</div>
                </div>
              ) : !formasPagamento || formasPagamento.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-500 mb-2">Nenhuma forma de pagamento cadastrada</div>
                  <p className="text-sm text-gray-400 mb-4">
                    Cadastre métodos de pagamento para facilitar o controle financeiro
                  </p>
                  <Button onClick={handleNovaFormaPagamento} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeira Forma de Pagamento
                  </Button>
                </div>
              ) : (
                <>
                  {/* Estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Total</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {formasPagamento.length}
                      </div>
                      <div className="text-xs text-blue-600">formas de pagamento</div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Sem Taxa</span>
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        {formasPagamento.filter(f => f.fee_percentage === 0 && f.fee_fixed === 0).length}
                      </div>
                      <div className="text-xs text-green-600">métodos gratuitos</div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-600">Liquidação Média</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {formasPagamento.length > 0 
                          ? Math.round(formasPagamento.reduce((sum, f) => sum + f.liquidation_days, 0) / formasPagamento.length)
                          : 0
                        }
                      </div>
                      <div className="text-xs text-yellow-600">dias</div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Tabela de Formas de Pagamento */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Taxas</TableHead>
                          <TableHead>Liquidação</TableHead>
                          <TableHead>Taxa Total (R$ 100)</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formasPagamento.map((formaPagamento) => (
                          <TableRow key={formaPagamento.id}>
                            <TableCell>
                              <div className="font-medium">{formaPagamento.name}</div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {formaPagamento.fee_percentage === 0 && formaPagamento.fee_fixed === 0 ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Sem taxa
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    {getTaxaDisplay(formaPagamento)}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">
                                  {formaPagamento.liquidation_days === 0 
                                    ? 'Imediato' 
                                    : `${formaPagamento.liquidation_days} dia${formaPagamento.liquidation_days > 1 ? 's' : ''}`
                                  }
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge 
                                variant={getTaxaTotal(formaPagamento) === 0 ? "secondary" : "outline"}
                                className={getTaxaTotal(formaPagamento) === 0 ? "bg-green-100 text-green-800" : ""}
                              >
                                {formatCurrency(getTaxaTotal(formaPagamento))}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditarFormaPagamento(formaPagamento)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza de que deseja excluir a forma de pagamento "{formaPagamento.name}"?
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleExcluirFormaPagamento(formaPagamento.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Backup */}
        <TabsContent value="backup">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-green-600" />
                  Backup e Restore
                </CardTitle>
                <CardDescription>
                  Gerencie backups do sistema e restore de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Backup */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Backup</h3>
                    <div className="space-y-3">
                      <Button className="w-full" variant="default">
                        <Download className="h-4 w-4 mr-2" />
                        Fazer Backup Completo
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Database className="h-4 w-4 mr-2" />
                        Backup Apenas Dados
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Backup Configurações
                      </Button>
                    </div>
                  </div>

                  {/* Restore */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Restore</h3>
                    <div className="space-y-3">
                      <Button className="w-full" variant="secondary">
                        <Upload className="h-4 w-4 mr-2" />
                        Restaurar Backup
                      </Button>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Atenção:</strong> O restore irá sobrescrever todos os dados atuais. 
                          Faça um backup antes de prosseguir.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Configurações de Backup Automático */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Backup Automático</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-backup">Backup Automático</Label>
                      <p className="text-sm text-gray-600">
                        Realizar backup automático dos dados diariamente
                      </p>
                    </div>
                    <Switch id="auto-backup" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Forma de Pagamento */}
      <FormaPagamentoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        formaPagamento={selectedFormaPagamento}
        mode={modalMode}
      />

      {/* Modal de Template */}
      <TemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        template={selectedTemplate}
        mode={templateModalMode}
      />
    </div>
  );
}; 