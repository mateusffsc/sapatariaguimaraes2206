import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  CalendarDays, 
  User, 
  MapPin, 
  Phone, 
  Loader2, 
  XCircle, 
  Edit, 
  Eye, 
  History, 
  Image, 
  Upload, 
  Trash2,
  Clock,
  FileText
} from 'lucide-react'
import { useObterOrdemServico } from '../../hooks/useServiceOrders'
import { useClientes } from '../../hooks/useClientes'
import { useMudarStatusComHistorico, useHistoricoOS } from '../../hooks/useServiceOrderHistory'
import { useImagensOS, useUploadMultiplasImagens, useRemoverImagem } from '../../hooks/useImageUpload'
import { toast } from 'sonner'

interface OrdemServicoModalAtualizadoProps {
  isOpen: boolean
  onClose: () => void
  ordemId: number | null
  onEdit?: () => void
}

export const OrdemServicoModalAtualizado: React.FC<OrdemServicoModalAtualizadoProps> = ({
  isOpen,
  onClose,
  ordemId,
  onEdit
}) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState('detalhes')

  const { data: ordem, isLoading, error, refetch } = useObterOrdemServico(ordemId!)
  const { data: clientes } = useClientes()
  const { data: historico } = useHistoricoOS(ordemId!)
  const { data: imagens } = useImagensOS(ordemId!)
  
  const mudarStatusComHistorico = useMudarStatusComHistorico()
  const uploadImagens = useUploadMultiplasImagens()
  const removerImagem = useRemoverImagem()

  const getStatusLabel = (status: string) => {
    const labels = {
      'budget': 'Orçamento',
      'approved': 'Aprovado',
      'in_progress': 'Em Andamento',
      'completed': 'Pronto',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'budget': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'delivered': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const handleStatusChange = async (novoStatus: string) => {
    if (!ordemId || !ordem) return

    try {
      await mudarStatusComHistorico.mutateAsync({
        serviceOrderId: ordemId,
        novoStatus,
        statusAnterior: ordem.status,
        observacao: 'Status alterado via modal de visualização'
      })
      
      await refetch()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedImages(files)
    }
  }

  const handleUploadImages = async () => {
    if (!ordemId || selectedImages.length === 0) return

    try {
      await uploadImagens.mutateAsync({
        files: selectedImages,
        serviceOrderId: ordemId
      })
      setSelectedImages([])
    } catch (error) {
      console.error('Erro no upload:', error)
    }
  }

  const handleRemoveImage = async (imageId: number) => {
    try {
      await removerImagem.mutateAsync(imageId)
    } catch (error) {
      console.error('Erro ao remover imagem:', error)
    }
  }

  const cliente = clientes?.find(c => c.id.toString() === ordem?.client_id?.toString())

  if (!ordemId) return null

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando ordem de serviço...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !ordem) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <div className="flex items-center justify-center p-8 text-red-600">
            <XCircle className="h-8 w-8 mr-2" />
            <span>Erro ao carregar ordem de serviço</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              OS #{ordem.id}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <select 
                value={ordem.status} 
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
                disabled={mudarStatusComHistorico.isPending}
              >
                <option value="budget">Orçamento</option>
                <option value="approved">Aprovado</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Pronto</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="imagens">
              Imagens ({imagens?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="historico">
              Histórico ({historico?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          {/* ABA DETALHES */}
          <TabsContent value="detalhes" className="space-y-6">
            {/* Cabeçalho com informações gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(ordem.status)}>
                    {getStatusLabel(ordem.status)}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Data de Criação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    {new Date(ordem.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-green-600">
                    R$ {ordem.total_price?.toFixed(2)?.replace('.', ',') || '0,00'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações do Cliente */}
            {cliente && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {cliente.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{cliente.nome}</p>
                          <p className="text-sm text-gray-500">{cliente.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {cliente.telefone}
                      </div>
                      {cliente.endereco && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {cliente.endereco}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados do Serviço */}
            <Card>
              <CardHeader>
                <CardTitle>Dados do Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Descrição do Serviço</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                    {ordem.description || 'Não informado'}
                  </div>
                </div>

                {ordem.notes && (
                  <div>
                    <label className="text-sm font-medium">Observações</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                      {ordem.notes}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Data de Entrega</label>
                    <div className="mt-1 text-sm">
                      {ordem.delivery_date 
                        ? new Date(ordem.delivery_date).toLocaleDateString('pt-BR')
                        : 'Não definida'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Status Pagamento</label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {ordem.payment_status || 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {ordem.urgent && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center text-red-800">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">Serviço Urgente</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA IMAGENS */}
          <TabsContent value="imagens" className="space-y-4">
            {imagens && imagens.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagens.map((imagem) => (
                  <div key={imagem.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={imagem.image_url}
                        alt={imagem.image_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveImage(imagem.id!)}
                        disabled={removerImagem.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 truncate">
                      {imagem.image_name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma imagem anexada</p>
              </div>
            )}
          </TabsContent>

          {/* ABA HISTÓRICO */}
          <TabsContent value="historico" className="space-y-4">
            {historico && historico.length > 0 ? (
              <div className="space-y-3">
                {historico.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <History className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{entry.status_change}</p>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.timestamp).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum histórico disponível</p>
              </div>
            )}
          </TabsContent>

          {/* ABA UPLOAD */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload de Imagens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Clique para selecionar imagens</span>
                    <span className="text-xs text-gray-500">PNG, JPG até 5MB cada</span>
                  </label>
                </div>

                {selectedImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Imagens selecionadas ({selectedImages.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleUploadImages}
                      disabled={uploadImagens.isPending}
                      className="mt-4"
                    >
                      {uploadImagens.isPending ? 'Enviando...' : `Enviar ${selectedImages.length} imagem(ns)`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 