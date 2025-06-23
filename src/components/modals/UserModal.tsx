import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Building, Shield, Save, X } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

import { useCreateUser, useUpdateUser, usePermissionsByCategory, useRoles } from '../../hooks/useUsers';
import { UserService, type SystemUser } from '../../services/userService';

const userSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee', 'user']),
  active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: SystemUser | null;
  mode: 'create' | 'edit';
}

export const UserModal: React.FC<UserModalProps> = ({
  open,
  onOpenChange,
  user,
  mode
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions'>('basic');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const { data: permissionsByCategory = {} } = usePermissionsByCategory();
  const { data: roles = [] } = useRoles();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      department: '',
      role: 'user',
      active: true,
    }
  });

  useEffect(() => {
    if (user && mode === 'edit') {
      form.reset({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        department: user.department || '',
        role: user.role,
        active: user.active,
      });
      setSelectedPermissions(user.permissions || []);
    } else if (mode === 'create') {
      form.reset();
      setSelectedPermissions([]);
    }
  }, [user, mode, form, open]);

  const watchedRole = form.watch('role');
  useEffect(() => {
    if (mode === 'create') {
      const defaultPermissions = UserService.getDefaultPermissionsForRole(watchedRole);
      setSelectedPermissions(defaultPermissions);
    }
  }, [watchedRole, mode]);

  const handleSubmit = async (data: UserFormData) => {
    try {
      if (mode === 'create') {
        await createUserMutation.mutateAsync({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          department: data.department,
          role: data.role,
          active: data.active,
          permissions: selectedPermissions,
        });
      } else if (user) {
        await updateUserMutation.mutateAsync({
          id: user.id,
          userData: {
            full_name: data.full_name,
            phone: data.phone,
            department: data.department,
            role: data.role,
            active: data.active,
            permissions: selectedPermissions,
          }
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Erro já tratado nos hooks
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const currentRole = roles.find(r => r.name === watchedRole);
  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}</span>
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Cadastre um novo usuário no sistema' : 'Modifique as informações do usuário'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      className="pl-10"
                      placeholder="Nome completo do usuário"
                      {...form.register('full_name')}
                    />
                  </div>
                  {form.formState.errors.full_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      placeholder="email@empresa.com"
                      {...form.register('email')}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      placeholder="(11) 99999-9999"
                      {...form.register('phone')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="department"
                      className="pl-10"
                      placeholder="Ex: Vendas, Técnico, Administrativo"
                      {...form.register('department')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Nível de Acesso *</Label>
                  <Select 
                    value={form.watch('role')} 
                    onValueChange={(value: any) => form.setValue('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="employee">Funcionário</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Switch
                      checked={form.watch('active')}
                      onCheckedChange={(checked) => form.setValue('active', checked)}
                    />
                    <span>Usuário Ativo</span>
                  </Label>
                </div>
              </div>

              {currentRole && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informações do Nível</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {currentRole.description}
                    </p>
                    <Badge variant="outline">Nível {currentRole.level}</Badge>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Permissões do Usuário</h3>
                <p className="text-sm text-muted-foreground">
                  Defina quais funcionalidades o usuário pode acessar
                </p>
              </div>

              {watchedRole === 'admin' ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Shield className="w-12 h-12 mx-auto text-destructive mb-3" />
                      <h3 className="text-lg font-medium mb-2">Acesso Total</h3>
                      <p className="text-muted-foreground">
                        Administradores possuem acesso completo a todas as funcionalidades.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                      <Card key={category}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-3">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-3">
                                <Checkbox
                                  id={permission.id}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={permission.id}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {mode === 'create' ? 'Criando...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserModal;
