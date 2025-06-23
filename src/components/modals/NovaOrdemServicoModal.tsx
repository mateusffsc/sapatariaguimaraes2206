import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { 
  FileText, 
  User, 
  Package, 
  Camera, 
  Plus, 
  Trash2, 
  Calculator,
  Calendar,
  CreditCard,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useClientes } from '../../hooks/useClientes';
import { useServices } from '../../hooks/useServices';
import { useCriarOrdemServicoNew } from '../../hooks/useOrdensServicoNew';
import { toast } from 'sonner';
import { ClienteInlineForm } from './ClienteInlineForm';

interface NovaOrdemServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'budget', label: 'Orçamento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-purple-100 text-purple-800' },
];

const TIPOS_ARTIGO = [
  'Sapato Social',
  'Tênis',
  'Sandália',
  'Bota',
  'Sapatilha',
  'Chinelo',
  'Sapato Casual',
  'Scarpin',
  'Outros'
];

const MARCAS_POPULARES = [
  'Nike',
  'Adidas',
  'Melissa',
  'Havaianas',
  'Vizzano',
  'Beira Rio',
  'Moleca',
  'Grendha',
  'Azaleia',
  'Outros'
];

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão de Débito',
  'Cartão de Crédito',
  'Transferência',
  'Fiado'
];

interface Servico {
  id: string;
  servico_id: number | string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  detalhes: string;
}

interface NovoCliente {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
}

interface Parcela {
  numero: number;
  valor: number;
  vencimento: string;
  forma_pagamento: string;
}

export function NovaOrdemServicoModal({ isOpen, onClose }: NovaOrdemServicoModalProps) {
  // Estados do Cliente
  const [clienteId, setClienteId] = useState<string>('');
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState<NovoCliente>({
    nome: '',
    telefone: '',
    email: '',
    endereco: ''
  });

  // Estados das Informações do Artigo
  const [tipoArtigo, setTipoArtigo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [tamanho, setTamanho] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [descricaoArtigo, setDescricaoArtigo] = useState('');
  
  // Estados das Fotos
  const [fotos, setFotos] = useState<File[]>([]);

  // Estados dos Serviços
  const [servicos, setServicos] = useState<Servico[]>([
    { id: '1', servico_id: '', quantidade: 1, valor_unitario: 0, subtotal: 0, detalhes: '' }
  ]);

  // Estados de Valores e Pagamento
  const [dataEntrega, setDataEntrega] = useState('');
  const [tiposPagamento, setTiposPagamento] = useState<'normal' | 'parcelado'>('normal');
  
  // Pagamento Normal
  const [valorEntrada, setValorEntrada] = useState<number>(0);
  const [formaPagamentoEntrada, setFormaPagamentoEntrada] = useState('');
  const [formaPagamentoRestante, setFormaPagamentoRestante] = useState('');

  // Pagamento Parcelado
  const [numeroParcelas, setNumeroParcelas] = useState<number>(2);
  const [taxaJuros, setTaxaJuros] = useState<number>(0);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);

  const [status, setStatus] = useState('budget');

  // Estados Gerais
  const [observacoes, setObservacoes] = useState('');

  const { data: clientes, refetch: refetchClientes } = useClientes();
  const { data: servicosCadastrados } = useServices();
  const criarOrdem = useCriarOrdemServicoNew();

  // Cálculos
  const valorTotalServicos = servicos.reduce((total, servico) => total + servico.subtotal, 0);
  const valorRestante = Math.max(0, valorTotalServicos - valorEntrada);

  const resetForm = () => {
    setClienteId('');
    setMostrarNovoCliente(false);
    setNovoCliente({ nome: '', telefone: '', email: '', endereco: '' });
    setTipoArtigo('');
    setMarca('');
    setModelo('');
    setCor('');
    setTamanho('');
    setNumeroSerie('');
    setDescricaoArtigo('');
    setFotos([]);
    setServicos([{ id: '1', servico_id: '', quantidade: 1, valor_unitario: 0, subtotal: 0, detalhes: '' }]);
    setDataEntrega('');
    setTiposPagamento('normal');
    setValorEntrada(0);
    setFormaPagamentoEntrada('');
    setFormaPagamentoRestante('');
    setNumeroParcelas(2);
    setTaxaJuros(0);
    setParcelas([]);
    setStatus('budget');
    setObservacoes('');
  };

  const adicionarServico = () => {
    const novoId = (servicos.length + 1).toString();
    setServicos([...servicos, { 
      id: novoId, 
      servico_id: '', 
      quantidade: 1, 
      valor_unitario: 0, 
      subtotal: 0, 
      detalhes: '' 
    }]);
  };

  const removerServico = (id: string) => {
    if (servicos.length > 1) {
      setServicos(servicos.filter(s => s.id !== id));
    }
  };

  const atualizarServico = (id: string, campo: keyof Servico, valor: any) => {
    setServicos(servicos.map(s => {
      if (s.id === id) {
        const servicoAtualizado = { ...s, [campo]: valor };
        
        // Recalcular subtotal quando quantidade ou valor unitário mudar
        if (campo === 'quantidade' || campo === 'valor_unitario') {
          servicoAtualizado.subtotal = servicoAtualizado.quantidade * servicoAtualizado.valor_unitario;
        }
        
        // Atualizar valor unitário quando serviço for selecionado
        if (campo === 'servico_id' && valor) {
          const servicoSelecionado = servicosCadastrados?.find(sc => sc.id === valor);
          if (servicoSelecionado) {
            servicoAtualizado.valor_unitario = servicoSelecionado.price;
            servicoAtualizado.subtotal = servicoAtualizado.quantidade * servicoSelecionado.price;
          }
        }
        
        return servicoAtualizado;
      }
      return s;
    }));
  };

  const calcularParcelas = () => {
    if (numeroParcelas < 1) return;
    
    const valorComJuros = valorTotalServicos * (1 + taxaJuros / 100);
    const valorParcela = valorComJuros / numeroParcelas;
    const hoje = new Date();
    
    const novasParcelas: Parcela[] = [];
    for (let i = 0; i < numeroParcelas; i++) {
      const dataVencimento = new Date(hoje);
      dataVencimento.setMonth(hoje.getMonth() + i + 1);
      
      novasParcelas.push({
        numero: i + 1,
        valor: valorParcela,
        vencimento: dataVencimento.toISOString().split('T')[0],
        forma_pagamento: ''
      });
    }
    
    setParcelas(novasParcelas);
  };

  const atualizarParcela = (index: number, campo: keyof Parcela, valor: any) => {
    setParcelas(parcelas.map((p, i) => 
      i === index ? { ...p, [campo]: valor } : p
    ));
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fotos.length + files.length <= 10) {
      setFotos([...fotos, ...files]);
    } else {
      toast.error('Máximo de 10 fotos permitidas');
    }
  };

  const removerFoto = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  const handleClienteCriado = async (novoClienteData: any) => {
    // Atualizar lista de clientes
    await refetchClientes();
    
    // Selecionar o novo cliente
    setClienteId(novoClienteData.id.toString());
    
    // Ocultar formulário de novo cliente
    setMostrarNovoCliente(false);
    
    toast.success('Cliente criado e selecionado com sucesso!');
  };

  const handleCancelarNovoCliente = () => {
    setMostrarNovoCliente(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!clienteId) {
      toast.error('Selecione um cliente');
      return;
    }

    if (!tipoArtigo) {
      toast.error('Informe o tipo do artigo');
      return;
    }
    if (!dataEntrega) {
      toast.error('Informe a data de entrega');
      return;
    }
    if (servicos.some(s => !s.servico_id)) {
      toast.error('Selecione todos os serviços');
      return;
    }

    if (tiposPagamento === 'parcelado' && parcelas.some(p => !p.forma_pagamento)) {
      toast.error('Defina a forma de pagamento de todas as parcelas');
      return;
    }

    // Preparar dados da ordem
    const servicosDetalhados = servicos.map(s => {
      const servicoCadastrado = servicosCadastrados?.find(sc => sc.id === s.servico_id);
      return `- ${servicoCadastrado?.name || 'Serviço'} (${s.quantidade}x R$ ${s.valor_unitario.toFixed(2)} = R$ ${s.subtotal.toFixed(2)})${s.detalhes ? ` - ${s.detalhes}` : ''}`;
    }).join('\n');

    const descricaoCompleta = `
ARTIGO: ${tipoArtigo}${marca ? ` - ${marca}` : ''}${modelo ? ` ${modelo}` : ''}
COR: ${cor || 'Não informado'}
TAMANHO: ${tamanho || 'Não informado'}
${numeroSerie ? `SÉRIE: ${numeroSerie}` : ''}
${descricaoArtigo ? `DESCRIÇÃO: ${descricaoArtigo}` : ''}

SERVIÇOS:
${servicosDetalhados}

${tiposPagamento === 'parcelado' ? `
PARCELAMENTO:
${parcelas.map(p => `Parcela ${p.numero}: R$ ${p.valor.toFixed(2)} - Venc: ${p.vencimento} - ${p.forma_pagamento}`).join('\n')}
Taxa de Juros: ${taxaJuros}%
` : ''}
    `.trim();

    const artigoCompleto = `${tipoArtigo}${marca ? ` - ${marca}` : ''}${modelo ? ` ${modelo}` : ''}`;

    const novaOrdem = {
      cliente_id: clienteId,
      numero: '', // Será gerado automaticamente
      artigo: artigoCompleto,
      descricao: descricaoCompleta,
      valor_total: valorTotalServicos,
      valor_entrada: tiposPagamento === 'normal' ? valorEntrada : parcelas[0]?.valor || 0,
      valor_restante: tiposPagamento === 'normal' ? valorRestante : valorTotalServicos - (parcelas[0]?.valor || 0),
      status: status as any,
      data_entrada: new Date().toISOString(),
      data_entrega_prevista: dataEntrega ? new Date(dataEntrega).toISOString() : undefined,
      observacoes: observacoes,
      tecnico_id: '', // Será atribuído posteriormente
    };

    try {
      await criarOrdem.mutateAsync(novaOrdem);
      resetForm();
      onClose();
      toast.success('Ordem de serviço criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const clienteSelecionado = clientes?.find(c => c.id.toString() === clienteId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nova Ordem de Serviço
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção/Criação do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mostrarNovoCliente ? (
                <ClienteInlineForm
                  onClienteCreated={handleClienteCriado}
                  onCancel={handleCancelarNovoCliente}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cliente">Cliente *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarNovoCliente(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Novo Cliente
                    </Button>
                  </div>
                            <div className="space-y-2">
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes?.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{cliente.nome}</div>
                                <div className="text-sm text-gray-500">{cliente.telefone}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {clienteSelecionado && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{clienteSelecionado.nome}</span>
                          <span className="text-gray-500">•</span>
                          <span>{clienteSelecionado.telefone}</span>
                          {clienteSelecionado.email && (
                            <>
                              <span className="text-gray-500">•</span>
                              <span>{clienteSelecionado.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Informações do Artigo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Informações do Artigo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                  <Label htmlFor="tipoArtigo">Tipo do Artigo *</Label>
                  <Select value={tipoArtigo} onValueChange={setTipoArtigo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ex: Sapato social, Tênis..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ARTIGO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>

            <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Select value={marca} onValueChange={setMarca}>
                <SelectTrigger>
                      <SelectValue placeholder="Ex: Nike, Adidas, Melissa..." />
                </SelectTrigger>
                <SelectContent>
                      {MARCAS_POPULARES.map((marca) => (
                        <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Ex: Air Max, Ultraboost..."
                  />
                </div>

          <div className="space-y-2">
                  <Label htmlFor="cor">Cor</Label>
                  <Input
                    id="cor"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    placeholder="Ex: Preto, Branco, Marrom..."
            />
          </div>

                <div className="space-y-2">
                  <Label htmlFor="tamanho">Tamanho</Label>
                  <Input
                    id="tamanho"
                    value={tamanho}
                    onChange={(e) => setTamanho(e.target.value)}
                    placeholder="Ex: 37, 42, M, G..."
                  />
                </div>
              </div>

          <div className="space-y-2">
                <Label htmlFor="numeroSerie">Número de Série</Label>
                <Input
                  id="numeroSerie"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  placeholder="Número de identificação do produto"
            />
          </div>

              <div className="space-y-2">
                <Label htmlFor="descricaoArtigo">Descrição Detalhada do Artigo</Label>
                <Textarea
                  id="descricaoArtigo"
                  value={descricaoArtigo}
                  onChange={(e) => setDescricaoArtigo(e.target.value)}
                  placeholder="Descreva detalhes importantes do artigo..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fotos do Serviço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5" />
                Fotos do Serviço ({fotos.length}/10)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {fotos.length === 0 ? 'Nenhuma foto adicionada' : `${fotos.length} foto(s) adicionada(s)`}
                </p>
                <input
                  type="file"
                  id="fotos"
                  multiple
                  accept="image/*"
                  onChange={handleFotoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('fotos')?.click()}
                  disabled={fotos.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Fotos
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Adicione até 10 fotos do serviço
                </p>
              </div>

              {fotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fotos.map((foto, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(foto)}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removerFoto(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Serviços */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Serviços
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {servicos.map((servico, index) => (
                <div key={servico.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Serviço {index + 1}</h4>
                    {servicos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerServico(servico.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                      <Label>Serviço *</Label>
                      <Select 
                        value={servico.servico_id?.toString() || ''} 
                        onValueChange={(value) => atualizarServico(servico.id, 'servico_id', Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicosCadastrados?.map((servicoCadastrado) => (
                            <SelectItem key={servicoCadastrado.id} value={servicoCadastrado.id.toString()}>
                              <div>
                                <div className="font-medium">{servicoCadastrado.name}</div>
                                <div className="text-sm text-gray-500">R$ {servicoCadastrado.price.toFixed(2)}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={servico.quantidade || ''}
                        onChange={(e) => atualizarServico(servico.id, 'quantidade', Number(e.target.value))}
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Valor Unit. (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                        value={servico.valor_unitario || ''}
                        onChange={(e) => atualizarServico(servico.id, 'valor_unitario', Number(e.target.value))}
                placeholder="0,00"
              />
            </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subtotal</Label>
                      <div className="text-lg font-semibold text-green-600">
                        R$ {servico.subtotal.toFixed(2)}
                      </div>
                    </div>

            <div className="space-y-2">
                      <Label>Detalhes Específicos</Label>
                      <Textarea
                        value={servico.detalhes}
                        onChange={(e) => atualizarServico(servico.id, 'detalhes', e.target.value)}
                        placeholder="Detalhes específicos deste serviço..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={adicionarServico}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </CardContent>
          </Card>

          {/* Valores e Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Valores e Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataEntrega">Data de Entrega *</Label>
              <Input
                id="dataEntrega"
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
                  <Label>Valor Total</Label>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {valorTotalServicos.toFixed(2)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tipo de Pagamento */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label>Tipo de Pagamento:</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="normal"
                      name="tipoPagamento"
                      checked={tiposPagamento === 'normal'}
                      onChange={() => setTiposPagamento('normal')}
                    />
                    <Label htmlFor="normal">Normal (Entrada + Restante)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="parcelado"
                      name="tipoPagamento"
                      checked={tiposPagamento === 'parcelado'}
                      onChange={() => setTiposPagamento('parcelado')}
                    />
                    <Label htmlFor="parcelado">Parcelado</Label>
                  </div>
                </div>

                {tiposPagamento === 'normal' ? (
                  // Pagamento Normal
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valorEntrada">Valor de Entrada (R$)</Label>
                        <Input
                          id="valorEntrada"
                          type="number"
                          step="0.01"
                          min="0"
                          max={valorTotalServicos}
                          value={valorEntrada || ''}
                          onChange={(e) => setValorEntrada(Number(e.target.value))}
                          placeholder="0,00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="formaPagamentoEntrada">Forma Pag. Entrada</Label>
                        <Select value={formaPagamentoEntrada} onValueChange={setFormaPagamentoEntrada}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {FORMAS_PAGAMENTO.map((forma) => (
                              <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valor Restante</Label>
                        <div className="text-xl font-semibold text-orange-600">
                          R$ {valorRestante.toFixed(2)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="formaPagamentoRestante">Forma Pag. Restante</Label>
                        <Select value={formaPagamentoRestante} onValueChange={setFormaPagamentoRestante}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {FORMAS_PAGAMENTO.map((forma) => (
                              <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : (
                  // Pagamento Parcelado
                  <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
                    <h4 className="font-medium text-orange-800">Configuração do Parcelamento</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Número de Parcelas</Label>
                        <Input
                          type="number"
                          min="2"
                          max="12"
                          value={numeroParcelas}
                          onChange={(e) => setNumeroParcelas(Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Taxa de Juros (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={taxaJuros}
                          onChange={(e) => setTaxaJuros(Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Button
                          type="button"
                          onClick={calcularParcelas}
                          className="w-full"
                        >
                          Calcular Parcelas
                        </Button>
                      </div>
                    </div>

                    {parcelas.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-medium">Parcelas:</h5>
                        {parcelas.map((parcela, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 border rounded bg-white">
                            <div className="space-y-1">
                              <Label className="text-sm">Parcela {parcela.numero}</Label>
                              <div className="font-medium">R$ {parcela.valor.toFixed(2)}</div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm">Vencimento</Label>
                              <Input
                                type="date"
                                value={parcela.vencimento}
                                onChange={(e) => atualizarParcela(index, 'vencimento', e.target.value)}
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Forma Pagamento</Label>
                              <Select 
                                value={parcela.forma_pagamento} 
                                onValueChange={(value) => atualizarParcela(index, 'forma_pagamento', value)}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {FORMAS_PAGAMENTO.map((forma) => (
                                    <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                                                         <div className="space-y-2">
                               <Label className="text-sm">Valor</Label>
                               <Input
                                 type="number"
                                 step="0.01"
                                 value={parcela.valor || ''}
                                 onChange={(e) => atualizarParcela(index, 'valor', Number(e.target.value))}
                                 className="text-sm"
                               />
                             </div>
                          </div>
                        ))}
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            Total com Juros: R$ {parcelas.reduce((total, p) => total + p.valor, 0).toFixed(2)}
                          </div>
                          {taxaJuros > 0 && (
                            <div className="text-sm text-gray-600">
                              Valor Original: R$ {valorTotalServicos.toFixed(2)} | 
                              Juros: R$ {(parcelas.reduce((total, p) => total + p.valor, 0) - valorTotalServicos).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status da OS</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((statusOption) => (
                    <SelectItem key={statusOption.value} value={statusOption.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={statusOption.color}>
                          {statusOption.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
          <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Adicionais</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais sobre a ordem de serviço..."
                  rows={3}
            />
          </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criarOrdem.isPending}>
              {criarOrdem.isPending ? 'Criando...' : 'Criar Ordem de Serviço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 