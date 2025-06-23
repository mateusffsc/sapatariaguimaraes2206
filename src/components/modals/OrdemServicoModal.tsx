import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { CalendarDays, User, MapPin, Phone, Loader2, XCircle, Edit, Eye, History, Image, Upload, Trash2 } from 'lucide-react'
import { useObterOrdemServico, useAtualizarOrdemServico, useMudarStatusOS } from '../../hooks/useServiceOrders'
import { useClientes } from '../../hooks/useClientes'
import { useMudarStatusComHistorico, useHistoricoOS } from '../../hooks/useServiceOrderHistory'
import { useImagensOS, useUploadMultiplasImagens, useRemoverImagem } from '../../hooks/useImageUpload'
import { toast } from 'sonner'

interface OrdemServicoModalProps {
  isOpen: boolean
  onClose: () => void
  ordemId: number | null
  modo: 'visualizar' | 'editar'
}

export const OrdemServicoModal: React.FC<OrdemServicoModalProps> = ({
  isOpen,
  onClose,
  ordemId,
  modo: modoInicial
}) => {
  const [modoAtual, setModoAtual] = useState(modoInicial)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const { data: ordem, isLoading, error, refetch } = useObterOrdemServico(ordemId!)
  const { data: clientes } = useClientes()
  const { data: historico } = useHistoricoOS(ordemId!)
  const { data: imagens } = useImagensOS(ordemId!)
  
  const atualizarOS = useAtualizarOrdemServico()
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
      
      // Recarregar dados
      await refetch()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
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

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {modoAtual === 'visualizar' ? <Eye className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              OS #{ordem.numeroOS}
            </span>
            <div className="flex gap-2">
              {modoAtual === 'visualizar' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModoAtual('editar')}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Select value={ordem.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Orçamento</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Pronto</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              {modoAtual === 'editar' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModoAtual('visualizar')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                <CardTitle className="text-sm font-medium">Data de Entrada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  {new Date(ordem.dataEntrada).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-green-600">
                  R$ {ordem.valorTotal?.toFixed(2)?.replace('.', ',') || '0,00'}
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
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {cliente.endereco}
                    </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Artigo</Label>
                  <div className="mt-1 text-sm font-medium">
                    {ordem.artigo}
                  </div>
                </div>
                
                <div>
                  <Label>Técnico Responsável</Label>
                  <div className="mt-1 text-sm">
                    {ordem.tecnicoResponsavel || 'Não atribuído'}
                  </div>
                </div>
              </div>

              <div>
                <Label>Descrição do Serviço</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                  {ordem.descricaoServico || 'Não informado'}
                </div>
              </div>

              <div>
                <Label>Defeito Identificado</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                  {ordem.defeito || 'Não informado'}
                </div>
              </div>

              {ordem.observacoes && (
                <div>
                  <Label>Observações</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                    {ordem.observacoes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valores e Prazos */}
          <Card>
            <CardHeader>
              <CardTitle>Valores e Prazos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Valor do Orçamento</Label>
                  <div className="mt-1 text-lg font-semibold text-blue-600">
                    R$ {ordem.valorOrcamento?.toFixed(2)?.replace('.', ',') || '0,00'}
                  </div>
                </div>

                <div>
                  <Label>Valor Total</Label>
                  <div className="mt-1 text-lg font-semibold text-green-600">
                    R$ {ordem.valorTotal?.toFixed(2)?.replace('.', ',') || '0,00'}
                  </div>
                </div>

                <div>
                  <Label>Data de Entrega</Label>
                  <div className="mt-1 text-sm">
                    {ordem.dataEntrega 
                      ? new Date(ordem.dataEntrega).toLocaleDateString('pt-BR')
                      : 'Não definida'
                    }
                  </div>
                </div>
              </div>

              {ordem.servicoUrgente && (
                <div className="mt-4">
                  <Badge variant="destructive">
                    Serviço Urgente
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}