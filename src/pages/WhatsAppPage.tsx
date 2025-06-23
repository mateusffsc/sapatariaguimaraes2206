import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WhatsAppTemplateModal } from '@/components/modals/WhatsAppTemplateModal';
import { AutomationRuleModal } from '@/components/modals/AutomationRuleModal';
import { useWhatsAppDashboard } from '@/hooks/useWhatsApp';
import { useAutomationDashboard } from '@/hooks/useWhatsAppAutomation';
import { WhatsAppTemplate } from '@/services/whatsappService';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  MessageSquare,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Wifi,
  WifiOff,
  AlertCircle,
  MessageCircle,
  DollarSign,
  RefreshCw,
  Bot,
  Zap,
  Play,
  Pause
} from 'lucide-react';

export function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [automationModalOpen, setAutomationModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [configData, setConfigData] = useState({
    api_url: '',
    api_token: '',
    webhook_url: '',
    auto_send_enabled: true
  });

  const {
    config,
    templates,
    messages,
    stats,
    isLoading,
    hasError,
    refetchAll,
    updateConfig,
    checkConnection,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    sendMessage,
    isUpdatingConfig,
    isCheckingConnection,
    isCreatingTemplate,
    isUpdatingTemplate,
    isDeletingTemplate,
    isSendingMessage
  } = useWhatsAppDashboard();

  const {
    rules: automationRules,
    executions: automationExecutions,
    stats: automationStats,
    isLoading: isLoadingAutomations,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    processScheduled,
    runBatch,
    isCreatingRule,
    isUpdatingRule,
    isDeletingRule,
    isTogglingRule,
    isProcessing,
    isRunningBatch
  } = useAutomationDashboard();

  React.useEffect(() => {
    if (config) {
      setConfigData({
        api_url: config.api_url || '',
        api_token: config.api_token || '',
        webhook_url: config.webhook_url || '',
        auto_send_enabled: config.auto_send_enabled || false
      });
    }
  }, [config]);

  const handleSaveConfig = () => {
    updateConfig(configData);
  };

  const handleCreateTemplate = (templateData: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    createTemplate(templateData);
    setTemplateModalOpen(false);
  };

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setTemplateModalOpen(true);
  };

  const handleUpdateTemplate = (templateData: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingTemplate) {
      updateTemplate({ id: editingTemplate.id, template: templateData });
      setTemplateModalOpen(false);
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplate(id);
    }
  };

  const handleCloseModal = () => {
    setTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  const handleCheckConnection = () => {
    checkConnection();
  };

  const handleCreateRule = (ruleData: any) => {
    createRule(ruleData);
    setAutomationModalOpen(false);
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    setAutomationModalOpen(true);
  };

  const handleUpdateRule = (ruleData: any) => {
    if (editingRule) {
      updateRule({ id: editingRule.id, rule: ruleData });
      setAutomationModalOpen(false);
      setEditingRule(null);
    }
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra de automação?')) {
      deleteRule(id);
    }
  };

  const handleToggleRule = (id: string, active: boolean) => {
    toggleRule({ id, active });
  };

  const handleCloseAutomationModal = () => {
    setAutomationModalOpen(false);
    setEditingRule(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ordem_criada':
      case 'ordem_concluida':
        return <MessageSquare className="h-4 w-4" />;
      case 'lembrete_entrega':
        return <Clock className="h-4 w-4" />;
      case 'cobranca':
        return <DollarSign className="h-4 w-4" />;
      case 'pesquisa_satisfacao':
        return <Users className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ordem_criada':
        return 'Ordem Criada';
      case 'ordem_concluida':
        return 'Ordem Concluída';
      case 'lembrete_entrega':
        return 'Lembrete de Entrega';
      case 'cobranca':
        return 'Cobrança';
      case 'pesquisa_satisfacao':
        return 'Pesquisa de Satisfação';
      default:
        return category;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="WhatsApp Business"
        subtitle="Gerencie mensagens automáticas e templates do WhatsApp"
      >
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckConnection}
            disabled={isCheckingConnection}
            className="flex items-center space-x-2"
          >
            {isCheckingConnection ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : config?.session_active ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span>Testar Conexão</span>
          </Button>
        </div>
      </PageHeader>

      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados do WhatsApp. Tente novamente.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automations">Automações</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <div className="text-sm text-muted-foreground">Total de Mensagens</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Skeleton className="h-6 w-16" /> : stats?.total_messages || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4 text-green-600" />
                  <div className="text-sm text-muted-foreground">Enviadas Hoje</div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? <Skeleton className="h-6 w-16" /> : stats?.sent_today || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div className="text-sm text-muted-foreground">Falhas Hoje</div>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? <Skeleton className="h-6 w-16" /> : stats?.failed_today || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div className="text-sm text-muted-foreground">Pendentes</div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {isLoading ? <Skeleton className="h-6 w-16" /> : stats?.pending_messages || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {config?.session_active ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <span>Status da Conexão</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={config?.session_active ? 'default' : 'secondary'}>
                      {config?.session_active ? 'Conectado' : 'Desconectado'}
                    </Badge>
                    <Badge variant={config?.auto_send_enabled ? 'default' : 'secondary'}>
                      {config?.auto_send_enabled ? 'Automático Ativo' : 'Automático Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {config?.session_active 
                      ? 'WhatsApp conectado e pronto para envio'
                      : 'WhatsApp desconectado - Configure a API para conectar'
                    }
                  </p>
                </div>
                <Button
                  onClick={handleCheckConnection}
                  disabled={isCheckingConnection}
                  variant="outline"
                >
                  {isCheckingConnection ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Templates de Mensagem</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie templates para envio automático de mensagens
              </p>
            </div>
            <Button
              onClick={() => setTemplateModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Template</span>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : templates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Atualizado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(template.category)}
                            <span className="font-medium">{template.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getCategoryLabel(template.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.active ? 'default' : 'secondary'}>
                            {template.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(template.updated_at), 'dd/MM/yyyy HH:mm', { locale: pt })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                              disabled={isUpdatingTemplate}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                              disabled={isDeletingTemplate}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum template encontrado
                  </p>
                  <Button
                    onClick={() => setTemplateModalOpen(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    Criar Primeiro Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Automações WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Configure regras para envio automático de mensagens
              </p>
            </div>
            <Button
              onClick={() => setAutomationModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Automação</span>
            </Button>
          </div>

          {/* Estatísticas de Automação */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <div className="text-sm text-muted-foreground">Total de Regras</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoadingAutomations ? <Skeleton className="h-6 w-16" /> : automationStats?.total_rules || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <div className="text-sm text-muted-foreground">Regras Ativas</div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {isLoadingAutomations ? <Skeleton className="h-6 w-16" /> : automationStats?.active_rules || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div className="text-sm text-muted-foreground">Agendadas</div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {isLoadingAutomations ? <Skeleton className="h-6 w-16" /> : automationStats?.scheduled_executions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {isLoadingAutomations ? <Skeleton className="h-6 w-16" /> : `${automationStats?.success_rate || 0}%`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controles de Processamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>Controle de Automações</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Processe automações agendadas manualmente ou execute todas as automações pendentes
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant={automationStats?.active_rules ? 'default' : 'secondary'}>
                      {automationStats?.active_rules || 0} regras ativas
                    </Badge>
                    <Badge variant="outline">
                      {automationStats?.executions_today || 0} execuções hoje
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => processScheduled()}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                  >
                    {isProcessing ? 'Processando...' : 'Processar Agendadas'}
                  </Button>
                  <Button
                    onClick={() => runBatch()}
                    disabled={isRunningBatch}
                    size="sm"
                  >
                    {isRunningBatch ? 'Executando...' : 'Executar Lote'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regras de Automação */}
          <Card>
            <CardHeader>
              <CardTitle>Regras de Automação</CardTitle>
              <CardDescription>
                Configure quando e como as mensagens serão enviadas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingAutomations ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : automationRules.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Condição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="font-medium">{rule.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {rule.type === 'lembrete_entrega' && <Clock className="h-4 w-4 text-blue-600" />}
                            {rule.type === 'cobranca_atraso' && <DollarSign className="h-4 w-4 text-red-600" />}
                            {rule.type === 'pesquisa_satisfacao' && <Users className="h-4 w-4 text-green-600" />}
                            <span className="text-sm">
                              {rule.type === 'lembrete_entrega' && 'Lembrete de Entrega'}
                              {rule.type === 'cobranca_atraso' && 'Cobrança de Atraso'}
                              {rule.type === 'pesquisa_satisfacao' && 'Pesquisa de Satisfação'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {rule.trigger_condition === 'days_after_completion' && `${rule.trigger_value} dias após conclusão`}
                            {rule.trigger_condition === 'days_after_due_date' && `${rule.trigger_value} dias após vencimento`}
                            {rule.trigger_condition === 'overdue_payment' && 'Pagamento em atraso'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleRule(rule.id, !rule.active)}
                              disabled={isTogglingRule}
                            >
                              {rule.active ? (
                                <Pause className="h-4 w-4 text-orange-600" />
                              ) : (
                                <Play className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Badge variant={rule.active ? 'default' : 'secondary'}>
                              {rule.active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRule(rule)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={isDeletingRule}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma automação configurada
                  </p>
                  <Button
                    onClick={() => setAutomationModalOpen(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    Criar Primeira Automação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execuções Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Execuções Recentes</CardTitle>
              <CardDescription>
                Histórico das últimas execuções de automações
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingAutomations ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : automationExecutions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Regra</TableHead>
                      <TableHead>Agendado Para</TableHead>
                      <TableHead>Executado Em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationExecutions.slice(0, 10).map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {execution.status === 'executed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {execution.status === 'scheduled' && <Clock className="h-4 w-4 text-yellow-600" />}
                            {execution.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                            {execution.status === 'cancelled' && <XCircle className="h-4 w-4 text-gray-600" />}
                            <span className="capitalize text-sm">
                              {execution.status === 'executed' && 'Executado'}
                              {execution.status === 'scheduled' && 'Agendado'}
                              {execution.status === 'failed' && 'Falhou'}
                              {execution.status === 'cancelled' && 'Cancelado'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">Regra #{execution.rule_id.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(execution.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: pt })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {execution.executed_at 
                            ? format(new Date(execution.executed_at), 'dd/MM/yyyy HH:mm', { locale: pt })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Nenhuma execução encontrada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Histórico de Mensagens</h3>
            <p className="text-sm text-muted-foreground">
              Últimas mensagens enviadas pelo sistema
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : messages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Enviado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(message.status)}
                            <span className="capitalize text-sm">
                              {message.status === 'sent' ? 'Enviado' :
                               message.status === 'failed' ? 'Falhou' :
                               message.status === 'pending' ? 'Pendente' : message.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {message.phone}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={message.message}>
                            {message.message}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {message.sent_at 
                            ? format(new Date(message.sent_at), 'dd/MM/yyyy HH:mm', { locale: pt })
                            : format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: pt })
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma mensagem encontrada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Configurações do WhatsApp</h3>
            <p className="text-sm text-muted-foreground">
              Configure a integração com a API do WhatsApp Business
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuração da API</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api_url">URL da API</Label>
                  <Input
                    id="api_url"
                    placeholder="https://api.whatsapp.com"
                    value={configData.api_url}
                    onChange={(e) => setConfigData(prev => ({ ...prev, api_url: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="api_token">Token da API</Label>
                  <Input
                    id="api_token"
                    type="password"
                    placeholder="Token de acesso"
                    value={configData.api_token}
                    onChange={(e) => setConfigData(prev => ({ ...prev, api_token: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhook_url">URL do Webhook</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://suaapi.com/webhook"
                  value={configData.webhook_url}
                  onChange={(e) => setConfigData(prev => ({ ...prev, webhook_url: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_send">Envio Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar mensagens automaticamente quando eventos ocorrerem
                  </p>
                </div>
                <Switch
                  id="auto_send"
                  checked={configData.auto_send_enabled}
                  onCheckedChange={(checked) => setConfigData(prev => ({ ...prev, auto_send_enabled: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Button
                  onClick={handleSaveConfig}
                  disabled={isUpdatingConfig}
                  className="flex items-center space-x-2"
                >
                  {isUpdatingConfig ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )}
                  <span>{isUpdatingConfig ? 'Salvando...' : 'Salvar Configurações'}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCheckConnection}
                  disabled={isCheckingConnection}
                  className="flex items-center space-x-2"
                >
                  {isCheckingConnection ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wifi className="h-4 w-4" />
                  )}
                  <span>{isCheckingConnection ? 'Testando...' : 'Testar Conexão'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WhatsAppTemplateModal
        isOpen={templateModalOpen}
        onClose={handleCloseModal}
        onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        template={editingTemplate}
        isLoading={isCreatingTemplate || isUpdatingTemplate}
      />

      <AutomationRuleModal
        isOpen={automationModalOpen}
        onClose={handleCloseAutomationModal}
        onSave={editingRule ? handleUpdateRule : handleCreateRule}
        rule={editingRule}
        isLoading={isCreatingRule || isUpdatingRule}
      />
    </div>
  );
}