export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'cancelled';
export type CreditSaleStatus = 'open' | 'paid' | 'overdue';
export type PaymentType = 'revenue' | 'expense' | 'transfer';

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: number;
  name: string;
  bank_name?: string;
  account_number?: string;
  initial_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrder {
  id: number;
  client_id: number;
  description: string;
  status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface AccountsPayable {
  id: number;
  description: string;
  supplier_id?: number;
  total_amount_due: number;
  amount_paid: number;
  balance_due: number;
  due_date: string;
  status: string;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  client_id?: number;
  total_price: number;
  payment_status: PaymentStatus;
  is_credit_sale: boolean;
  payment_method: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
  clients?: {
    id: number;
    name: string;
    phone: string;
  };
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  products?: {
    id: number;
    name: string;
    description?: string;
    price: number;
  };
}

export interface CreditSale {
  id: number;
  sale_id: number;
  client_id: number;
  total_amount_due: number;
  amount_paid: number;
  balance_due: number;
  due_date: string;
  status: CreditSaleStatus;
  created_at: string;
  updated_at: string;
}

export type CreateSaleData = Omit<Sale, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSaleData = Partial<CreateSaleData>;

export interface PaymentMethod {
  id: number;
  name: string;
  fee_percentage: number;
  fee_fixed: number;
  liquidation_days: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_type: PaymentType;
  payment_method_id?: number;
  source_bank_account_id?: number;
  destination_bank_account_id?: number;
  sale_id?: number;
  service_order_id?: number;
  credit_sale_id?: number;
  accounts_payable_id?: number;
  stock_movement_id?: number;
  description?: string;
  recorded_by_user_id: number;
  created_at: string;
}

export interface SaleWithRelations extends Sale {
  client?: Client;
  items?: SaleItem[];
  credit_sale?: CreditSale;
  payments?: Payment[];
}

export interface PaymentWithRelations extends Payment {
  payment_method?: PaymentMethod;
  source_bank_account?: BankAccount;
  destination_bank_account?: BankAccount;
  sale?: Sale;
  service_order?: ServiceOrder;
  credit_sale?: CreditSale;
  accounts_payable?: AccountsPayable;
}

export interface CreditSaleWithRelations extends CreditSale {
  client?: Client;
  sale?: Sale;
  payments?: Payment[];
}

export type CreatePaymentMethod = Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePaymentMethod = Partial<CreatePaymentMethod>;
