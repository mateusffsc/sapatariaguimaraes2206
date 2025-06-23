import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Phone, Mail, MapPin, AlertCircle, CheckCircle, FileText, Map } from 'lucide-react';
import { toast } from 'sonner';
import { ClienteServiceNew } from '@/services/clienteServiceNew';
import { useCriarCliente } from '@/hooks/useClientesNew';
import type { Cliente } from '@/lib/supabase';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente | null; // Para modo edição
  mode?: 'create' | 'edit';
}

interface FormData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface FormErrors {
  nome?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  geral?: string;
}

interface ValidationState {
  telefone: 'idle' | 'checking' | 'valid' | 'invalid';
  email: 'idle' | 'checking' | 'valid' | 'invalid';
  cpf: 'idle' | 'checking' | 'valid' | 'invalid';
  cep: 'idle' | 'loading' | 'valid' | 'invalid';
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({
  isOpen,
  onClose,
  cliente,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [validation, setValidation] = useState<ValidationState>({
    telefone: 'idle',
    email: 'idle',
    cpf: 'idle',
    cep: 'idle'
  });

  const criarClienteMutation = useCriarCliente();

  // Resetar form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (cliente && mode === 'edit') {
        // Parse do endereço para separar os campos
        const enderecoAtual = cliente.endereco || '';
        const partesEndereco = enderecoAtual.split(',');
        let rua = '', numero = '', complemento = '', bairro = '', cidade = '', estado = '';
        
        if (partesEndereco.length >= 1) rua = partesEndereco[0]?.trim() || '';
        if (partesEndereco.length >= 2) numero = partesEndereco[1]?.trim() || '';
        if (partesEndereco.length >= 3) complemento = partesEndereco[2]?.trim() || '';
        if (partesEndereco.length >= 4) bairro = partesEndereco[3]?.trim() || '';
        if (partesEndereco.length >= 5) cidade = partesEndereco[4]?.trim() || '';
        if (partesEndereco.length >= 6) estado = partesEndereco[5]?.trim() || '';

        setFormData({
          nome: cliente.nome,
          cpf: cliente.cpf,
          telefone: cliente.telefone,
          email: cliente.email || '',
          cep: cliente.cep || '',
          rua,
          numero,
          complemento,
          bairro,
          cidade: cliente.cidade || cidade,
          estado
        });
      } else {
        setFormData({
          nome: '',
          cpf: '',
          telefone: '',
          email: '',
          cep: '',
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: ''
        });
      }
      setErrors({});
      setValidation({ telefone: 'idle', email: 'idle', cpf: 'idle', cep: 'idle' });
    }
  }, [isOpen, cliente, mode]);

  // Função para consultar CEP no ViaCEP
  const consultarCep = async (cep: string) => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      setValidation(prev => ({ ...prev, cep: 'idle' }));
      return;
    }

    setValidation(prev => ({ ...prev, cep: 'loading' }));
    
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        setValidation(prev => ({ ...prev, cep: 'invalid' }));
        setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
        return;
      }

      // Preencher campos automaticamente
      setFormData(prev => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
        complemento: data.complemento || prev.complemento
      }));

      setValidation(prev => ({ ...prev, cep: 'valid' }));
      setErrors(prev => ({ ...prev, cep: undefined }));
      
      toast.success('Endereço preenchido automaticamente!');
    } catch (error) {
      console.error('Erro ao consultar CEP:', error);
      setValidation(prev => ({ ...prev, cep: 'invalid' }));
      setErrors(prev => ({ ...prev, cep: 'Erro ao consultar CEP' }));
    }
  };

  // Validação de campos únicos com debounce
  useEffect(() => {
    const validateTelefone = async () => {
      if (!formData.telefone || formData.telefone.length < 10) {
        setValidation(prev => ({ ...prev, telefone: 'idle' }));
        return;
      }

      setValidation(prev => ({ ...prev, telefone: 'checking' }));

      try {
        const isUnique = await ClienteServiceNew.verificarTelefoneUnico(
          formData.telefone, 
          mode === 'edit' ? cliente?.id : undefined
        );
        
        setValidation(prev => ({ ...prev, telefone: isUnique ? 'valid' : 'invalid' }));
        
        if (!isUnique) {
          setErrors(prev => ({ ...prev, telefone: 'Este telefone já está cadastrado' }));
        } else {
          setErrors(prev => ({ ...prev, telefone: undefined }));
        }
      } catch (error) {
        setValidation(prev => ({ ...prev, telefone: 'idle' }));
      }
    };

    const validateEmail = async () => {
      if (!formData.email) {
        setValidation(prev => ({ ...prev, email: 'idle' }));
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setValidation(prev => ({ ...prev, email: 'invalid' }));
        setErrors(prev => ({ ...prev, email: 'Email inválido' }));
        return;
      }

      setValidation(prev => ({ ...prev, email: 'checking' }));

      try {
        const isUnique = await ClienteServiceNew.verificarEmailUnico(
          formData.email,
          mode === 'edit' ? cliente?.id : undefined
        );
        
        setValidation(prev => ({ ...prev, email: isUnique ? 'valid' : 'invalid' }));
        
        if (!isUnique) {
          setErrors(prev => ({ ...prev, email: 'Este email já está cadastrado' }));
        } else {
          setErrors(prev => ({ ...prev, email: undefined }));
        }
      } catch (error) {
        setValidation(prev => ({ ...prev, email: 'idle' }));
      }
    };

    const validateCpf = async () => {
      if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
        setValidation(prev => ({ ...prev, cpf: 'idle' }));
        return;
      }

      // Validar CPF
      const cpfNumeros = formData.cpf.replace(/\D/g, '');
      if (!validarCpf(cpfNumeros)) {
        setValidation(prev => ({ ...prev, cpf: 'invalid' }));
        setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
        return;
      }

      setValidation(prev => ({ ...prev, cpf: 'checking' }));

      try {
        const isUnique = await ClienteServiceNew.verificarCpfUnico(
          cpfNumeros,
          mode === 'edit' ? cliente?.id : undefined
        );
        
        setValidation(prev => ({ ...prev, cpf: isUnique ? 'valid' : 'invalid' }));
        
        if (!isUnique) {
          setErrors(prev => ({ ...prev, cpf: 'Este CPF já está cadastrado' }));
        } else {
          setErrors(prev => ({ ...prev, cpf: undefined }));
        }
      } catch (error) {
        setValidation(prev => ({ ...prev, cpf: 'idle' }));
      }
    };

    const timeoutTelefone = setTimeout(validateTelefone, 500);
    const timeoutEmail = setTimeout(validateEmail, 500);
    const timeoutCpf = setTimeout(validateCpf, 500);

    return () => {
      clearTimeout(timeoutTelefone);
      clearTimeout(timeoutEmail);
      clearTimeout(timeoutCpf);
    };
  }, [formData.telefone, formData.email, formData.cpf, cliente?.id, mode]);

  // Consultar CEP com debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (formData.cep && formData.cep.replace(/\D/g, '').length === 8) {
        consultarCep(formData.cep);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [formData.cep]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro específico do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatarTelefone = (telefone: string): string => {
    // Remove todos os caracteres não numéricos
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    // Aplica formatação baseada no tamanho
    if (apenasNumeros.length <= 10) {
      // Telefone fixo: (11) 1234-5678
      return apenasNumeros
        .replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
        .replace(/(-$)/, '');
    } else {
      // Celular: (11) 91234-5678
      return apenasNumeros
        .replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
        .replace(/(-$)/, '');
    }
  };

  const formatarCpf = (cpf: string): string => {
    const apenasNumeros = cpf.replace(/\D/g, '');
    return apenasNumeros.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/(-$)/, '');
  };

  const formatarCep = (cep: string): string => {
    const apenasNumeros = cep.replace(/\D/g, '');
    return apenasNumeros.replace(/^(\d{5})(\d{0,3})/, '$1-$2').replace(/(-$)/, '');
  };

  const validarCpf = (cpf: string): boolean => {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.charAt(10));
  };

  const handleTelefoneChange = (value: string) => {
    const formatted = formatarTelefone(value);
    handleInputChange('telefone', formatted);
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatarCpf(value);
    handleInputChange('cpf', formatted);
  };

  const handleCepChange = (value: string) => {
    const formatted = formatarCep(value);
    handleInputChange('cep', formatted);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    } else if (!validarCpf(formData.cpf.replace(/\D/g, ''))) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else if (formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone deve ter pelo menos 10 dígitos';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.cep && formData.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP deve ter 8 dígitos';
    }

    // Verificar validações assíncronas
    if (validation.telefone === 'invalid') {
      newErrors.telefone = 'Este telefone já está cadastrado';
    }

    if (validation.email === 'invalid') {
      newErrors.email = 'Este email já está cadastrado';
    }

    if (validation.cpf === 'invalid') {
      newErrors.cpf = 'Este CPF já está cadastrado ou é inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Aguardar validações assíncronas se estiverem em andamento
    if (validation.telefone === 'checking' || validation.email === 'checking' || validation.cpf === 'checking') {
      toast.error('Aguarde a validação dos dados...');
      return;
    }

    try {
      // Montar endereço completo
      const endereco = [
        formData.rua,
        formData.numero,
        formData.complemento,
        formData.bairro,
        formData.cidade,
        formData.estado
      ].filter(Boolean).join(', ');

      const clienteData = {
        nome: formData.nome.trim(),
        cpf: formData.cpf.replace(/\D/g, ''),
        telefone: formData.telefone.trim(),
        email: formData.email.trim() || undefined,
        cep: formData.cep.replace(/\D/g, '') || undefined,
        endereco: endereco || undefined,
        cidade: formData.cidade.trim() || undefined,
        status: 'ativo' as const
      };

      if (mode === 'create') {
        await criarClienteMutation.mutateAsync(clienteData);
        toast.success('Cliente cadastrado com sucesso!');
      } else {
        // TODO: Implementar edição quando necessário
        toast.info('Edição será implementada em breve');
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente. Tente novamente.');
    }
  };

  const getFieldIcon = (field: keyof ValidationState) => {
    const state = validation[field];
    let baseIcon;
    
    switch (field) {
      case 'telefone':
        baseIcon = Phone;
        break;
      case 'email':
        baseIcon = Mail;
        break;
      case 'cpf':
        baseIcon = FileText;
        break;
      case 'cep':
        baseIcon = Map;
        break;
      default:
        baseIcon = AlertCircle;
    }
    
    switch (state) {
      case 'checking':
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return React.createElement(baseIcon, { className: "h-4 w-4 text-gray-400" });
    }
  };

  const isLoading = criarClienteMutation.isPending;
  const canSubmit = !isLoading && 
    validation.telefone !== 'checking' && 
    validation.email !== 'checking' &&
    validation.cpf !== 'checking' &&
    validation.cep !== 'loading' &&
    validation.telefone !== 'invalid' &&
    validation.email !== 'invalid' &&
    validation.cpf !== 'invalid';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Nome completo do cliente"
                  className={errors.nome ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.nome && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.nome}
                  </p>
                )}
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <div className="relative">
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    className={`pr-10 ${errors.cpf ? 'border-red-500' : 
                      validation.cpf === 'valid' ? 'border-green-500' : ''}`}
                    disabled={isLoading}
                    maxLength={14}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {getFieldIcon('cpf')}
                  </div>
                </div>
                {errors.cpf && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cpf}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <div className="relative">
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className={`pr-10 ${errors.telefone ? 'border-red-500' : 
                      validation.telefone === 'valid' ? 'border-green-500' : ''}`}
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {getFieldIcon('telefone')}
                  </div>
                </div>
                {errors.telefone && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.telefone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="cliente@email.com"
                    className={`pr-10 ${errors.email ? 'border-red-500' : 
                      validation.email === 'valid' ? 'border-green-500' : ''}`}
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {getFieldIcon('email')}
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </h3>

            {/* CEP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className={`pr-10 ${errors.cep ? 'border-red-500' : 
                      validation.cep === 'valid' ? 'border-green-500' : ''}`}
                    disabled={isLoading}
                    maxLength={9}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {getFieldIcon('cep')}
                  </div>
                </div>
                {errors.cep && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cep}
                  </p>
                )}
                {validation.cep === 'loading' && (
                  <p className="text-sm text-blue-500">Buscando endereço...</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rua */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="rua">Rua</Label>
                <Input
                  id="rua"
                  value={formData.rua}
                  onChange={(e) => handleInputChange('rua', e.target.value)}
                  placeholder="Nome da rua"
                  disabled={isLoading}
                />
              </div>

              {/* Número */}
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  placeholder="123"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Complemento */}
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  placeholder="Apto, Bloco, etc."
                  disabled={isLoading}
                />
              </div>

              {/* Bairro */}
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  placeholder="Nome do bairro"
                  disabled={isLoading}
                />
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  placeholder="Nome da cidade"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  placeholder="UF"
                  disabled={isLoading}
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Erro geral */}
          {errors.geral && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.geral}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                mode === 'create' ? 'Cadastrar' : 'Atualizar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};