import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { qrCodeService, PrintOptions } from '../services/qrCodeService';
import { toast } from 'sonner';

export function useQRCode() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Gera QR Code para ordem de serviço
  const generateServiceOrderQRMutation = useMutation({
    mutationFn: async ({ serviceOrderId, options }: {
      serviceOrderId: string;
      options?: { width?: number; margin?: number };
    }) => {
      setIsGenerating(true);
      try {
        return await qrCodeService.generateServiceOrderQR(serviceOrderId, options);
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: () => {
      toast.success('QR Code gerado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code');
    }
  });

  // Gera QR Code para cliente
  const generateClientQRMutation = useMutation({
    mutationFn: async ({ clientId, options }: {
      clientId: string;
      options?: { width?: number; margin?: number };
    }) => {
      setIsGenerating(true);
      try {
        return await qrCodeService.generateClientQR(clientId, options);
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: () => {
      toast.success('QR Code gerado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code');
    }
  });

  // Imprime QR Code
  const printQRCodeMutation = useMutation({
    mutationFn: async ({ content, options }: {
      content: {
        title: string;
        qrCode: string;
        details?: Array<{label: string; value: string}>;
        footer?: string;
      };
      options: PrintOptions;
    }) => {
      qrCodeService.printQRCode(content, options);
    },
    onSuccess: () => {
      toast.success('Enviado para impressão!');
    },
    onError: (error) => {
      console.error('Erro ao imprimir:', error);
      toast.error('Erro ao imprimir QR Code');
    }
  });

  // Baixa QR Code
  const downloadQRCodeMutation = useMutation({
    mutationFn: async ({ content, options, filename }: {
      content: {
        title: string;
        qrCode: string;
        details?: Array<{label: string; value: string}>;
        footer?: string;
      };
      options: PrintOptions;
      filename?: string;
    }) => {
      qrCodeService.downloadQRCode(content, options, filename);
    },
    onSuccess: () => {
      toast.success('Download iniciado!');
    },
    onError: (error) => {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar QR Code');
    }
  });

  return {
    // Estado
    isGenerating,
    
    // Mutações
    generateServiceOrderQR: generateServiceOrderQRMutation.mutateAsync,
    generateClientQR: generateClientQRMutation.mutateAsync,
    printQRCode: printQRCodeMutation.mutateAsync,
    downloadQRCode: downloadQRCodeMutation.mutateAsync,
    
    // Loading states
    isGeneratingServiceOrderQR: generateServiceOrderQRMutation.isPending,
    isGeneratingClientQR: generateClientQRMutation.isPending,
    isPrinting: printQRCodeMutation.isPending,
    isDownloading: downloadQRCodeMutation.isPending,
    
    // Utils
    generateUrl: {
      serviceOrder: qrCodeService.generateServiceOrderUrl.bind(qrCodeService),
      client: qrCodeService.generateClientUrl.bind(qrCodeService)
    }
  };
}

// Hook para gerar QR Code em tempo real (query)
export function useQRCodeQuery(type: 'service_order' | 'client', id: string, enabled = true) {
  return useQuery({
    queryKey: ['qrcode', type, id],
    queryFn: async () => {
      if (type === 'service_order') {
        return await qrCodeService.generateServiceOrderQR(id);
      } else {
        return await qrCodeService.generateClientQR(id);
      }
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
} 