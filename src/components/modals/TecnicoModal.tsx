import React, { useState, useEffect } from 'react';
import { useCreateTechnician, useUpdateTechnician, useTechnicianValidation } from '@/hooks/useTechnicians';
import { Technician, CreateTechnician, UpdateTechnician } from '@/types/database';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign,
  Star,
  Wrench,
  X
} from 'lucide-react';

interface TecnicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tecnico?: Technician;
  mode?: 'create' | 'edit';
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  contact_info: string;
  specialties: string[];
  hire_date: string;
  hourly_rate: string;
  rating: string;
  notes: string;
  active: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  contact_info: '',
  specialties: [],
  hire_date: '',
  hourly_rate: '',
  rating: '',
  notes: '',
  active: true,
};

export function TecnicoModal({ isOpen, onClose, tecnico, mode = 'create' }: TecnicoModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<string[]>([]);

  const { 
    specialties: availableSpecialties, 
    validateTechnician, 
    formatHourlyRate, 
    formatRating,
    calculateExperience 
  } = useTechnicianValidation();
  
  const createTechnician = useCreateTechnician();
  const updateTechnician = useUpdateTechnician();

  const isEditing = mode === 'edit' && tecnico;
  const isLoading = createTechnician.isPending || updateTechnician.isPending;

  // Carregar dados do técnico para edição
  useEffect(() => {
    if (isEditing && tecnico) {
      setFormData({
        name: tecnico.name,
        phone: tecnico.phone || '',
        email: tecnico.email || '',
        address: tecnico.address || '',
        contact_info: tecnico.contact_info || '',
        specialties: tecnico.specialties || [],
        hire_date: tecnico.hire_date ? tecnico.hire_date.split('T')[0] : '',
        hourly_rate: tecnico.hourly_rate?.toString() || '',
        rating: tecnico.rating?.toString() || '',
        notes: tecnico.notes || '',
        active: tecnico.active,
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setErrors([]);
  }, [isEditing, tecnico, isOpen]);

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erros ao editar
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    const newSpecialties = formData.specialties.includes(specialty)
      ? formData.specialties.filter(s => s !== specialty)
      : [...formData.specialties, specialty];
    
    handleInputChange('specialties', newSpecialties);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Converter strings para números
    const hourlyRateValue = formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined;
    const ratingValue = formData.rating ? parseFloat(formData.rating) : undefined;

    const technicianData: CreateTechnician | UpdateTechnician = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
      contact_info: formData.contact_info.trim() || undefined,
      specialties: formData.specialties,
      hire_date: formData.hire_date || undefined,
      hourly_rate: hourlyRateValue,
      rating: ratingValue,
      notes: formData.notes.trim() || undefined,
      active: formData.active,
    };

    // Validar dados
    const validation = validateTechnician(technicianData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      if (isEditing && tecnico) {
        await updateTechnician.mutateAsync({
          id: tecnico.id.toString(),
          updates: technicianData as UpdateTechnician
        });
      } else {
        await createTechnician.mutateAsync(technicianData as CreateTechnician);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar técnico:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'Editar Técnico' : 'Novo Técnico'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alertas de erro */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Dados pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: João Silva"
                  disabled={isLoading}
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="joao@exemplo.com"
                  disabled={isLoading}
                />
              </div>

              {/* Data de contratação */}
              <div className="space-y-2">
                <Label htmlFor="hire_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Contratação
                </Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleInputChange('hire_date', e.target.value)}
                  disabled={isLoading}
                />
                {formData.hire_date && (
                  <div className="text-sm text-muted-foreground">
                    {calculateExperience(formData.hire_date)} anos de experiência
                  </div>
                )}
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Especialidades */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Especialidades *
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableSpecialties.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={specialty}
                    checked={formData.specialties.includes(specialty)}
                    onCheckedChange={() => handleSpecialtyToggle(specialty)}
                    disabled={isLoading}
                  />
                  <Label htmlFor={specialty} className="text-sm">
                    {specialty}
                  </Label>
                </div>
              ))}
            </div>
            {formData.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                    {specialty}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleSpecialtyToggle(specialty)}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Informações profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Profissionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valor por hora */}
              <div className="space-y-2">
                <Label htmlFor="hourly_rate" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor por Hora
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate}
                    onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                    placeholder="0,00"
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
                {formData.hourly_rate && (
                  <div className="text-sm text-muted-foreground">
                    {formatHourlyRate(parseFloat(formData.hourly_rate))}
                  </div>
                )}
              </div>

              {/* Avaliação */}
              <div className="space-y-2">
                <Label htmlFor="rating" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Avaliação (0-5)
                </Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => handleInputChange('rating', e.target.value)}
                  placeholder="4.5"
                  disabled={isLoading}
                />
                {formData.rating && (
                  <div className="text-sm text-muted-foreground">
                    {formatRating(parseFloat(formData.rating))}
                  </div>
                )}
              </div>
            </div>

            {/* Informações de contato adicionais */}
            <div className="space-y-2">
              <Label htmlFor="contact_info">Informações de Contato Adicionais</Label>
              <Input
                id="contact_info"
                value={formData.contact_info}
                onChange={(e) => handleInputChange('contact_info', e.target.value)}
                placeholder="WhatsApp, Telegram, etc."
                disabled={isLoading}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações sobre o técnico..."
                disabled={isLoading}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Status ativo */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Status do Técnico</Label>
              <p className="text-sm text-muted-foreground">
                {formData.active 
                  ? 'Técnico ativo e disponível para trabalho' 
                  : 'Técnico inativo'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={formData.active ? "default" : "secondary"}>
                {formData.active ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => handleInputChange('active', checked)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Preview do técnico */}
          {(formData.name || formData.specialties.length > 0) && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Preview do Técnico</h4>
              <div className="space-y-2 text-sm">
                {formData.name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formData.name}</span>
                  </div>
                )}
                {formData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.phone}</span>
                  </div>
                )}
                {formData.specialties.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {formData.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  {formData.hourly_rate && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatHourlyRate(parseFloat(formData.hourly_rate))}</span>
                    </div>
                  )}
                  {formData.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span>{formatRating(parseFloat(formData.rating))}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Técnico'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 