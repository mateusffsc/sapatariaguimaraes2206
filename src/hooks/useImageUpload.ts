import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { imageUploadService, ServiceOrderImage, ImageUploadOptions } from '@/services/imageUploadService';
import { toast } from '@/hooks/use-toast';

// ==================== QUERY KEYS ====================
export const imageUploadKeys = {
  all: ['service_order_images'] as const,
  byOS: (osId: number) => [...imageUploadKeys.all, 'os', osId] as const,
  stats: () => [...imageUploadKeys.all, 'stats'] as const,
};

// ==================== QUERIES ====================

// Hook para listar imagens de uma OS
export function useImagensOS(serviceOrderId: number) {
  return useQuery({
    queryKey: imageUploadKeys.byOS(serviceOrderId),
    queryFn: () => imageUploadService.getServiceOrderImages(serviceOrderId),
    enabled: !!serviceOrderId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para estatísticas de storage
export function useEstatisticasStorage() {
  return useQuery({
    queryKey: imageUploadKeys.stats(),
    queryFn: () => imageUploadService.getImageStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// ==================== MUTATIONS ====================

// Hook para upload de uma imagem
export function useUploadImagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      serviceOrderId
    }: {
      file: File;
      serviceOrderId: number;
    }) => {
      // Validar arquivo antes do upload
      const validation = imageUploadService.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      return imageUploadService.uploadImage(file, serviceOrderId);
    },
    onSuccess: (data, { serviceOrderId }) => {
      // Invalidar cache das imagens da OS
      queryClient.invalidateQueries({ 
        queryKey: imageUploadKeys.byOS(serviceOrderId) 
      });
      
      // Invalidar cache das estatísticas
      queryClient.invalidateQueries({ 
        queryKey: imageUploadKeys.stats() 
      });
      
      toast.success('Imagem enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao fazer upload:', error);
      toast.error(`Erro no upload: ${error.message}`);
    },
  });
}

// Hook para upload múltiplo de imagens
export function useUploadMultiplasImagens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      serviceOrderId,
      onProgress
    }: {
      files: File[];
      serviceOrderId: number;
      onProgress?: (completed: number, total: number) => void;
    }) => {
      // Validar arquivos antes do upload
      const validation = imageUploadService.validateFiles(files);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      return imageUploadService.uploadMultipleImages(files, serviceOrderId, onProgress);
    },
    onSuccess: (data, { serviceOrderId }) => {
      // Invalidar cache das imagens da OS
      queryClient.invalidateQueries({ 
        queryKey: imageUploadKeys.byOS(serviceOrderId) 
      });
      
      // Invalidar cache das estatísticas
      queryClient.invalidateQueries({ 
        queryKey: imageUploadKeys.stats() 
      });
      
      const sucessos = data.length;
      toast.success(`${sucessos} imagem(ns) enviada(s) com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro no upload múltiplo:', error);
      toast.error(`Erro no upload: ${error.message}`);
    },
  });
}

// Hook para remover imagem
export function useRemoverImagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: number) => {
      return imageUploadService.deleteImage(imageId);
    },
    onSuccess: () => {
      // Invalidar cache de todas as imagens (não sabemos qual OS)
      queryClient.invalidateQueries({ 
        queryKey: imageUploadKeys.all 
      });
      
      // Invalidar cache das estatísticas
      queryClient.invalidateQueries({ 
        queryKey: imageUploadKeys.stats() 
      });
      
      toast.success('Imagem removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover imagem:', error);
      toast.error(`Erro ao remover imagem: ${error.message}`);
    },
  });
}

// ==================== UTILITÁRIOS ====================

// Hook para validar arquivos (não faz upload)
export function useValidarArquivos() {
  return {
    validarArquivo: (file: File) => imageUploadService.validateFile(file),
    validarArquivos: (files: File[]) => imageUploadService.validateFiles(files),
  };
}

// Hook para formatar tamanho de arquivo
export function useFormatarTamanhoArquivo() {
  return (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
}

// Hook para buscar imagens de uma ordem de serviço
export const useServiceOrderImages = (serviceOrderId: string) => {
  const imagesQuery = useQuery({
    queryKey: ['service-order-images', serviceOrderId],
    queryFn: () => imageUploadService.getServiceOrderImages(serviceOrderId),
    enabled: !!serviceOrderId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  return {
    images: imagesQuery.data || [],
    isLoading: imagesQuery.isLoading,
    error: imagesQuery.error,
    refetch: imagesQuery.refetch,
  };
};

// Hook para upload de imagens
export const useImageUpload = () => {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      serviceOrderId,
      imageType,
      description,
      options
    }: {
      file: File;
      serviceOrderId: string;
      imageType: 'before' | 'after' | 'progress' | 'other';
      description?: string;
      options?: ImageUploadOptions;
    }) => imageUploadService.uploadImage(file, serviceOrderId, imageType, description, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['service-order-images', variables.serviceOrderId] 
      });
      queryClient.invalidateQueries({ queryKey: ['image-stats'] });
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao enviar imagem",
        variant: "destructive",
      });
    },
  });

  const uploadMultipleMutation = useMutation({
    mutationFn: ({
      files,
      serviceOrderId,
      imageType,
      descriptions,
      options
    }: {
      files: File[];
      serviceOrderId: string;
      imageType: 'before' | 'after' | 'progress' | 'other';
      descriptions?: string[];
      options?: ImageUploadOptions;
    }) => imageUploadService.uploadMultipleImages(files, serviceOrderId, imageType, descriptions, options),
    onSuccess: (results, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['service-order-images', variables.serviceOrderId] 
      });
      queryClient.invalidateQueries({ queryKey: ['image-stats'] });
      
      const successCount = results.length;
      const totalCount = variables.files.length;
      
      if (successCount === totalCount) {
        toast({
          title: "Sucesso",
          description: `${successCount} ${successCount === 1 ? 'imagem enviada' : 'imagens enviadas'} com sucesso!`,
        });
      } else {
        toast({
          title: "Upload parcial",
          description: `${successCount} de ${totalCount} imagens enviadas com sucesso`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload múltiplo",
        description: error.message || "Erro ao enviar imagens",
        variant: "destructive",
      });
    },
  });

  return {
    uploadImage: uploadMutation.mutate,
    uploadMultipleImages: uploadMultipleMutation.mutate,
    isUploading: uploadMutation.isPending,
    isUploadingMultiple: uploadMultipleMutation.isPending,
    uploadProgress: uploadMutation.isPending ? 50 : 0, // Simulado
  };
};

// Hook para gerenciar imagens (atualizar/deletar)
export const useImageManagement = () => {
  const queryClient = useQueryClient();

  const updateDescriptionMutation = useMutation({
    mutationFn: ({ imageId, description }: { imageId: string; description: string }) =>
      imageUploadService.updateImageDescription(imageId, description),
    onSuccess: (updatedImage) => {
      // Atualizar cache local
      queryClient.setQueryData(
        ['service-order-images', updatedImage.service_order_id],
        (oldData: ServiceOrderImage[] | undefined) => {
          if (!oldData) return [];
          return oldData.map(img => 
            img.id === updatedImage.id ? updatedImage : img
          );
        }
      );
      
      queryClient.invalidateQueries({ queryKey: ['image-stats'] });
      
      toast({
        title: "Sucesso",
        description: "Descrição atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar descrição",
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => imageUploadService.deleteImage(imageId),
    onSuccess: (_, imageId) => {
      // Remover do cache local
      queryClient.setQueriesData(
        { queryKey: ['service-order-images'] },
        (oldData: ServiceOrderImage[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter(img => img.id !== imageId);
        }
      );
      
      queryClient.invalidateQueries({ queryKey: ['image-stats'] });
      
      toast({
        title: "Sucesso",
        description: "Imagem removida com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover imagem",
        variant: "destructive",
      });
    },
  });

  const deleteAllImagesMutation = useMutation({
    mutationFn: (serviceOrderId: string) => 
      imageUploadService.deleteAllServiceOrderImages(serviceOrderId),
    onSuccess: (_, serviceOrderId) => {
      queryClient.setQueryData(['service-order-images', serviceOrderId], []);
      queryClient.invalidateQueries({ queryKey: ['image-stats'] });
      
      toast({
        title: "Sucesso",
        description: "Todas as imagens foram removidas!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover todas as imagens",
        variant: "destructive",
      });
    },
  });

  return {
    updateDescription: updateDescriptionMutation.mutate,
    isUpdatingDescription: updateDescriptionMutation.isPending,
    deleteImage: deleteImageMutation.mutate,
    isDeletingImage: deleteImageMutation.isPending,
    deleteAllImages: deleteAllImagesMutation.mutate,
    isDeletingAllImages: deleteAllImagesMutation.isPending,
  };
};

// Hook para estatísticas de imagens
export const useImageStats = (serviceOrderId?: string) => {
  const statsQuery = useQuery({
    queryKey: ['image-stats', serviceOrderId],
    queryFn: () => imageUploadService.getImageStats(serviceOrderId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 60 * 1000, // Refetch a cada 30 minutos
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
    refetch: statsQuery.refetch,
  };
};

// Hook para validação de arquivos
export const useFileValidation = () => {
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`
      };
    }

    return { isValid: true };
  };

  const validateFiles = (files: File[]): { 
    isValid: boolean; 
    errors: string[];
    validFiles: File[];
  } => {
    const errors: string[] = [];
    const validFiles: File[] = [];

    if (files.length === 0) {
      return { isValid: false, errors: ['Nenhum arquivo selecionado'], validFiles };
    }

    if (files.length > 10) {
      errors.push('Máximo de 10 imagens por vez');
    }

    files.forEach((file, index) => {
      const validation = validateFile(file);
      if (!validation.isValid) {
        errors.push(`Arquivo ${index + 1} (${file.name}): ${validation.error}`);
      } else {
        validFiles.push(file);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validFiles
    };
  };

  return {
    validateFile,
    validateFiles,
  };
};

// Hook consolidado para upload de imagens
export const useImageUploadManager = (serviceOrderId: string) => {
  const images = useServiceOrderImages(serviceOrderId);
  const upload = useImageUpload();
  const management = useImageManagement();
  const stats = useImageStats(serviceOrderId);
  const validation = useFileValidation();

  // Funções de conveniência
  const uploadWithValidation = (
    file: File,
    imageType: 'before' | 'after' | 'progress' | 'other',
    description?: string,
    options?: ImageUploadOptions
  ) => {
    const { isValid, error } = validation.validateFile(file);
    
    if (!isValid) {
      toast({
        title: "Arquivo inválido",
        description: error,
        variant: "destructive",
      });
      return;
    }

    upload.uploadImage({ file, serviceOrderId, imageType, description, options });
  };

  const uploadMultipleWithValidation = (
    files: File[],
    imageType: 'before' | 'after' | 'progress' | 'other',
    descriptions?: string[],
    options?: ImageUploadOptions
  ) => {
    const { validFiles, errors } = validation.validateFiles(files);

    if (errors.length > 0) {
      toast({
        title: "Alguns arquivos são inválidos",
        description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? '...' : ''),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      upload.uploadMultipleImages({ 
        files: validFiles, 
        serviceOrderId, 
        imageType, 
        descriptions, 
        options 
      });
    }
  };

  const getImagesByType = (type: 'before' | 'after' | 'progress' | 'other') => {
    return images.images.filter(img => img.image_type === type);
  };

  const getTotalSize = () => {
    return images.images.reduce((total, img) => total + img.file_size, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    // Dados
    images: images.images,
    stats: stats.stats,
    
    // Estados de loading
    isLoading: images.isLoading,
    isUploading: upload.isUploading || upload.isUploadingMultiple,
    isManaging: management.isUpdatingDescription || management.isDeletingImage || management.isDeletingAllImages,
    
    // Funcões de upload
    uploadImage: uploadWithValidation,
    uploadMultipleImages: uploadMultipleWithValidation,
    
    // Funções de gestão
    updateDescription: management.updateDescription,
    deleteImage: management.deleteImage,
    deleteAllImages: () => management.deleteAllImages(serviceOrderId),
    
    // Funções de conveniência
    getImagesByType,
    getTotalSize,
    formatFileSize,
    
    // Validação
    validateFile: validation.validateFile,
    validateFiles: validation.validateFiles,
    
    // Refresh
    refetch: images.refetch,
    refetchStats: stats.refetch,
  };
}; 