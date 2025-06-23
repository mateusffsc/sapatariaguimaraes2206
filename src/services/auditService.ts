import { supabase } from '@/lib/supabase';

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CreateAuditLogData {
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

class AuditService {
  // Registrar uma ação no log de auditoria
  async logAction({
    action,
    resource,
    resource_id,
    details,
    severity = 'low'
  }: CreateAuditLogData): Promise<{ success: boolean; error?: string }> {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Obter dados do usuário da tabela users
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

      const auditData = {
        user_id: user.id,
        user_name: userData?.username || user.email || 'Usuário desconhecido',
        action,
        resource,
        resource_id,
        details,
        severity,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditData);

      if (error) {
        console.error('Erro ao registrar log de auditoria:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  // Obter logs de auditoria com filtros
  async getLogs({
    page = 1,
    limit = 50,
    userId,
    resource,
    action,
    severity,
    startDate,
    endDate
  }: {
    page?: number;
    limit?: number;
    userId?: string;
    resource?: string;
    action?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ data: AuditLog[]; count: number; error?: string }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      if (resource) {
        query = query.eq('resource', resource);
      }
      
      if (action) {
        query = query.ilike('action', `%${action}%`);
      }
      
      if (severity) {
        query = query.eq('severity', severity);
      }
      
      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      // Ordenação e paginação
      const { data, error, count } = await query
        .order('timestamp', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        return { data: [], count: 0, error: error.message };
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      return { data: [], count: 0, error: 'Erro interno do servidor' };
    }
  }

  // Obter estatísticas de auditoria
  async getStats(): Promise<{
    totalLogs: number;
    logsByResource: Array<{ resource: string; count: number }>;
    logsBySeverity: Array<{ severity: string; count: number }>;
    recentActions: AuditLog[];
    error?: string;
  }> {
    try {
      // Contar total de logs
      const { count: totalLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Logs por recurso
      const { data: resourceData } = await supabase
        .from('audit_logs')
        .select('resource')
        .order('resource');

      const logsByResource = resourceData?.reduce((acc: Array<{ resource: string; count: number }>, log) => {
        const existing = acc.find(item => item.resource === log.resource);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ resource: log.resource, count: 1 });
        }
        return acc;
      }, []) || [];

      // Logs por severidade
      const { data: severityData } = await supabase
        .from('audit_logs')
        .select('severity')
        .order('severity');

      const logsBySeverity = severityData?.reduce((acc: Array<{ severity: string; count: number }>, log) => {
        const existing = acc.find(item => item.severity === log.severity);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ severity: log.severity, count: 1 });
        }
        return acc;
      }, []) || [];

      // Ações recentes
      const { data: recentActions } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      return {
        totalLogs: totalLogs || 0,
        logsByResource,
        logsBySeverity,
        recentActions: recentActions || []
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de auditoria:', error);
      return {
        totalLogs: 0,
        logsByResource: [],
        logsBySeverity: [],
        recentActions: [],
        error: 'Erro interno do servidor'
      };
    }
  }

  // Limpar logs antigos (manter apenas últimos N dias)
  async cleanOldLogs(daysToKeep: number = 90): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select();

      if (error) {
        return { success: false, deletedCount: 0, error: error.message };
      }

      return { success: true, deletedCount: data?.length || 0 };
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
      return { success: false, deletedCount: 0, error: 'Erro interno do servidor' };
    }
  }

  // Obter IP do cliente (básico)
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // Métodos de conveniência para ações comuns
  async logLogin(success: boolean, details?: any) {
    return this.logAction({
      action: success ? 'login_success' : 'login_failed',
      resource: 'auth',
      details,
      severity: success ? 'low' : 'medium'
    });
  }

  async logLogout() {
    return this.logAction({
      action: 'logout',
      resource: 'auth',
      severity: 'low'
    });
  }

  async logCreate(resource: string, resourceId: string, details?: any) {
    return this.logAction({
      action: 'create',
      resource,
      resource_id: resourceId,
      details,
      severity: 'low'
    });
  }

  async logUpdate(resource: string, resourceId: string, details?: any) {
    return this.logAction({
      action: 'update',
      resource,
      resource_id: resourceId,
      details,
      severity: 'low'
    });
  }

  async logDelete(resource: string, resourceId: string, details?: any) {
    return this.logAction({
      action: 'delete',
      resource,
      resource_id: resourceId,
      details,
      severity: 'medium'
    });
  }

  async logView(resource: string, resourceId?: string, details?: any) {
    return this.logAction({
      action: 'view',
      resource,
      resource_id: resourceId,
      details,
      severity: 'low'
    });
  }

  async logCritical(action: string, resource: string, resourceId?: string, details?: any) {
    return this.logAction({
      action,
      resource,
      resource_id: resourceId,
      details,
      severity: 'critical'
    });
  }
}

export const auditService = new AuditService();
export default auditService; 