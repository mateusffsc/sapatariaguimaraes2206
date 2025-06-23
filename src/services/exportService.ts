import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { DailyCashReport, WeeklyServiceOrdersReport, MonthlyBalanceReport } from './reportService';

interface ExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
  includeCharts?: boolean;
  format?: 'pdf' | 'excel';
}

class ExportService {
  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  private formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: pt });
  }

  private formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  private getCompanyInfo() {
    return {
      name: 'Sapataria Guimarães',
      address: 'Rua das Palmeiras, 123 - Centro',
      phone: '(11) 99999-9999',
      email: 'contato@sapatariaguimaraes.com.br'
    };
  }

  // Exportar relatório diário de caixa para PDF
  async exportDailyCashToPDF(report: DailyCashReport, options: ExportOptions = {}): Promise<void> {
    const doc = new jsPDF();
    const company = this.getCompanyInfo();
    
    const filename = options.filename || `relatorio-diario-caixa-${report.date}.pdf`;
    const pageWidth = doc.internal.pageSize.width;
    
    // Header da empresa
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(company.address, pageWidth / 2, 28, { align: 'center' });
    doc.text(`${company.phone} | ${company.email}`, pageWidth / 2, 34, { align: 'center' });
    
    // Título do relatório
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DIÁRIO DE CAIXA', pageWidth / 2, 50, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${this.formatDate(report.date)}`, pageWidth / 2, 58, { align: 'center' });
    
    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(20, 65, pageWidth - 20, 65);
    
    let yPosition = 75;
    
    // Resumo Financeiro
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO FINANCEIRO', 20, yPosition);
    yPosition += 10;
    
    const financialData = [
      ['Saldo Inicial', this.formatCurrency(report.opening_balance)],
      ['Total de Receitas', this.formatCurrency(report.total_receipts)],
      ['- Ordens de Serviço', this.formatCurrency(report.service_orders_revenue)],
      ['- Vendas', this.formatCurrency(report.sales_revenue)],
      ['Total de Despesas', this.formatCurrency(report.total_expenses)],
      ['Saldo Final', this.formatCurrency(report.closing_balance)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Descrição', 'Valor']],
      body: financialData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 60, halign: 'right' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Formas de Pagamento
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FORMAS DE PAGAMENTO', 20, yPosition);
    yPosition += 10;
    
    const paymentData = report.summary.payment_methods_breakdown.map(payment => [
      payment.method === 'cash' ? 'Dinheiro' : 
      payment.method === 'card' ? 'Cartão' :
      payment.method === 'credit' ? 'Crediário' : payment.method,
      this.formatCurrency(payment.amount),
      this.formatPercentage(payment.percentage)
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Forma de Pagamento', 'Valor', 'Percentual']],
      body: paymentData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 40, halign: 'center' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Top Serviços
    if (report.summary.top_services.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP SERVIÇOS DO DIA', 20, yPosition);
      yPosition += 10;
      
      const servicesData = report.summary.top_services.map((service, index) => [
        (index + 1).toString(),
        service.name,
        service.count.toString(),
        this.formatCurrency(service.revenue)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Serviço', 'Qtd', 'Receita']],
        body: servicesData,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 80 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 40, halign: 'right' }
        }
      });
    }
    
    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Gerado em: ${this.formatDate(new Date())} - Página ${i} de ${pageCount}`, 
        pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    doc.save(filename);
  }

  // Exportar relatório semanal para PDF
  async exportWeeklyToPDF(report: WeeklyServiceOrdersReport, options: ExportOptions = {}): Promise<void> {
    const doc = new jsPDF();
    const company = this.getCompanyInfo();
    
    const filename = options.filename || `relatorio-semanal-os-${report.week_start}-${report.week_end}.pdf`;
    const pageWidth = doc.internal.pageSize.width;
    
    // Header da empresa
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(company.address, pageWidth / 2, 28, { align: 'center' });
    doc.text(`${company.phone} | ${company.email}`, pageWidth / 2, 34, { align: 'center' });
    
    // Título do relatório
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO SEMANAL DE ORDENS DE SERVIÇO', pageWidth / 2, 50, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${this.formatDate(report.week_start)} a ${this.formatDate(report.week_end)}`, 
      pageWidth / 2, 58, { align: 'center' });
    
    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(20, 65, pageWidth - 20, 65);
    
    let yPosition = 75;
    
    // Resumo Geral das Ordens
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO GERAL', 20, yPosition);
    yPosition += 10;
    
    const ordersData = [
      ['Total de Ordens', report.total_orders.toString()],
      ['Ordens Concluídas', report.completed_orders.toString()],
      ['Ordens Pendentes', report.pending_orders.toString()],
      ['Ordens Canceladas', report.cancelled_orders.toString()],
      ['Taxa de Conclusão', this.formatPercentage(report.completion_rate)],
      ['Tempo Médio de Conclusão', `${report.average_completion_time.toFixed(1)} dias`],
      ['Receita Total', this.formatCurrency(report.total_revenue)],
      ['Ticket Médio', this.formatCurrency(report.average_order_value)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: ordersData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 60, halign: 'right' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Performance dos Técnicos
    if (report.technician_performance.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PERFORMANCE DOS TÉCNICOS', 20, yPosition);
      yPosition += 10;
      
      const techData = report.technician_performance.map(tech => [
        tech.technician_name,
        tech.orders_completed.toString(),
        this.formatPercentage(tech.efficiency_score)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Técnico', 'Ordens Concluídas', 'Eficiência']],
        body: techData,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' }
        }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Breakdown por Serviço
    if (report.service_breakdown.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SERVIÇOS MAIS DEMANDADOS', 20, yPosition);
      yPosition += 10;
      
      const serviceData = report.service_breakdown.slice(0, 10).map((service, index) => [
        (index + 1).toString(),
        service.service_name,
        service.count.toString(),
        this.formatCurrency(service.revenue)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Serviço', 'Qtd', 'Receita']],
        body: serviceData,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 80 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 40, halign: 'right' }
        }
      });
    }
    
    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Gerado em: ${this.formatDate(new Date())} - Página ${i} de ${pageCount}`, 
        pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    doc.save(filename);
  }

  // Exportar balanço mensal para PDF
  async exportMonthlyToPDF(report: MonthlyBalanceReport, options: ExportOptions = {}): Promise<void> {
    const doc = new jsPDF();
    const company = this.getCompanyInfo();
    
    const filename = options.filename || `balanco-mensal-${report.month}-${report.year}.pdf`;
    const pageWidth = doc.internal.pageSize.width;
    
    // Header da empresa
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(company.address, pageWidth / 2, 28, { align: 'center' });
    doc.text(`${company.phone} | ${company.email}`, pageWidth / 2, 34, { align: 'center' });
    
    // Título do relatório
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BALANÇO MENSAL', pageWidth / 2, 50, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${report.month} de ${report.year}`, pageWidth / 2, 58, { align: 'center' });
    
    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(20, 65, pageWidth - 20, 65);
    
    let yPosition = 75;
    
    // Resumo Financeiro
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO FINANCEIRO', 20, yPosition);
    yPosition += 10;
    
    const financialData = [
      ['RECEITAS', ''],
      ['Ordens de Serviço', this.formatCurrency(report.revenue.service_orders)],
      ['Vendas', this.formatCurrency(report.revenue.sales)],
      ['Total de Receitas', this.formatCurrency(report.revenue.total)],
      ['', ''],
      ['DESPESAS', ''],
      ['Compras', this.formatCurrency(report.expenses.purchases)],
      ['Operacional', this.formatCurrency(report.expenses.operational)],
      ['Total de Despesas', this.formatCurrency(report.expenses.total)],
      ['', ''],
      ['RESULTADO', ''],
      ['Lucro Bruto', this.formatCurrency(report.profit.gross)],
      ['Lucro Líquido', this.formatCurrency(report.profit.net)],
      ['Margem de Lucro', this.formatPercentage(report.profit.margin_percentage)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Descrição', 'Valor']],
      body: financialData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 60, halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.cell.text[0] === 'RECEITAS' || data.cell.text[0] === 'DESPESAS' || data.cell.text[0] === 'RESULTADO') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 230, 230];
        }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Indicadores de Clientes
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INDICADORES DE CLIENTES', 20, yPosition);
    yPosition += 10;
    
    const customerData = [
      ['Total de Clientes', report.customers.total.toString()],
      ['Novos Clientes', report.customers.new.toString()],
      ['Clientes que Retornaram', report.customers.returning.toString()],
      ['Taxa de Retenção', this.formatPercentage(report.customers.retention_rate)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: customerData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 60, halign: 'right' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // KPIs Principais
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('KPIS PRINCIPAIS', 20, yPosition);
    yPosition += 10;
    
    const kpiData = [
      ['Ticket Médio', this.formatCurrency(report.kpis.average_ticket)],
      ['Ordens por Dia', report.kpis.orders_per_day.toFixed(1)],
      ['Satisfação do Cliente', this.formatPercentage(report.kpis.customer_satisfaction)],
      ['Valor do Estoque', this.formatCurrency(report.inventory.value)],
      ['Itens com Estoque Baixo', report.inventory.low_stock_items.toString()]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['KPI', 'Valor']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 60, halign: 'right' }
      }
    });
    
    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Gerado em: ${this.formatDate(new Date())} - Página ${i} de ${pageCount}`, 
        pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    doc.save(filename);
  }

  // Exportar relatório diário para Excel
  async exportDailyCashToExcel(report: DailyCashReport, options: ExportOptions = {}): Promise<void> {
    const filename = options.filename || `relatorio-diario-caixa-${report.date}.xlsx`;
    
    // Resumo Financeiro
    const financialData = [
      ['RELATÓRIO DIÁRIO DE CAIXA'],
      [`Data: ${this.formatDate(report.date)}`],
      [''],
      ['RESUMO FINANCEIRO'],
      ['Saldo Inicial', report.opening_balance],
      ['Total de Receitas', report.total_receipts],
      ['- Ordens de Serviço', report.service_orders_revenue],
      ['- Vendas', report.sales_revenue],
      ['Total de Despesas', report.total_expenses],
      ['Saldo Final', report.closing_balance],
      [''],
      ['FORMAS DE PAGAMENTO'],
      ['Forma', 'Valor', 'Percentual'],
      ...report.summary.payment_methods_breakdown.map(payment => [
        payment.method === 'cash' ? 'Dinheiro' : 
        payment.method === 'card' ? 'Cartão' :
        payment.method === 'credit' ? 'Crediário' : payment.method,
        payment.amount,
        payment.percentage / 100
      ]),
      [''],
      ['TOP SERVIÇOS'],
      ['Posição', 'Serviço', 'Quantidade', 'Receita'],
      ...report.summary.top_services.map((service, index) => [
        index + 1,
        service.name,
        service.count,
        service.revenue
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(financialData);
    
    // Formatação das células
    const range = XLSX.utils.decode_range(ws['!ref']!);
    
    // Formatar valores monetários
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        // Formatação para células com valores monetários (coluna B de valores)
        if (C === 1 && typeof ws[cellAddress].v === 'number' && ws[cellAddress].v > 0) {
          ws[cellAddress].z = '"R$" #,##0.00';
        }
        
        // Formatação para percentuais
        if (C === 2 && typeof ws[cellAddress].v === 'number' && ws[cellAddress].v < 1) {
          ws[cellAddress].z = '0.0%';
        }
      }
    }
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório Diário');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, filename);
  }

  // Exportar relatório semanal para Excel
  async exportWeeklyToExcel(report: WeeklyServiceOrdersReport, options: ExportOptions = {}): Promise<void> {
    const filename = options.filename || `relatorio-semanal-os-${report.week_start}-${report.week_end}.xlsx`;
    
    const wb = XLSX.utils.book_new();
    
    // Aba 1: Resumo Geral
    const summaryData = [
      ['RESUMO SEMANAL DE ORDENS DE SERVIÇO'],
      [`Período: ${this.formatDate(report.week_start)} a ${this.formatDate(report.week_end)}`],
      [''],
      ['RESUMO GERAL'],
      ['Total de Ordens', report.total_orders],
      ['Ordens Concluídas', report.completed_orders],
      ['Ordens Pendentes', report.pending_orders],
      ['Ordens Canceladas', report.cancelled_orders],
      ['Taxa de Conclusão (%)', report.completion_rate],
      ['Tempo Médio (dias)', report.average_completion_time],
      ['Receita Total', report.total_revenue],
      ['Ticket Médio', report.average_order_value]
    ];
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
    
    // Aba 2: Performance dos Técnicos
    if (report.technician_performance.length > 0) {
      const techData = [
        ['PERFORMANCE DOS TÉCNICOS'],
        [''],
        ['Técnico', 'Ordens Concluídas', 'Eficiência (%)'],
        ...report.technician_performance.map(tech => [
          tech.technician_name,
          tech.orders_completed,
          tech.efficiency_score
        ])
      ];
      
      const wsTech = XLSX.utils.aoa_to_sheet(techData);
      XLSX.utils.book_append_sheet(wb, wsTech, 'Técnicos');
    }
    
    // Aba 3: Serviços
    if (report.service_breakdown.length > 0) {
      const serviceData = [
        ['SERVIÇOS MAIS DEMANDADOS'],
        [''],
        ['#', 'Serviço', 'Quantidade', 'Receita'],
        ...report.service_breakdown.map((service, index) => [
          index + 1,
          service.service_name,
          service.count,
          service.revenue
        ])
      ];
      
      const wsServices = XLSX.utils.aoa_to_sheet(serviceData);
      XLSX.utils.book_append_sheet(wb, wsServices, 'Serviços');
    }
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, filename);
  }

  // Exportar balanço mensal para Excel
  async exportMonthlyToExcel(report: MonthlyBalanceReport, options: ExportOptions = {}): Promise<void> {
    const filename = options.filename || `balanco-mensal-${report.month}-${report.year}.xlsx`;
    
    const wb = XLSX.utils.book_new();
    
    // Aba 1: Resumo Financeiro
    const financialData = [
      ['BALANÇO MENSAL'],
      [`${report.month} de ${report.year}`],
      [''],
      ['RECEITAS'],
      ['Ordens de Serviço', report.revenue.service_orders],
      ['Vendas', report.revenue.sales],
      ['Total de Receitas', report.revenue.total],
      [''],
      ['DESPESAS'],
      ['Compras', report.expenses.purchases],
      ['Operacional', report.expenses.operational],
      ['Total de Despesas', report.expenses.total],
      [''],
      ['RESULTADO'],
      ['Lucro Bruto', report.profit.gross],
      ['Lucro Líquido', report.profit.net],
      ['Margem (%)', report.profit.margin_percentage]
    ];
    
    const wsFinancial = XLSX.utils.aoa_to_sheet(financialData);
    XLSX.utils.book_append_sheet(wb, wsFinancial, 'Financeiro');
    
    // Aba 2: Clientes e KPIs
    const kpiData = [
      ['INDICADORES DE CLIENTES'],
      [''],
      ['Total de Clientes', report.customers.total],
      ['Novos Clientes', report.customers.new],
      ['Clientes que Retornaram', report.customers.returning],
      ['Taxa de Retenção (%)', report.customers.retention_rate],
      [''],
      ['KPIS PRINCIPAIS'],
      [''],
      ['Ticket Médio', report.kpis.average_ticket],
      ['Ordens por Dia', report.kpis.orders_per_day],
      ['Satisfação (%)', report.kpis.customer_satisfaction],
      [''],
      ['ESTOQUE'],
      [''],
      ['Valor do Estoque', report.inventory.value],
      ['Giro do Estoque', report.inventory.turnover],
      ['Itens com Estoque Baixo', report.inventory.low_stock_items]
    ];
    
    const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKpi, 'KPIs');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, filename);
  }

  // Exportar todos os relatórios consolidados
  async exportAllToExcel(
    dailyReport: DailyCashReport,
    weeklyReport: WeeklyServiceOrdersReport,
    monthlyReport: MonthlyBalanceReport,
    options: ExportOptions = {}
  ): Promise<void> {
    const date = new Date();
    const filename = options.filename || `relatorios-consolidados-${format(date, 'yyyy-MM-dd')}.xlsx`;
    
    const wb = XLSX.utils.book_new();
    
    // Aba 1: Resumo Executivo
    const executiveData = [
      ['RELATÓRIOS CONSOLIDADOS'],
      [`Gerado em: ${this.formatDate(date)}`],
      [''],
      ['RESUMO EXECUTIVO'],
      [''],
      ['RELATÓRIO DIÁRIO'],
      [`Data: ${this.formatDate(dailyReport.date)}`],
      ['Receita do Dia', dailyReport.total_receipts],
      ['Transações', dailyReport.transactions_count],
      [''],
      ['RELATÓRIO SEMANAL'],
      [`${this.formatDate(weeklyReport.week_start)} a ${this.formatDate(weeklyReport.week_end)}`],
      ['Total de Ordens', weeklyReport.total_orders],
      ['Taxa de Conclusão (%)', weeklyReport.completion_rate],
      ['Receita Semanal', weeklyReport.total_revenue],
      [''],
      ['BALANÇO MENSAL'],
      [`${monthlyReport.month} de ${monthlyReport.year}`],
      ['Receita Mensal', monthlyReport.revenue.total],
      ['Lucro Líquido', monthlyReport.profit.net],
      ['Margem (%)', monthlyReport.profit.margin_percentage]
    ];
    
    const wsExecutive = XLSX.utils.aoa_to_sheet(executiveData);
    XLSX.utils.book_append_sheet(wb, wsExecutive, 'Resumo Executivo');
    
    // Adicionar abas dos relatórios individuais
    // Relatório Diário
    const dailyData = [
      ['RELATÓRIO DIÁRIO DE CAIXA'],
      [`Data: ${this.formatDate(dailyReport.date)}`],
      [''],
      ['Saldo Inicial', dailyReport.opening_balance],
      ['Receitas', dailyReport.total_receipts],
      ['Despesas', dailyReport.total_expenses],
      ['Saldo Final', dailyReport.closing_balance]
    ];
    
    const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Diário');
    
    // Relatório Semanal (resumido)
    const weeklyData = [
      ['RESUMO SEMANAL'],
      [`${this.formatDate(weeklyReport.week_start)} a ${this.formatDate(weeklyReport.week_end)}`],
      [''],
      ['Total de Ordens', weeklyReport.total_orders],
      ['Concluídas', weeklyReport.completed_orders],
      ['Pendentes', weeklyReport.pending_orders],
      ['Receita', weeklyReport.total_revenue]
    ];
    
    const wsWeekly = XLSX.utils.aoa_to_sheet(weeklyData);
    XLSX.utils.book_append_sheet(wb, wsWeekly, 'Semanal');
    
    // Balanço Mensal (resumido)
    const monthlyData = [
      ['BALANÇO MENSAL'],
      [`${monthlyReport.month} de ${monthlyReport.year}`],
      [''],
      ['Receitas', monthlyReport.revenue.total],
      ['Despesas', monthlyReport.expenses.total],
      ['Lucro Líquido', monthlyReport.profit.net],
      ['Margem (%)', monthlyReport.profit.margin_percentage]
    ];
    
    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Mensal');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, filename);
  }
}

export const exportService = new ExportService();
export default exportService; 