
import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const tasks = [
  {
    id: 1,
    title: 'OS #1234 - João Silva',
    description: 'Conserto de sapato social',
    dueDate: 'Hoje, 14:00',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 2,
    title: 'OS #1235 - Maria Santos',
    description: 'Limpeza de tênis',
    dueDate: 'Hoje, 16:30',
    status: 'in-progress',
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Cobrança - Pedro Costa',
    description: 'Crediário vencido',
    dueDate: 'Ontem',
    status: 'overdue',
    priority: 'high'
  },
  {
    id: 4,
    title: 'OS #1232 - Ana Lima',
    description: 'Troca de salto',
    dueDate: 'Concluído',
    status: 'completed',
    priority: 'low'
  }
];

export const DailyTasks: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tarefas do Dia</h3>
        <Clock size={20} className="text-gray-400" />
      </div>
      
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 mt-1">
              {task.status === 'completed' ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : task.status === 'overdue' ? (
                <AlertCircle size={16} className="text-red-500" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}>
                {task.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
              <p className={`text-xs mt-1 ${
                task.status === 'overdue' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {task.dueDate}
              </p>
            </div>
            <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
              task.priority === 'high' ? 'bg-red-400' :
              task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
            }`}></div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
        Ver todas as tarefas
      </button>
    </div>
  );
};
