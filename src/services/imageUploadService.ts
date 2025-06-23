import { supabase } from '@/lib/supabase';

export interface ServiceOrderImage {
  id: string;
  service_order_id: string;
  image_url: string;
  image_type: 'before' | 'after' | 'progress' | 'other';
  description?: string;
  file_size: number;
  file_name: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface ImageUploadOptions {
  quality?: number; // 0.1 a 1.0
  maxWidth?: number;
  maxHeight?: number;
  compressFormat?: 'image/jpeg' | 'image/webp';
}

class ImageUploadService {
  private readonly BUCKET_NAME = 'service-order-images';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Configurações padrão de compressão
  private readonly DEFAULT_OPTIONS: ImageUploadOptions = {
    quality: 0.8,
    maxWidth: 1200,
    maxHeight: 1200,
    compressFormat: 'image/jpeg'
  };

  // Buscar imagens de uma ordem de serviço
  async getServiceOrderImages(serviceOrderId: string): Promise<ServiceOrderImage[]> {
    try {
      const { data, error } = await supabase
        .from('service_order_images')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar imagens da OS:', error);
      return [];
    }
  }

  // Upload de uma imagem
  async uploadImage(
    file: File,
    serviceOrderId: string,
    imageType: 'before' | 'after' | 'progress' | 'other',
    description?: string,
    options: ImageUploadOptions = {}
  ): Promise<ServiceOrderImage> {
    try {
      // Validar arquivo
      this.validateFile(file);

      // Aplicar configurações
      const config = { ...this.DEFAULT_OPTIONS, ...options };

      // Comprimir imagem
      const compressedFile = await this.compressImage(file, config);

      // Gerar nome único para o arquivo
      const fileName = this.generateFileName(file.name, serviceOrderId, imageType);

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      // Salvar registro no banco
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const imageRecord = {
        service_order_id: serviceOrderId,
        image_url: urlData.publicUrl,
        image_type: imageType,
        description: description || null,
        file_size: compressedFile.size,
        file_name: fileName,
        uploaded_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: dbData, error: dbError } = await supabase
        .from('service_order_images')
        .insert(imageRecord)
        .select()
        .single();

      if (dbError) {
        // Se falhou ao salvar no banco, remover arquivo do storage
        await this.deleteFromStorage(fileName);
        throw dbError;
      }

      return dbData;
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      throw error;
    }
  }

  // Upload múltiplo de imagens
  async uploadMultipleImages(
    files: File[],
    serviceOrderId: string,
    imageType: 'before' | 'after' | 'progress' | 'other',
    descriptions?: string[],
    options: ImageUploadOptions = {}
  ): Promise<ServiceOrderImage[]> {
    const results: ServiceOrderImage[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const description = descriptions?.[i];
        const result = await this.uploadImage(files[i], serviceOrderId, imageType, description, options);
        results.push(result);
      } catch (error: any) {
        errors.push(`Arquivo ${files[i].name}: ${error.message}`);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`Todos os uploads falharam:\n${errors.join('\n')}`);
    }

    if (errors.length > 0) {
      console.warn('Alguns uploads falharam:', errors);
    }

    return results;
  }

  // Atualizar descrição da imagem
  async updateImageDescription(imageId: string, description: string): Promise<ServiceOrderImage> {
    try {
      const { data, error } = await supabase
        .from('service_order_images')
        .update({ 
          description, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', imageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar descrição da imagem:', error);
      throw error;
    }
  }

  // Deletar imagem
  async deleteImage(imageId: string): Promise<void> {
    try {
      // Buscar dados da imagem
      const { data: imageData, error: fetchError } = await supabase
        .from('service_order_images')
        .select('file_name')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      // Deletar arquivo do storage
      await this.deleteFromStorage(imageData.file_name);

      // Deletar registro do banco
      const { error: deleteError } = await supabase
        .from('service_order_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw error;
    }
  }

  // Deletar todas as imagens de uma OS
  async deleteAllServiceOrderImages(serviceOrderId: string): Promise<void> {
    try {
      const images = await this.getServiceOrderImages(serviceOrderId);
      
      for (const image of images) {
        await this.deleteImage(image.id);
      }
    } catch (error) {
      console.error('Erro ao deletar todas as imagens da OS:', error);
      throw error;
    }
  }

  // Validar arquivo
  private validateFile(file: File): void {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido. Use: ${this.ALLOWED_TYPES.join(', ')}`);
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  }

  // Comprimir imagem
  private async compressImage(file: File, options: ImageUploadOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calcular dimensões mantendo proporção
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            options.maxWidth!,
            options.maxHeight!
          );

          canvas.width = width;
          canvas.height = height;

          // Desenhar imagem redimensionada
          ctx?.drawImage(img, 0, 0, width, height);

          // Converter para blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: options.compressFormat!,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Falha na compressão da imagem'));
              }
            },
            options.compressFormat!,
            options.quality!
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Calcular dimensões proporcionais
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Reduzir se necessário
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // Gerar nome único para arquivo
  private generateFileName(originalName: string, serviceOrderId: string, imageType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${serviceOrderId}/${imageType}/${timestamp}_${random}.${extension}`;
  }

  // Deletar arquivo do storage
  private async deleteFromStorage(fileName: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.warn('Aviso: Falha ao deletar arquivo do storage:', error);
      // Não lançar erro para não quebrar o fluxo
    }
  }

  // Obter estatísticas de imagens
  async getImageStats(serviceOrderId?: string): Promise<{
    total_images: number;
    total_size: number;
    by_type: Record<string, number>;
    recent_uploads: number;
  }> {
    try {
      let query = supabase.from('service_order_images').select('*');
      
      if (serviceOrderId) {
        query = query.eq('service_order_id', serviceOrderId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const images = data || [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats = {
        total_images: images.length,
        total_size: images.reduce((sum, img) => sum + img.file_size, 0),
        by_type: images.reduce((acc, img) => {
          acc[img.image_type] = (acc[img.image_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recent_uploads: images.filter(img => 
          new Date(img.created_at) > oneDayAgo
        ).length
      };

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de imagens:', error);
      return {
        total_images: 0,
        total_size: 0,
        by_type: {},
        recent_uploads: 0
      };
    }
  }

  // Criar bucket se não existir (função administrativa)
  async initializeBucket(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE
        });

        if (error) {
          console.error('Erro ao criar bucket:', error);
        } else {
          console.log('Bucket criado com sucesso');
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar bucket:', error);
    }
  }
}

export const imageUploadService = new ImageUploadService();
export default imageUploadService; 