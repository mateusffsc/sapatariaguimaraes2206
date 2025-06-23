import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Phone, Mail, MapPin, AlertCircle, CheckCircle, FileText, Map, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ClienteServiceNew } from '@/services/clienteServiceNew';
import { useCriarCliente } from '@/hooks/useClientesNew';

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

interface ClienteInlineFormProps {
  onClienteCreated: (cliente: any) => void;
  onCancel: () => void;
}

export const ClienteInlineForm: React.FC<ClienteInlineFormProps> = ({
  onClienteCreated,
  onCancel
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
        const isUnique = await ClienteServiceNew.verificarTelefoneUnico(formData.telefone);
        setValidation(prev => ({ ...prev, telefone: isUnique ? 'valid' : 'invalid' }));
        
        if (!isUnique) {
          setErrors(prev => ({ ...prev, telefone: 'Este telefone já está cadastrado' }));
        } else {
          setErrors(prev => ({ ...prev, telefone: undefined }));
        }
      } catch (error) {
        console.error('Erro ao validar telefone:', error);
        setValidation(prev => ({ ...prev, telefone: 'idle' }));
      }
    };

    const timer = setTimeout(validateTelefone, 500);
    return () => clearTimeout(timer);
  }, [formData.telefone]);

  useEffect(() => {
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
        const isUnique = await ClienteServiceNew.verificarEmailUnico(formData.email);
        setValidation(prev => ({ ...prev, email: isUnique ? 'valid' : 'invalid' }));
        
        if (!isUnique) {
          setErrors(prev => ({ ...prev, email: 'Este email já está cadastrado' }));
        } else {
          setErrors(prev => ({ ...prev, email: undefined }));
        }
      } catch (error) {
        console.error('Erro ao validar email:', error);
        setValidation(prev => ({ ...prev, email: 'idle' }));
      }
    };

    const timer = setTimeout(validateEmail, 500);
    return () => clearTimeout(timer);
  }, [formData.email]);

  useEffect(() => {
    const validateCpf = async () => {
      if (!formData.cpf || !validarCpf(formData.cpf)) {
        setValidation(prev => ({ ...prev, cpf: formData.cpf ? 'invalid' : 'idle' }));
        if (formData.cpf && !validarCpf(formData.cpf)) {
          setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
        } else {
          setErrors(prev => ({ ...prev, cpf: undefined }));
        }
        return;
      }

      setValidation(prev => ({ ...prev, cpf: 'checking' }));

      try {
        const isUnique = await ClienteServiceNew.verificarCpfUnico(formData.cpf);
        setValidation(prev => ({ ...prev, cpf: isUnique ? 'valid' : 'invalid' }));
        
        if (!isUnique) {
          setErrors(prev => ({ ...prev, cpf: 'Este CPF já está cadastrado' }));
        } else {
          setErrors(prev => ({ ...prev, cpf: undefined }));
        }
      } catch (error) {
        console.error('Erro ao validar CPF:', error);
        setValidation(prev => ({ ...prev, cpf: 'idle' }));
      }
    };

    const timer = setTimeout(validateCpf, 500);
    return () => clearTimeout(timer);
  }, [formData.cpf]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro específico do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatarTelefone = (telefone: string): string => {
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    if (apenasNumeros.length <= 10) {
      return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const formatarCpf = (cpf: string): string => {
    return cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarCep = (cep: string): string => {
    return cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validarCpf = (cpf: string): boolean => {
    const apenasNumeros = cpf.replace(/\D/g, '');
    
    if (apenasNumeros.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(apenasNumeros)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(apenasNumeros.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(apenasNumeros.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(apenasNumeros.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(apenasNumeros.charAt(10));
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
    
    // Consultar CEP automaticamente quando tiver 8 dígitos
    const apenasNumeros = value.replace(/\D/g, '');
    if (apenasNumeros.length === 8) {
      consultarCep(formatted);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validações obrigatórias
    if (!formData.nome) newErrors.nome = 'Nome é obrigatório';
    if (!formData.cpf) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.telefone) newErrors.telefone = 'Telefone é obrigatório';

    // Validações de formato
    if (formData.cpf && !validarCpf(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.telefone && formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone deve ter pelo menos 10 dígitos';
    }

    // Validações do CEP e endereço
    if (formData.cep) {
      if (formData.cep.replace(/\D/g, '').length !== 8) {
        newErrors.cep = 'CEP deve ter 8 dígitos';
      }
      if (!formData.rua) newErrors.rua = 'Logradouro é obrigatório quando CEP é informado';
      if (!formData.numero) newErrors.numero = 'Número é obrigatório quando CEP é informado';
      if (!formData.bairro) newErrors.bairro = 'Bairro é obrigatório quando CEP é informado';
      if (!formData.cidade) newErrors.cidade = 'Cidade é obrigatória quando CEP é informado';
      if (!formData.estado) newErrors.estado = 'Estado é obrigatório quando CEP é informado';
    }

    // Verificar se há validações em andamento
    const hasValidationInProgress = Object.values(validation).some(v => v === 'checking' || v === 'loading');
    if (hasValidationInProgress) {
      newErrors.geral = 'Aguarde a validação dos dados';
    }

    // Verificar se há validações inválidas
    const hasInvalidValidation = Object.values(validation).some(v => v === 'invalid');
    if (hasInvalidValidation) {
      newErrors.geral = 'Corrija os erros nos campos destacados';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Corrija os erros no formulário');
      return;
    }

    try {
      // Preparar dados para criação
      const clienteData = {
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone,
        email: formData.email || null,
        cep: formData.cep || null,
        endereco: formData.cep ? 
          `${formData.rua}, ${formData.numero}${formData.complemento ? `, ${formData.complemento}` : ''}, ${formData.bairro}, ${formData.cidade}, ${formData.estado}` : 
          null,
        cidade: formData.cidade || null
      };

      const novoCliente = await criarClienteMutation.mutateAsync(clienteData);
      
      toast.success('Cliente criado com sucesso!');
      onClienteCreated(novoCliente);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente. Tente novamente.');
    }
  };

  const getFieldIcon = (field: keyof ValidationState) => {
    const state = validation[field];
    switch (state) {
      case 'checking':
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Novo Cliente
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.geral && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.geral}</AlertDescription>
            </Alert>
          )}

          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo *
              </Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className={errors.nome ? 'border-red-500' : ''}
                placeholder="Digite o nome completo"
              />
              {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CPF *
                {getFieldIcon('cpf')}
              </Label>
              <Input
                id="cpf"
                type="text"
                value={formData.cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                className={errors.cpf || validation.cpf === 'invalid' ? 'border-red-500' : validation.cpf === 'valid' ? 'border-green-500' : ''}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {errors.cpf && <p className="text-sm text-red-500">{errors.cpf}</p>}
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone *
                {getFieldIcon('telefone')}
              </Label>
              <Input
                id="telefone"
                type="text"
                value={formData.telefone}
                onChange={(e) => handleTelefoneChange(e.target.value)}
                className={errors.telefone || validation.telefone === 'invalid' ? 'border-red-500' : validation.telefone === 'valid' ? 'border-green-500' : ''}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
              {errors.telefone && <p className="text-sm text-red-500">{errors.telefone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
                {getFieldIcon('email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email || validation.email === 'invalid' ? 'border-red-500' : validation.email === 'valid' ? 'border-green-500' : ''}
                placeholder="email@exemplo.com"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <MapPin className="h-4 w-4" />
              Endereço
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  CEP
                  {getFieldIcon('cep')}
                </Label>
                <Input
                  id="cep"
                  type="text"
                  value={formData.cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  className={errors.cep || validation.cep === 'invalid' ? 'border-red-500' : validation.cep === 'valid' ? 'border-green-500' : ''}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {errors.cep && <p className="text-sm text-red-500">{errors.cep}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="rua">Logradouro</Label>
                <Input
                  id="rua"
                  type="text"
                  value={formData.rua}
                  onChange={(e) => handleInputChange('rua', e.target.value)}
                  className={errors.rua ? 'border-red-500' : ''}
                  placeholder="Nome da rua"
                />
                {errors.rua && <p className="text-sm text-red-500">{errors.rua}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  type="text"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  className={errors.numero ? 'border-red-500' : ''}
                  placeholder="123"
                />
                {errors.numero && <p className="text-sm text-red-500">{errors.numero}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  placeholder="Apartamento, bloco, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  className={errors.bairro ? 'border-red-500' : ''}
                  placeholder="Nome do bairro"
                />
                {errors.bairro && <p className="text-sm text-red-500">{errors.bairro}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  className={errors.cidade ? 'border-red-500' : ''}
                  placeholder="Nome da cidade"
                />
                {errors.cidade && <p className="text-sm text-red-500">{errors.cidade}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  type="text"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className={errors.estado ? 'border-red-500' : ''}
                  placeholder="UF"
                  maxLength={2}
                />
                {errors.estado && <p className="text-sm text-red-500">{errors.estado}</p>}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={criarClienteMutation.isPending}
              className="flex items-center gap-2"
            >
              {criarClienteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Criar Cliente
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};