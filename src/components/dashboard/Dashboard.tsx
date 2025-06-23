import React, { useState, useEffect } from 'react';
import { DashboardCards } from './DashboardCards';
import { CashRegister } from './CashRegister';
import { DailyTasks } from './DailyTasks';
import { QuickActions } from './QuickActions';
import { RecentTransactions } from './RecentTransactions';
import { RoleBasedStats, RoleBasedActions, FeatureByRole } from '../UserLevelInterface';
import { AuditLogs } from '../AuditLogs';
import { useAudit } from '@/hooks/useAudit';
import { useCurrentUser } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGate from '../PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, Users, DollarSign } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useCurrentUser();
  const { role, isAdmin, isManager } = usePermissions();
  const { logView } = useAudit();

  // Log de acesso ao dashboard
  useEffect(() => {
    if (user) {
      logView('dashboard', undefined, { 
        userRole: role,
        timestamp: new Date().toISOString()
      });
    }
  }, [user, role, logView]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <RoleBasedStats
            adminStats={<p className="text-gray-600">Painel de controle administrativo completo</p>}
            managerStats={<p className="text-gray-600">Visão gerencial do negócio</p>}
            employeeStats={<p className="text-gray-600">Suas tarefas e responsabilidades</p>}
          />
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Hoje</p>
          <p className="text-lg font-semibold">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Controle de Caixa */}
      <div className="bg-white rounded-xl shadow-sm">
        <CashRegister />
      </div>
      
      {/* Cards do Dashboard */}
      <RoleBasedStats
        adminStats={
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Controle Total</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">Admin</div>
                  <p className="text-xs text-muted-foreground">
                    Acesso completo ao sistema
                  </p>
                </CardContent>
              </Card>
              <div className="lg:col-span-3">
                <DashboardCards />
              </div>
            </div>
          </div>
        }
        managerStats={
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gestão</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">Manager</div>
                  <p className="text-xs text-muted-foreground">
                    Relatórios e análises
                  </p>
                </CardContent>
              </Card>
              <div className="lg:col-span-3">
                <DashboardCards />
              </div>
            </div>
          </div>
        }
        employeeStats={
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Operacional</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Employee</div>
                  <p className="text-xs text-muted-foreground">
                    Tarefas do dia a dia
                  </p>
                </CardContent>
              </Card>
              <div className="lg:col-span-3">
                <DashboardCards />
              </div>
            </div>
          </div>
        }
      />
      
      {/* Seção Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transações Recentes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <RecentTransactions />
        </div>
        
        {/* Tarefas Diárias */}
        <div className="bg-white rounded-xl shadow-sm">
          <DailyTasks />
        </div>
      </div>
      
      {/* Ações Rápidas */}
      <RoleBasedActions
        adminActions={
          <div className="space-y-6">
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <QuickActions />
              </CardContent>
            </Card>
            
            <PermissionGate requiredRole="admin">
              <Card className="bg-white rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-red-600">Ações Administrativas</CardTitle>
                  <CardDescription>Funcionalidades exclusivas para administradores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Gerenciar Usuários
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Configurações Avançadas
                    </button>
                  </div>
                </CardContent>
              </Card>
            </PermissionGate>
          </div>
        }
        managerActions={
          <div className="space-y-6">
            <Card className="bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <QuickActions />
              </CardContent>
            </Card>
            
            <FeatureByRole allowedRoles={['admin', 'manager']}>
              <Card className="bg-white rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-blue-600">Gestão</CardTitle>
                  <CardDescription>Ferramentas de análise e controle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Relatórios
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Auditoria
                    </button>
                  </div>
                </CardContent>
              </Card>
            </FeatureByRole>
          </div>
        }
        employeeActions={
          <Card className="bg-white rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>
        }
      />

      {/* Logs de Auditoria */}
      <PermissionGate requiredPermissions={['audit.view']} requiredRole="manager">
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={20} />
              <span>Logs de Auditoria Recentes</span>
            </CardTitle>
            <CardDescription>
              Últimas ações registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <AuditLogs />
            </div>
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  );
};
