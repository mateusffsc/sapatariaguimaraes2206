
import React, { useState } from 'react';
import { DashboardCards } from './DashboardCards';
import { CashRegister } from './CashRegister';
import { DailyTasks } from './DailyTasks';
import { QuickActions } from './QuickActions';
import { RecentTransactions } from './RecentTransactions';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu negócio</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Hoje</p>
          <p className="text-lg font-semibold">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <CashRegister />
      
      <DashboardCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <div>
          <DailyTasks />
        </div>
      </div>
      
      <QuickActions />
    </div>
  );
};
