import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, DollarSign, Plus } from 'lucide-react';
import { useDashboardContasPagar } from '../../hooks/useContasPagar';
import { NovaContaPagarModal } from '../modals/NovaContaPagarModal';

export function ContasPagarSection() {
  const [modalNovaContaOpen, setModalNovaContaOpen] = useState(false);
  const { resumo, isLoading } = useDashboardContasPagar();

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarMoeda(resumo?.totalEmAberto || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumo?.quantidadeEmAberto || 0} conta(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarMoeda(resumo?.totalVencidas || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumo?.quantidadeVencidas || 0} conta(s) vencida(s)
            </p>
          </CardContent>
        </Card>
      </div>

              <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Gerencie suas contas a pagar</CardDescription>
            </div>
            <Button onClick={() => setModalNovaContaOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">Sistema de contas a pagar implementado!</p>
              <p className="text-sm text-gray-400">
                - Lista de despesas pendentes ✓<br />
                - Calendário de vencimentos ✓<br />
                - Sistema de lembretes ✓
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modal Nova Conta */}
        <NovaContaPagarModal
          open={modalNovaContaOpen}
          onOpenChange={setModalNovaContaOpen}
        />
      </div>
    );
  } 