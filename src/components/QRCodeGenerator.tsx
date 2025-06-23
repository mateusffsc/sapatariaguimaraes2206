import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useQRCode, useQRCodeQuery } from '../hooks/useQRCode';
import { PrintOptions } from '../services/qrCodeService';
import { 
  QrCode, 
  Printer, 
  Download, 
  Eye, 
  Copy,
  Settings,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  type: 'service_order' | 'client';
  id: string;
  title: string;
  details?: Array<{ label: string; value: string }>;
  className?: string;
}

export function QRCodeGenerator({ 
  type, 
  id, 
  title, 
  details = [], 
  className = "" 
}: QRCodeGeneratorProps) {
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    format: 'a4',
    size: 'medium',
    includeText: true,
    includeDetails: true
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { 
    printQRCode, 
    downloadQRCode, 
    isPrinting, 
    isDownloading,
    generateUrl 
  } = useQRCode();

  const { 
    data: qrCodeData, 
    isLoading, 
    error,
    refetch 
  } = useQRCodeQuery(type, id);

  const handleCopyUrl = () => {
    const url = type === 'service_order' 
      ? generateUrl.serviceOrder(id)
      : generateUrl.client(id);
    
    navigator.clipboard.writeText(url);
    toast.success('URL copiada para a área de transferência!');
  };

  const handlePreview = () => {
    if (!qrCodeData) return;
    
    const url = type === 'service_order' 
      ? generateUrl.serviceOrder(id)
      : generateUrl.client(id);
    
    window.open(url, '_blank');
  };

  const handlePrint = async () => {
    if (!qrCodeData) return;

    const content = {
      title,
      qrCode: qrCodeData,
      details,
      footer: 'Gerado em ' + new Date().toLocaleString()
    };

    try {
      await printQRCode({ content, options: printOptions });
    } catch (error) {
      console.error('Erro ao imprimir:', error);
    }
  };

  const handleDownload = async () => {
    if (!qrCodeData) return;

    const content = {
      title,
      qrCode: qrCodeData,
      details,
      footer: 'Gerado em ' + new Date().toLocaleString()
    };

    const filename = `qrcode-${type}-${id}-${Date.now()}`;

    try {
      await downloadQRCode({ content, options: printOptions, filename });
    } catch (error) {
      console.error('Erro ao baixar:', error);
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-red-500">
            <p>Erro ao gerar QR Code</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="ml-2"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5" />
          QR Code - {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Visualização do QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center w-48 h-48">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : qrCodeData ? (
              <img 
                src={qrCodeData} 
                alt="QR Code"
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-48 h-48 text-gray-400">
                <QrCode className="h-12 w-12" />
              </div>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyUrl}
            disabled={isLoading}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copiar URL
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isLoading || !qrCodeData}
          >
            <Eye className="h-4 w-4 mr-1" />
            Visualizar
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            disabled={isLoading || !qrCodeData || isPrinting}
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-1" />
            )}
            Imprimir
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={isLoading || !qrCodeData || isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Baixar
          </Button>
        </div>

        {/* Configurações avançadas */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-1" />
            {showAdvanced ? 'Ocultar' : 'Mostrar'} Configurações
          </Button>

          {showAdvanced && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                {/* Formato */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Formato
                  </label>
                  <Select
                    value={printOptions.format}
                    onValueChange={(value: 'thermal' | 'a4' | 'label') =>
                      setPrintOptions(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="thermal">Térmica</SelectItem>
                      <SelectItem value="label">Etiqueta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tamanho */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Tamanho
                  </label>
                  <Select
                    value={printOptions.size}
                    onValueChange={(value: 'small' | 'medium' | 'large') =>
                      setPrintOptions(prev => ({ ...prev, size: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.includeText}
                    onChange={(e) =>
                      setPrintOptions(prev => ({ 
                        ...prev, 
                        includeText: e.target.checked 
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Incluir título</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOptions.includeDetails}
                    onChange={(e) =>
                      setPrintOptions(prev => ({ 
                        ...prev, 
                        includeDetails: e.target.checked 
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Incluir detalhes</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Informações do QR Code */}
        {details.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Informações:</h4>
              <div className="space-y-1">
                {details.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{detail.label}:</span>
                    <Badge variant="outline">{detail.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 