import QRCode from 'qrcode';

export interface QRCodeData {
  type: 'service_order' | 'client' | 'product';
  id: string;
  metadata?: Record<string, any>;
}

export interface PrintOptions {
  format: 'thermal' | 'a4' | 'label';
  size: 'small' | 'medium' | 'large';
  includeText?: boolean;
  includeDetails?: boolean;
}

class QRCodeService {
  private baseUrl = window.location.origin;

  // Gera URL para consulta da OS
  generateServiceOrderUrl(serviceOrderId: string): string {
    return `${this.baseUrl}/consulta/os/${serviceOrderId}`;
  }

  // Gera URL para consulta do cliente
  generateClientUrl(clientId: string): string {
    return `${this.baseUrl}/consulta/cliente/${clientId}`;
  }

  // Gera QR Code como data URL
  async generateQRCode(data: string, options?: {
    width?: number;
    margin?: number;
    color?: { dark: string; light: string };
  }): Promise<string> {
    try {
      const qrOptions = {
        width: options?.width || 200,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#FFFFFF'
        }
      };

      return await QRCode.toDataURL(data, qrOptions);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw new Error('Erro ao gerar QR Code');
    }
  }

  // Gera QR Code para ordem de serviço
  async generateServiceOrderQR(serviceOrderId: string, options?: {
    width?: number;
    margin?: number;
  }): Promise<string> {
    const url = this.generateServiceOrderUrl(serviceOrderId);
    return this.generateQRCode(url, options);
  }

  // Gera QR Code para cliente
  async generateClientQR(clientId: string, options?: {
    width?: number;
    margin?: number;
  }): Promise<string> {
    const url = this.generateClientUrl(clientId);
    return this.generateQRCode(url, options);
  }

  // Gera HTML para impressão
  generatePrintHTML(content: {
    title: string;
    qrCode: string;
    details?: Array<{label: string; value: string}>;
    footer?: string;
  }, options: PrintOptions): string {
    const { title, qrCode, details = [], footer } = content;
    const { format, size, includeText = true, includeDetails = true } = options;

    const qrSize = size === 'small' ? '100px' : 
                   size === 'medium' ? '150px' : '200px';

    const styles = this.getPrintStyles(format, size);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="print-container">
            ${includeText ? `<h2 class="title">${title}</h2>` : ''}
            
            <div class="qr-container">
              <img src="${qrCode}" alt="QR Code" style="width: ${qrSize}; height: ${qrSize};" />
            </div>

            ${includeDetails && details.length > 0 ? `
              <div class="details">
                ${details.map(detail => `
                  <div class="detail-row">
                    <span class="label">${detail.label}:</span>
                    <span class="value">${detail.value}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${footer ? `<div class="footer">${footer}</div>` : ''}
          </div>
        </body>
      </html>
    `;
  }

  // Estilos CSS para impressão
  private getPrintStyles(format: string, size: string): string {
    const baseStyles = `
      @media print {
        @page { margin: 0.5cm; }
        body { margin: 0; padding: 0; }
      }
      
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
      }
      
      .print-container {
        text-align: center;
        padding: 10px;
      }
      
      .title {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: bold;
      }
      
      .qr-container {
        margin: 15px 0;
        display: flex;
        justify-content: center;
      }
      
      .details {
        margin-top: 15px;
        text-align: left;
      }
      
      .detail-row {
        margin: 5px 0;
        display: flex;
        justify-content: space-between;
      }
      
      .label {
        font-weight: bold;
        margin-right: 10px;
      }
      
      .value {
        text-align: right;
      }
      
      .footer {
        margin-top: 20px;
        font-size: 10px;
        color: #666;
        border-top: 1px solid #ccc;
        padding-top: 10px;
      }
    `;

    // Estilos específicos por formato
    const formatStyles = {
      thermal: `
        .print-container { max-width: 58mm; }
        .title { font-size: 14px; }
        body { font-size: 10px; }
      `,
      label: `
        .print-container { 
          max-width: 100mm; 
          max-height: 60mm; 
          padding: 5px;
        }
        .title { font-size: 12px; margin-bottom: 8px; }
        .details { margin-top: 8px; }
      `,
      a4: `
        .print-container { max-width: 210mm; padding: 20px; }
        .title { font-size: 18px; }
        body { font-size: 14px; }
      `
    };

    return baseStyles + (formatStyles[format as keyof typeof formatStyles] || formatStyles.a4);
  }

  // Imprime diretamente
  printQRCode(content: {
    title: string;
    qrCode: string;
    details?: Array<{label: string; value: string}>;
    footer?: string;
  }, options: PrintOptions = { format: 'a4', size: 'medium' }): void {
    const html = this.generatePrintHTML(content, options);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Aguarda o carregamento antes de imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 100);
      };
    }
  }

  // Baixa como PDF (simulado)
  downloadQRCode(content: {
    title: string;
    qrCode: string;
    details?: Array<{label: string; value: string}>;
    footer?: string;
  }, options: PrintOptions = { format: 'a4', size: 'medium' }, filename?: string): void {
    const html = this.generatePrintHTML(content, options);
    
    // Cria um blob com o HTML
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Cria link para download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `qrcode-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpa a URL
    URL.revokeObjectURL(url);
  }
}

export const qrCodeService = new QRCodeService(); 