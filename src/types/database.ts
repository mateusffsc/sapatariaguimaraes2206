// ============================================================================
// ENUMS - Tipos definidos no banco de dados
// ============================================================================

export type ServiceOrderStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'cancelled';

export type ItemType = 'service' | 'product';

export type StockMovementType = 'purchase' | 'sale' | 'adjustment' | 'usage_in_os';

export type CreditSaleStatus = 'open' | 'paid' | 'overdue';

export type AccountsPayableStatus = 'open' | 'paid' | 'overdue';

export type PaymentType = 'revenue' | 'expense' | 'transfer';

export type CostComponentType = 'material' | 'labor' | 'other';

export type PurchaseOrderStatus = 'draft' | 'sent' | 'approved' | 'received' | 'cancelled';

export type QualityControlStatus = 'pending' | 'approved' | 'rejected' | 'partial';

// ============================================================================
// INTERFACES - Tabelas do banco de dados (nomes em inglês)
// ============================================================================

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role_id: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
}

export interface Client {
  id: number;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  cep?: string;
  address?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: number;
  user_id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_info?: string;
  specialties: string[];
  hire_date?: string;
  active: boolean;
  hourly_rate?: number;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  estimated_time_minutes?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_info?: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrder {
  id: number;
  client_id: number;
  technician_id?: number;
  status: ServiceOrderStatus;
  description?: string;
  total_price: number;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
  updated_by_user_id?: number;
}

export interface ServiceOrderItem {
  id: number;
  service_order_id: number;
  service_id?: number;
  product_id?: number;
  item_type: ItemType;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderHistory {
  id: number;
  service_order_id: number;
  timestamp: string;
  status_change?: string;
  note?: string;
  changed_by_user_id: number;
}

export interface ServiceOrderImage {
  id: number;
  service_order_id: number;
  image_url: string;
  description?: string;
  uploaded_by_user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  client_id?: number;
  total_price: number;
  payment_status: PaymentStatus;
  is_credit_sale: boolean;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
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
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: StockMovementType;
  quantity_change: number;
  timestamp: string;
  sale_item_id?: number;
  service_order_item_id?: number;
  accounts_payable_id?: number;
  description?: string;
  created_by_user_id: number;
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

export interface PaymentMethod {
  id: number;
  name: string;
  fee_percentage: number;
  fee_fixed: number;
  liquidation_days: number;
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
  status: AccountsPayableStatus;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
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

export interface CostComponent {
  id: number;
  service_id?: number;
  product_id?: number;
  component_type: CostComponentType;
  description: string;
  cost_amount: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery_date?: string;
  total_amount: number;
  notes?: string;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  quantity_ordered: number;
  unit_price: number;
  subtotal: number;
  quantity_received: number;
  quantity_approved: number;
  created_at: string;
  updated_at: string;
}

export interface QualityControl {
  id: number;
  purchase_order_item_id: number;
  inspector_user_id: number;
  inspection_date: string;
  status: QualityControlStatus;
  notes?: string;
  defects_found?: string;
  approved_quantity: number;
  rejected_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  id: number;
  company_name: string;
  trade_name?: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  logo_url?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  category?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: number;
  name: string;
  type: 'os_print' | 'whatsapp' | 'email' | 'report';
  category: string;
  template_content: string;
  variables: string[];
  is_active: boolean;
  is_default: boolean;
  description?: string;
  paper_size?: 'a4' | 'thermal_80mm' | 'thermal_58mm';
  orientation?: 'portrait' | 'landscape';
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  key: string;
  description: string;
  example: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
}

// ============================================================================
// INTERFACES EXPANDIDAS - Com relacionamentos populados
// ============================================================================

export interface ServiceOrderWithRelations extends ServiceOrder {
  client?: Client;
  technician?: Technician;
  items?: ServiceOrderItem[];
  history?: ServiceOrderHistory[];
  images?: ServiceOrderImage[];
  payments?: Payment[];
}

export interface ServiceOrderItemWithRelations extends ServiceOrderItem {
  service?: Service;
  product?: Product;
}

export interface SaleWithRelations extends Sale {
  client?: Client;
  items?: SaleItem[];
  credit_sale?: CreditSale;
  payments?: Payment[];
}

export interface SaleItemWithRelations extends SaleItem {
  product?: Product;
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

export interface AccountsPayableWithRelations extends AccountsPayable {
  supplier?: Supplier;
  payments?: Payment[];
}

export interface SupplierWithRelations extends Supplier {
  accounts_payable?: AccountsPayable[];
  payments?: Payment[];
}

export interface StockMovementWithRelations extends StockMovement {
  product?: Product;
  sale_item?: SaleItem;
  service_order_item?: ServiceOrderItem;
  accounts_payable?: AccountsPayable;
}

export interface PurchaseOrderWithRelations extends PurchaseOrder {
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  quality_controls?: QualityControl[];
}

export interface PurchaseOrderItemWithRelations extends PurchaseOrderItem {
  product?: Product;
  purchase_order?: PurchaseOrder;
  quality_controls?: QualityControl[];
}

export interface QualityControlWithRelations extends QualityControl {
  purchase_order_item?: PurchaseOrderItem;
  inspector?: User;
}

// ============================================================================
// TIPOS DE INPUT - Para criação e atualização
// ============================================================================

export type CreateClient = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClient = Partial<CreateClient>;

export type CreateServiceOrder = Omit<ServiceOrder, 'id' | 'created_at' | 'updated_at'>;
export type UpdateServiceOrder = Partial<Omit<CreateServiceOrder, 'created_by_user_id'>>;

export type CreateServiceOrderItem = Omit<ServiceOrderItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdateServiceOrderItem = Partial<CreateServiceOrderItem>;

export type CreateSale = Omit<Sale, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSale = Partial<Omit<CreateSale, 'created_by_user_id'>>;

export type CreateSaleItem = {
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type CreatePayment = Omit<Payment, 'id' | 'created_at'>;
export type UpdatePayment = Partial<Omit<CreatePayment, 'recorded_by_user_id'>>;

export type CreateProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProduct = Partial<CreateProduct>;

export type CreateService = Omit<Service, 'id' | 'created_at' | 'updated_at'>;
export type UpdateService = Partial<CreateService>;

export type CreateTechnician = Omit<Technician, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTechnician = Partial<CreateTechnician>;

export type CreateSupplier = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSupplier = Partial<CreateSupplier>;

export type CreateBankAccount = Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBankAccount = Partial<CreateBankAccount>;

export type CreatePaymentMethod = Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePaymentMethod = Partial<CreatePaymentMethod>;

export type CreateAccountsPayable = Omit<AccountsPayable, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAccountsPayable = Partial<Omit<CreateAccountsPayable, 'created_by_user_id'>>;

export type CreateCreditSale = {
  sale_id: number;
  client_id: number;
  total_amount_due: number;
  amount_paid: number;
  balance_due: number;
  due_date: string;
  status: CreditSaleStatus;
};

export type UpdateCreditSale = Partial<CreateCreditSale>;

export type CreateStockMovement = Omit<StockMovement, 'id' | 'timestamp'>;

export type CreateCostComponent = Omit<CostComponent, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCostComponent = Partial<CreateCostComponent>;

export type CreatePurchaseOrder = Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePurchaseOrder = Partial<Omit<CreatePurchaseOrder, 'created_by_user_id'>>;

export type CreatePurchaseOrderItem = Omit<PurchaseOrderItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePurchaseOrderItem = Partial<CreatePurchaseOrderItem>;

export type CreateQualityControl = Omit<QualityControl, 'id' | 'created_at' | 'updated_at'>;
export type UpdateQualityControl = Partial<CreateQualityControl>;

export type CreateCompanySettings = Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCompanySettings = Partial<CreateCompanySettings>;

export type CreateSystemSettings = Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSystemSettings = Partial<CreateSystemSettings>;

export type CreateDocumentTemplate = Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'>;
export type UpdateDocumentTemplate = Partial<CreateDocumentTemplate>;

export type CreateTemplateVariable = Omit<TemplateVariable, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTemplateVariable = Partial<CreateTemplateVariable>;

// ============================================================================
// ALIASES PARA COMPATIBILIDADE
// ============================================================================

export type CreateSaleData = CreateSale;
export type UpdateSaleData = UpdateSale; 