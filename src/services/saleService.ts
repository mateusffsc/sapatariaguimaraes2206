import { supabase } from '@/lib/supabase';
import { Sale, SaleItem, CreditSale, CreateSaleData, UpdateSaleData } from '@/types/database';

export class SaleService {
  // ==================== VENDAS ====================
  static async createSale(saleData: CreateSaleData): Promise<Sale> {
    try {
      // Garantir que temos um método de pagamento padrão
      const dataWithPaymentMethod = {
        ...saleData,
        payment_method: saleData.payment_method || 'dinheiro'
      };

      const { data, error } = await supabase
        .from('sales')
        .insert([dataWithPaymentMethod])
        .select(`
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_price,
            products (
              id,
              name,
              description
            )
          ),
          clients (
            id,
            name,
            phone
          )
        `)
        .single();

      if (error) {
        console.error('Erro Supabase ao criar venda:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        throw new Error('Nenhum dado retornado após criar a venda');
      }

      // Se for venda à vista, criar entrada no financeiro
      if (!saleData.is_credit_sale) {
        await this.createFinancialEntry(data);
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      if (error instanceof Error) {
        throw new Error(`Falha ao criar venda: ${error.message}`);
      } else if (typeof error === 'object' && error !== null) {
        throw new Error(`Falha ao criar venda: ${JSON.stringify(error)}`);
      } else {
        throw new Error('Falha ao criar venda: Erro desconhecido');
      }
    }
  }

  // Método para criar venda completa com itens
  static async createSaleWithItems(vendaData: CreateSaleData, items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
  }>): Promise<Sale> {
    try {
      // Criar a venda primeiro
      const venda = await this.createSale(vendaData);

      // Adicionar os itens à venda
      for (const item of items) {
        await this.addSaleItem(venda.id.toString(), {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.quantity * item.unit_price
        });
      }

      // Se for venda a crédito, criar registro no crediário
      if (vendaData.is_credit_sale && vendaData.client_id) {
        await this.createCreditSale({
          sale_id: venda.id,
          client_id: vendaData.client_id,
          total_amount_due: vendaData.total_price,
          amount_paid: 0,
          balance_due: vendaData.total_price,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias por padrão
          status: 'open'
        });
      }

      // Retornar venda completa com itens
      return await this.getSaleById(venda.id.toString()) || venda;
    } catch (error) {
      console.error('Erro ao criar venda com itens:', error);
      throw new Error(`Falha ao criar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getAllSales(): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_price,
            products (
              id,
              name,
              price
            )
          ),
          clients (
            id,
            name,
            phone,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      throw new Error(`Falha ao buscar vendas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getSaleById(id: string): Promise<Sale | null> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_price,
            products (
              id,
              name,
              description,
              price
            )
          ),
          clients (
            id,
            name,
            phone,
            email,
            address
          ),
          credit_sales (
            id,
            total_amount_due,
            amount_paid,
            balance_due,
            due_date,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar venda:', error);
      throw new Error(`Falha ao buscar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updateSale(id: string, updates: UpdateSaleData): Promise<Sale> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_price,
            products (
              id,
              name,
              price
            )
          ),
          clients (
            id,
            name,
            phone
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      throw new Error(`Falha ao atualizar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async deleteSale(id: string): Promise<void> {
    try {
      // Primeiro, deletar itens da venda
      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      // Deletar crediário se existir
      await supabase
        .from('credit_sales')
        .delete()
        .eq('sale_id', id);

      // Deletar a venda
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar venda:', error);
      throw new Error(`Falha ao deletar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ITENS DE VENDA ====================
  static async addSaleItem(saleId: string, item: Omit<SaleItem, 'id' | 'sale_id'>): Promise<SaleItem> {
    try {
      // Baixar estoque do produto
      await this.updateProductStock(item.product_id, -item.quantity);

      const { data, error } = await supabase
        .from('sale_items')
        .insert([{ ...item, sale_id: parseInt(saleId) }])
        .select(`
          *,
          products (
            id,
            name,
            price
          )
        `)
        .single();

      if (error) throw error;

      // Atualizar total da venda
      await this.updateSaleTotal(saleId);

      return data;
    } catch (error) {
      console.error('Erro ao adicionar item à venda:', error);
      throw new Error(`Falha ao adicionar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updateSaleItem(id: string, updates: Partial<SaleItem>): Promise<SaleItem> {
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          products (
            id,
            name,
            price
          )
        `)
        .single();

      if (error) throw error;

      // Atualizar total da venda
      if (data.sale_id) {
        await this.updateSaleTotal(data.sale_id);
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar item da venda:', error);
      throw new Error(`Falha ao atualizar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async removeSaleItem(id: string): Promise<void> {
    try {
      // Buscar o sale_id antes de deletar
      const { data: item } = await supabase
        .from('sale_items')
        .select('sale_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('sale_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar total da venda
      if (item?.sale_id) {
        await this.updateSaleTotal(item.sale_id);
      }
    } catch (error) {
      console.error('Erro ao remover item da venda:', error);
      throw new Error(`Falha ao remover item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== CREDIÁRIO ====================
  static async createCreditSale(creditData: Omit<CreditSale, 'id'>): Promise<CreditSale> {
    try {
      const { data, error } = await supabase
        .from('credit_sales')
        .insert([creditData])
        .select(`
          *,
          sales (
            id,
            total_price
          ),
          clients (
            id,
            name,
            phone
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar crediário:', error);
      throw new Error(`Falha ao criar crediário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getCreditSales(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('credit_sales')
        .select(`
          *,
          sales (
            id,
            total_price,
            created_at
          ),
          clients!credit_sales_client_id_fkey (
            id,
            name,
            phone,
            email
          )
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        client: item.clients
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar crediário:', error);
      throw new Error(`Falha ao buscar crediário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async getOverdueCreditSales(): Promise<any[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('credit_sales')
        .select(`
          *,
          sales (
            id,
            total_price,
            created_at
          ),
          clients!credit_sales_client_id_fkey (
            id,
            name,
            phone,
            email
          )
        `)
        .eq('status', 'open')
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        client: item.clients
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar crediário vencido:', error);
      throw new Error(`Falha ao buscar crediário vencido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async makePayment(creditSaleId: string, paymentAmount: number): Promise<CreditSale> {
    try {
      // Buscar dados atuais do crediário
      const { data: creditSale } = await supabase
        .from('credit_sales')
        .select('*')
        .eq('id', creditSaleId)
        .single();

      if (!creditSale) {
        throw new Error('Crediário não encontrado');
      }

      const newAmountPaid = creditSale.amount_paid + paymentAmount;
      const newBalanceDue = creditSale.total_amount_due - newAmountPaid;
      const newStatus = newBalanceDue <= 0 ? 'paid' : 'open';

      const { data, error } = await supabase
        .from('credit_sales')
        .update({
          amount_paid: newAmountPaid,
          balance_due: Math.max(0, newBalanceDue),
          status: newStatus
        })
        .eq('id', creditSaleId)
        .select(`
          *,
          sales (
            id,
            total_price
          ),
          clients (
            id,
            name,
            phone
          )
        `)
        .single();

      if (error) throw error;

      // Criar entrada financeira para o pagamento
      await this.createPaymentEntry(data, paymentAmount);

      return data;
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      throw new Error(`Falha ao registrar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== ESTATÍSTICAS ====================
  static async getSalesStats(): Promise<{
    totalSales: number;
    totalRevenue: number;
    creditSales: number;
    pendingCredit: number;
  }> {
    try {
      const [salesCount, salesRevenue, creditCount, pendingAmount] = await Promise.all([
        // Total de vendas
        supabase
          .from('sales')
          .select('id', { count: 'exact', head: true }),
        
        // Receita total
        supabase
          .from('sales')
          .select('total_price'),
        
        // Vendas no crediário
        supabase
          .from('credit_sales')
          .select('id', { count: 'exact', head: true }),
        
        // Valor pendente no crediário
        supabase
          .from('credit_sales')
          .select('balance_due')
          .eq('status', 'open')
      ]);

      const totalRevenue = salesRevenue.data?.reduce((sum, sale) => sum + (sale.total_price || 0), 0) || 0;
      const pendingCredit = pendingAmount.data?.reduce((sum, credit) => sum + (credit.balance_due || 0), 0) || 0;

      return {
        totalSales: salesCount.count || 0,
        totalRevenue,
        creditSales: creditCount.count || 0,
        pendingCredit
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de vendas:', error);
      throw new Error(`Falha ao buscar estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================
  private static async updateSaleTotal(saleId: string): Promise<void> {
    try {
      // Buscar todos os itens da venda
      const { data: items } = await supabase
        .from('sale_items')
        .select('quantity, unit_price')
        .eq('sale_id', saleId);

      if (!items) return;

      const totalPrice = items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);

      // Atualizar o total da venda
      await supabase
        .from('sales')
        .update({ total_price: totalPrice })
        .eq('id', saleId);
    } catch (error) {
      console.error('Erro ao atualizar total da venda:', error);
    }
  }

  private static async createFinancialEntry(sale: Sale): Promise<void> {
    try {
      await supabase
        .from('payments')
        .insert([{
          amount: sale.total_price,
          payment_date: new Date().toISOString(),
          payment_type: 'revenue',
          description: `Venda #${sale.id} - Cliente: ${sale.clients?.name || 'N/A'}`
        }]);
    } catch (error) {
      console.error('Erro ao criar entrada financeira:', error);
    }
  }

  private static async createPaymentEntry(creditSale: CreditSale, paymentAmount: number): Promise<void> {
    try {
      await supabase
        .from('payments')
        .insert([{
          amount: paymentAmount,
          payment_date: new Date().toISOString(),
          payment_type: 'revenue',
          credit_sale_id: creditSale.id,
          recorded_by_user_id: 1 // TODO: Pegar do contexto de usuário
        }]);
    } catch (error) {
      console.error('Erro ao criar entrada de pagamento:', error);
      throw error;
    }
  }

  // Método para atualizar estoque do produto
  private static async updateProductStock(productId: number, quantityChange: number): Promise<void> {
    try {
      // Buscar produto atual
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const newStock = product.stock_quantity + quantityChange;
      
      if (newStock < 0) {
        throw new Error('Estoque insuficiente para completar a operação');
      }

      // Atualizar estoque
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Registrar movimentação de estoque
      await supabase
        .from('stock_movements')
        .insert([{
          product_id: productId,
          movement_type: 'sale',
          quantity_change: quantityChange,
          created_by_user_id: 1
        }]);

    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      throw error;
    }
  }

  // Método para criar venda com data de vencimento customizada
  static async createSaleWithItemsAndDueDate(
    vendaData: CreateSaleData, 
    items: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
    }>,
    dueDate?: string
  ): Promise<Sale> {
    try {
      // Criar a venda primeiro
      const venda = await this.createSale(vendaData);

      // Adicionar os itens à venda
      for (const item of items) {
        await this.addSaleItem(venda.id.toString(), {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.quantity * item.unit_price
        });
      }

      // Se for venda a crédito, criar registro no crediário
      if (vendaData.is_credit_sale && vendaData.client_id) {
        const finalDueDate = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        await this.createCreditSale({
          sale_id: venda.id,
          client_id: vendaData.client_id,
          total_amount_due: vendaData.total_price,
          amount_paid: 0,
          balance_due: vendaData.total_price,
          due_date: finalDueDate,
          status: 'open'
        });
      }

      // Retornar venda completa com itens
      return await this.getSaleById(venda.id.toString()) || venda;
    } catch (error) {
      console.error('Erro ao criar venda com itens e data:', error);
      throw new Error(`Falha ao criar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
} 