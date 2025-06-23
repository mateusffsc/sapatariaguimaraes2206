import React, { useState, useCallback } from 'react';
import { X, Upload, Camera, Eye, Trash2, Edit3, Download, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useImageUploadManager } from '@/hooks/useImageUpload';
import { ServiceOrderImage, ImageUploadOptions } from '@/services/imageUploadService';

interface ImageUploadProps {
  serviceOrderId: string;
  className?: string;
  showStats?: boolean;
  allowedTypes?: ('before' | 'after' | 'progress' | 'other')[];
  maxImages?: number;
  compressOptions?: ImageUploadOptions;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  serviceOrderId,
  className = '',
  showStats = true,
  allowedTypes = ['before', 'after', 'progress', 'other'],
  maxImages = 20,
  compressOptions = {}
}) => {
  const [activeTab, setActiveTab] = useState<'before' | 'after' | 'progress' | 'other'>('before');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadType, setUploadType] = useState<'before' | 'after' | 'progress' | 'other'>('before');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<ServiceOrderImage | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const {
    images,
    stats,
    isLoading,
    isUploading,
    uploadImage,
    uploadMultipleImages,
    updateDescription,
    deleteImage,
    deleteAllImages,
    getImagesByType,
    getTotalSize,
    formatFileSize,
    validateFiles,
    refetch
  } = useImageUploadManager(serviceOrderId);

  // Tipos com labels amigáveis
  const imageTypeLabels = {
    before: 'Antes',
    after: 'Depois',
    progress: 'Progresso',
    other: 'Outros'
  };

  const imageTypeColors = {
    before: 'bg-blue-100 text-blue-800',
    after: 'bg-green-100 text-green-800',
    progress: 'bg-yellow-100 text-yellow-800',
    other: 'bg-purple-100 text-purple-800'
  };

  // Manipulação de arquivos
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const { validFiles, errors } = validateFiles(fileArray);
    
    if (errors.length > 0) {
      console.warn('Arquivos inválidos:', errors);
    }
    
    // Limitar número de arquivos
    const limitedFiles = validFiles.slice(0, maxImages - images.length);
    setSelectedFiles(limitedFiles);
  }, [validateFiles, maxImages, images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Upload de imagens
  const handleUpload = useCallback(() => {
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length === 1) {
      uploadImage(selectedFiles[0], uploadType, description, compressOptions);
    } else {
      const descriptions = selectedFiles.map(() => description);
      uploadMultipleImages(selectedFiles, uploadType, descriptions, compressOptions);
    }

    // Limpar formulário
    setSelectedFiles([]);
    setDescription('');
  }, [selectedFiles, uploadType, description, compressOptions, uploadImage, uploadMultipleImages]);

  // Edição de descrição
  const handleEditDescription = useCallback((imageId: string, currentDescription: string) => {
    setEditingImageId(imageId);
    setEditDescription(currentDescription || '');
  }, []);

  const handleSaveDescription = useCallback(() => {
    if (editingImageId) {
      updateDescription({ imageId: editingImageId, description: editDescription });
      setEditingImageId(null);
      setEditDescription('');
    }
  }, [editingImageId, editDescription, updateDescription]);

  // Componente de galeria de imagens
  const ImageGallery: React.FC<{ images: ServiceOrderImage[] }> = ({ images }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((image) => (
        <Card key={image.id} className="relative overflow-hidden">
          <div className="aspect-square relative">
            <img
              src={image.image_url}
              alt={image.description || 'Imagem da OS'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary" onClick={() => setSelectedImage(image)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Visualizar Imagem</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <img
                        src={image.image_url}
                        alt={image.description || 'Imagem da OS'}
                        className="w-full h-auto max-h-96 object-contain"
                      />
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Tipo:</strong> {imageTypeLabels[image.image_type]}</p>
                        <p><strong>Descrição:</strong> {image.description || 'Sem descrição'}</p>
                        <p><strong>Tamanho:</strong> {formatFileSize(image.file_size)}</p>
                        <p><strong>Enviado em:</strong> {new Date(image.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEditDescription(image.id, image.description || '')}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteImage(image.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <Badge className={imageTypeColors[image.image_type]}>
                {imageTypeLabels[image.image_type]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(image.file_size)}
              </span>
            </div>
            {image.description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {image.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Componente de área de upload
  const UploadArea: React.FC = () => (
    <div className="space-y-4">
      {/* Área de drag and drop */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className="w-12 h-12 text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-medium">Arraste imagens aqui</p>
            <p className="text-sm text-muted-foreground">ou</p>
          </div>
          <div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Selecionar Imagens
              </Button>
            </Label>
          </div>
        </div>
      </div>

      {/* Configurações de upload */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Configurar Upload ({selectedFiles.length} {selectedFiles.length === 1 ? 'imagem' : 'imagens'})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="upload-type">Tipo de Imagem</Label>
              <select
                id="upload-type"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {allowedTypes.map(type => (
                  <option key={type} value={type}>
                    {imageTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="upload-description">Descrição (opcional)</Label>
              <Textarea
                id="upload-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição para as imagens..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? 'Enviando...' : 'Enviar Imagens'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedFiles([])}
                disabled={isUploading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de progresso */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Enviando imagens...</span>
            <span>50%</span>
          </div>
          <Progress value={50} />
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{stats.total_images}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Tamanho</p>
                  <p className="text-2xl font-bold">{formatFileSize(stats.total_size)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Antes</p>
                  <p className="text-2xl font-bold">{stats.by_type.before || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Depois</p>
                  <p className="text-2xl font-bold">{stats.by_type.after || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Abas de navegação */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            {allowedTypes.map(type => (
              <TabsTrigger key={type} value={type}>
                {imageTypeLabels[type]} ({getImagesByType(type).length})
              </TabsTrigger>
            ))}
          </TabsList>
          
          {images.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteAllImages()}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Todas
            </Button>
          )}
        </div>

        {/* Conteúdo das abas */}
        {allowedTypes.map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            <ImageGallery images={getImagesByType(type)} />
            
            {getImagesByType(type).length === 0 && (
              <Alert>
                <AlertDescription>
                  Nenhuma imagem do tipo "{imageTypeLabels[type]}" foi encontrada.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Área de upload */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novas Imagens</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadArea />
        </CardContent>
      </Card>

      {/* Modal de edição de descrição */}
      <Dialog open={!!editingImageId} onOpenChange={() => setEditingImageId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Descrição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Adicione uma descrição para a imagem..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingImageId(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveDescription}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageUpload; 