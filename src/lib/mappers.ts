// ============================================================================
// MAPPERS/ADAPTADORES - Conecta sistema atual (PT) com banco (EN)
// ============================================================================

import type {
  Client,
  ServiceOrder,
  Payment,
  BankAccount,
  ServiceOrderStatus,
  PaymentStatus,
  PaymentType,
  CreateClient,
  CreateServiceOrder,
  CreatePayment,
} from '../types/database';

// Tipos do sistema atual (português) - mantidos para compatibilidade
export interface Cliente {
  id: number;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  cep?: string;
  observacoes?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface OrdemServico {
  id: number;
  numero: string;
  cliente_id: number;
  artigo: string;
  descricao: string;
  servico_id?: number;
  tecnico_id?: number;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'entregue' | 'cancelado';
  valor_total: number;
  valor_entrada: number;
  valor_restante: number;
  data_entrada: string;
  data_entrega_prevista?: string;
  data_entrega_real?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface MovimentacaoFinanceira {
  id: number;
  tipo: 'entrada' | 'saida' | 'transferencia';
  categoria: string;
  descricao: string;
  valor: number;
  forma_pagamento: string;
  conta_bancaria_id?: number;
  ordem_servico_id?: number;
  venda_id?: number;
  data_vencimento?: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'parcialmente_pago' | 'cancelado';
  created_at: string;
  updated_at: string;
}

export interface ContaBancaria {
  id: number;
  nome: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  saldo_atual: number;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CLASSE MAPPER PRINCIPAL
// ============================================================================

export class DatabaseMapper {
  // ============================================================================
  // MAPPERS: PORTUGUÊS → INGLÊS (Para enviar ao banco)
  // ============================================================================

  // Cliente PT → Client EN
  static clienteToClient(cliente: Partial<Cliente>): CreateClient {
    return {
      name: cliente.nome || '',
      phone: cliente.telefone,
      email: cliente.email,
      address: cliente.endereco,
    };
  }

  // OrdemServico PT → ServiceOrder EN
  static ordemServicoToServiceOrder(os: Partial<OrdemServico>): CreateServiceOrder {
    return {
      client_id: os.cliente_id || 0,
      technician_id: os.tecnico_id,
      status: this.mapStatusOSToEN(os.status || 'pendente'),
      description: `${os.artigo || ''} - ${os.descricao || ''}`.trim(),
      total_price: os.valor_total || 0,
      payment_status: this.mapPaymentStatusToEN(os.valor_restante === 0 ? 'pago' : 'pendente'),
      created_by_user_id: 1, // TODO: Pegar do contexto de usuário
    };
  }

  // MovimentacaoFinanceira PT → Payment EN
  static movimentacaoToPayment(mov: Partial<MovimentacaoFinanceira>): CreatePayment {
    return {
      amount: mov.valor || 0,
      payment_date: mov.data_pagamento || new Date().toISOString(),
      payment_type: this.mapTipoMovimentacaoToEN(mov.tipo || 'entrada'),
      description: mov.descricao,
      source_bank_account_id: mov.tipo === 'saida' ? mov.conta_bancaria_id : undefined,
      destination_bank_account_id: mov.tipo === 'entrada' ? mov.conta_bancaria_id : undefined,
      service_order_id: mov.ordem_servico_id,
      sale_id: mov.venda_id,
      recorded_by_user_id: 1, // TODO: Pegar do contexto de usuário
    };
  }

  // ============================================================================
  // MAPPERS: INGLÊS → PORTUGUÊS (Para receber do banco)
  // ============================================================================

  // Client EN → Cliente PT
  static clientToCliente(client: Client): Cliente {
    return {
      id: client.id,
      nome: client.name,
      cpf: '', // Não existe no banco EN, manter vazio
      telefone: client.phone,
      email: client.email,
      endereco: client.address,
      cidade: '', // Não existe no banco EN
      cep: '', // Não existe no banco EN
      observacoes: '', // Não existe no banco EN
      status: 'ativo', // Sempre ativo por padrão
      created_at: client.created_at,
      updated_at: client.updated_at,
    };
  }

  // ServiceOrder EN → OrdemServico PT
  static serviceOrderToOrdemServico(so: ServiceOrder): OrdemServico {
    return {
      id: so.id,
      numero: so.id.toString().padStart(6, '0'), // Gerar número baseado no ID
      cliente_id: so.client_id,
      artigo: this.extractArtigoFromDescription(so.description || ''),
      descricao: this.extractDescricaoFromDescription(so.description || ''),
      servico_id: undefined, // Será preenchido se necessário
      tecnico_id: so.technician_id,
      status: this.mapStatusOSToPT(so.status),
      valor_total: so.total_price,
      valor_entrada: 0, // Calcular baseado nos pagamentos
      valor_restante: so.total_price, // Calcular baseado nos pagamentos
      data_entrada: so.created_at,
      data_entrega_prevista: undefined,
      data_entrega_real: undefined,
      observacoes: '',
      created_at: so.created_at,
      updated_at: so.updated_at,
    };
  }

  // Payment EN → MovimentacaoFinanceira PT
  static paymentToMovimentacao(payment: Payment): MovimentacaoFinanceira {
    return {
      id: payment.id,
      tipo: this.mapPaymentTypeToPT(payment.payment_type),
      categoria: this.mapPaymentTypeToCategoria(payment.payment_type),
      descricao: payment.description || '',
      valor: payment.amount,
      forma_pagamento: 'Dinheiro', // Default, será atualizado se tiver payment_method
      conta_bancaria_id: payment.destination_bank_account_id || payment.source_bank_account_id,
      ordem_servico_id: payment.service_order_id,
      venda_id: payment.sale_id,
      data_vencimento: payment.payment_date,
      data_pagamento: payment.payment_date,
      status: 'pago', // Se existe payment, está pago
      created_at: payment.created_at,
      updated_at: payment.created_at,
    };
  }

  // BankAccount EN → ContaBancaria PT
  static bankAccountToContaBancaria(bank: BankAccount): ContaBancaria {
    return {
      id: bank.id,
      nome: bank.name,
      banco: bank.bank_name,
      agencia: '',
      conta: bank.account_number,
      saldo_atual: bank.current_balance,
      ativa: true,
      created_at: bank.created_at,
      updated_at: bank.updated_at,
    };
  }

  // ============================================================================
  // UTILITÁRIOS DE MAPEAMENTO
  // ============================================================================

  // Status OS: PT → EN
  static mapStatusOSToEN(status: string): ServiceOrderStatus {
    const statusMap: Record<string, ServiceOrderStatus> = {
      'pendente': 'pending',
      'em_andamento': 'in_progress',
      'concluido': 'completed',
      'entregue': 'delivered',
      'cancelado': 'cancelled',
    };
    return statusMap[status] || 'pending';
  }

  // Status OS: EN → PT
  static mapStatusOSToPT(status: ServiceOrderStatus): 'pendente' | 'em_andamento' | 'concluido' | 'entregue' | 'cancelado' {
    const statusMap: Record<ServiceOrderStatus, 'pendente' | 'em_andamento' | 'concluido' | 'entregue' | 'cancelado'> = {
      'pending': 'pendente',
      'in_progress': 'em_andamento',
      'completed': 'concluido',
      'delivered': 'entregue',
      'cancelled': 'cancelado',
    };
    return statusMap[status] || 'pendente';
  }

  // Payment Status: PT → EN
  static mapPaymentStatusToEN(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'pendente': 'pending',
      'pago': 'paid',
      'parcialmente_pago': 'partially_paid',
      'cancelado': 'cancelled',
    };
    return statusMap[status] || 'pending';
  }

  // Tipo Movimentação: PT → EN
  static mapTipoMovimentacaoToEN(tipo: string): PaymentType {
    const tipoMap: Record<string, PaymentType> = {
      'entrada': 'revenue',
      'saida': 'expense',
      'transferencia': 'transfer',
    };
    return tipoMap[tipo] || 'revenue';
  }

  // Payment Type: EN → PT
  static mapPaymentTypeToPT(type: PaymentType): 'entrada' | 'saida' | 'transferencia' {
    const typeMap: Record<PaymentType, 'entrada' | 'saida' | 'transferencia'> = {
      'revenue': 'entrada',
      'expense': 'saida',
      'transfer': 'transferencia',
    };
    return typeMap[type] || 'entrada';
  }

  // Payment Type → Categoria PT
  static mapPaymentTypeToCategoria(type: PaymentType): string {
    const categoriaMap: Record<PaymentType, string> = {
      'revenue': 'Receita',
      'expense': 'Despesa',
      'transfer': 'Transferência',
    };
    return categoriaMap[type] || 'Receita';
  }

  // Extrair artigo da descrição
  static extractArtigoFromDescription(description: string): string {
    const parts = description.split(' - ');
    return parts[0] || '';
  }

  // Extrair descrição
  static extractDescricaoFromDescription(description: string): string {
    const parts = description.split(' - ');
    return parts.slice(1).join(' - ') || '';
  }

  // ============================================================================
  // MAPPERS DE ARRAYS
  // ============================================================================

  static clientsToClientes(clients: Client[]): Cliente[] {
    return clients.map(client => this.clientToCliente(client));
  }

  static serviceOrdersToOrdensServico(orders: ServiceOrder[]): OrdemServico[] {
    return orders.map(order => this.serviceOrderToOrdemServico(order));
  }

  static paymentsToMovimentacoes(payments: Payment[]): MovimentacaoFinanceira[] {
    return payments.map(payment => this.paymentToMovimentacao(payment));
  }

  static bankAccountsToContasBancarias(accounts: BankAccount[]): ContaBancaria[] {
    return accounts.map(account => this.bankAccountToContaBancaria(account));
  }
}

export default DatabaseMapper; 