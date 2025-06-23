import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Shield, 
  Eye, 
  Filter, 
  Download, 
  Trash2, 
  Search,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuditLogs, useAuditStats, useAudit } from '@/hooks/useAudit';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PermissionGate from './PermissionGate';
import type { AuditLog } from '@/services/auditService';

interface AuditLogsProps {
  className?: string;
}

const severityIcons = {
  low: Info,
  medium: AlertTriangle,
  high: AlertCircle,
  critical: XCircle
};

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export const AuditLogs: React.FC<AuditLogsProps> = ({ className = "" }) => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    userId: '',
    resource: '',
    action: '',
    severity: '',
    startDate: '',
    endDate: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: logsData, isLoading, error } = useAuditLogs(filters);
  const { data: stats } = useAuditStats();
  const { cleanOldLogs, isCleaning } = useAudit();

  const logs = logsData?.data || [];
  const totalLogs = logsData?.count || 0;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleSearch = () => {
    handleFilterChange('action', searchTerm);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const handleCleanLogs = () => {
    if (confirm('Tem certeza que deseja limpar logs antigos (90+ dias)? Esta ação não pode ser desfeita.')) {
      cleanOldLogs(90);
    }
  };

  const exportLogs = () => {
    if (logs.length === 0) {
      toast({
        title: "Nenhum log para exportar",
        description: "Não há logs disponíveis para exportação.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'Severidade', 'IP', 'Detalhes'].join(','),
      ...logs.map(log => [
        format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
        log.user_name,
        log.action,
        log.resource,
        log.severity,
        log.ip_address || 'N/A',
        JSON.stringify(log.details || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Logs exportados com sucesso!",
      description: "O arquivo CSV foi baixado.",
    });
  };

  const getSeverityIcon = (severity: string) => {
    const Icon = severityIcons[severity as keyof typeof severityIcons] || Info;
    return <Icon size={16} />;
  };

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar logs de auditoria: {typeof error === 'string' ? error : 'Erro desconhecido'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <PermissionGate requiredPermissions={['audit.view']} requiredRole="manager">
      <div className={`space-y-6 ${className}`}>
        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLogs}</div>
              </CardContent>
            </Card>

            {stats.logsBySeverity.map(item => (
              <Card key={item.severity}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {item.severity === 'low' ? 'Baixa' : 
                     item.severity === 'medium' ? 'Média' :
                     item.severity === 'high' ? 'Alta' : 'Crítica'}
                  </CardTitle>
                  {getSeverityIcon(item.severity)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.count}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter size={20} />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Buscar ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search size={16} />
                </Button>
              </div>

              <Select value={filters.resource} onValueChange={(value) => handleFilterChange('resource', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Recurso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="auth">Autenticação</SelectItem>
                  <SelectItem value="clients">Clientes</SelectItem>
                  <SelectItem value="service_orders">Ordens de Serviço</SelectItem>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="products">Produtos</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                  <SelectItem value="users">Usuários</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex space-x-2">
                <Button onClick={exportLogs} variant="outline" size="sm">
                  <Download size={16} className="mr-2" />
                  Exportar
                </Button>
                <PermissionGate requiredRole="admin">
                  <Button 
                    onClick={handleCleanLogs} 
                    variant="outline" 
                    size="sm"
                    disabled={isCleaning}
                  >
                    <Trash2 size={16} className="mr-2" />
                    {isCleaning ? 'Limpando...' : 'Limpar'}
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs de Auditoria</CardTitle>
            <CardDescription>
              Histórico de ações realizadas no sistema ({totalLogs} registros)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum log encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{log.user_name}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell>
                          <Badge className={severityColors[log.severity as keyof typeof severityColors]}>
                            {getSeverityIcon(log.severity)}
                            <span className="ml-1 capitalize">
                              {log.severity === 'low' ? 'Baixa' : 
                               log.severity === 'medium' ? 'Média' :
                               log.severity === 'high' ? 'Alta' : 'Crítica'}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {log.ip_address || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {totalLogs > filters.limit && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4">
              Página {filters.page} de {Math.ceil(totalLogs / filters.limit)}
            </span>
            <Button
              variant="outline"
              disabled={filters.page >= Math.ceil(totalLogs / filters.limit)}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Próxima
            </Button>
          </div>
        )}

        {/* Modal de Detalhes */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre a ação registrada
              </DialogDescription>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data/Hora</label>
                    <p className="text-sm">
                      {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Usuário</label>
                    <p className="text-sm">{selectedLog.user_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ação</label>
                    <p className="text-sm">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Recurso</label>
                    <p className="text-sm">{selectedLog.resource}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID do Recurso</label>
                    <p className="text-sm">{selectedLog.resource_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Severidade</label>
                    <Badge className={severityColors[selectedLog.severity as keyof typeof severityColors]}>
                      {getSeverityIcon(selectedLog.severity)}
                      <span className="ml-1 capitalize">
                        {selectedLog.severity === 'low' ? 'Baixa' : 
                         selectedLog.severity === 'medium' ? 'Média' :
                         selectedLog.severity === 'high' ? 'Alta' : 'Crítica'}
                      </span>
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Endereço IP</label>
                    <p className="text-sm">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User Agent</label>
                    <p className="text-sm truncate" title={selectedLog.user_agent}>
                      {selectedLog.user_agent || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Detalhes</label>
                    <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}; 