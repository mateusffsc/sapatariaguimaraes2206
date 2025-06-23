import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, Shield, ArrowRight, KeyRound } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

import { useAuth } from '../hooks/useAuth';
import { useSetup } from '../hooks/useSetup';

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .regex(/[A-Za-z]/, 'Senha deve conter pelo menos uma letra')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    signIn, 
    signUp, 
    requestPasswordReset,
    isSigningIn, 
    isSigningUp, 
    isResettingPassword,
    isAuthenticated,
    validatePassword 
  } = useAuth();

  const { 
    hasAdmin, 
    isInitializing, 
    defaultCredentials,
    createAdmin 
  } = useSetup();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'reset'>('login');

  // Redirect se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Formulário de Login
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Formulário de Registro
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Formulário de Reset de Senha
  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  // Handlers
  const handleLogin = async (data: LoginForm) => {
    try {
      await signIn({
        email: data.email,
        password: data.password
      });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    try {
      await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName
      });
      // Limpar formulário após sucesso
      registerForm.reset();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleResetPassword = async (data: ResetPasswordForm) => {
    try {
      await requestPasswordReset(data.email);
      resetForm.reset();
      setActiveTab('login');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  // Verificar força da senha em tempo real
  const watchPassword = registerForm.watch('password');
  const passwordStrength = watchPassword ? validatePassword(watchPassword) : { isValid: false };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Gestão</CardTitle>
          <CardDescription>
            Sapataria Guimarães - Acesse sua conta
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
              <TabsTrigger value="reset">Reset</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              {/* Credenciais Admin Padrão */}
              {(!hasAdmin || isInitializing) && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-blue-900">
                        {isInitializing ? 'Criando usuário admin...' : 'Credenciais Admin Padrão:'}
                      </p>
                      {!isInitializing && (
                        <>
                          <div className="text-sm text-blue-800">
                            <p><strong>Email:</strong> {defaultCredentials.email}</p>
                            <p><strong>Senha:</strong> {defaultCredentials.password}</p>
                          </div>
                          <Button 
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => {
                              if (defaultCredentials.email && defaultCredentials.password) {
                                loginForm.setValue('email', defaultCredentials.email);
                                loginForm.setValue('password', defaultCredentials.password);
                              }
                            }}
                          >
                            <KeyRound className="h-3 w-3 mr-1" />
                            Usar Credenciais Admin
                          </Button>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      {...loginForm.register('email')}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      className="pl-10 pr-10"
                      {...loginForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSigningIn}
                >
                  {isSigningIn ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <Separator />
              
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setActiveTab('reset')}
                  className="text-sm text-muted-foreground"
                >
                  Esqueceu sua senha?
                </Button>
              </div>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome Completo</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Seu nome completo"
                    {...registerForm.register('fullName')}
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      {...registerForm.register('email')}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Crie uma senha forte"
                      className="pl-10 pr-10"
                      {...registerForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {watchPassword && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={passwordStrength.isValid ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {passwordStrength.isValid ? "Senha forte" : "Senha fraca"}
                      </Badge>
                    </div>
                  )}
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme sua senha"
                      className="pl-10 pr-10"
                      {...registerForm.register('confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSigningUp}
                >
                  {isSigningUp ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar Conta
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Reset Password Tab */}
            <TabsContent value="reset" className="space-y-4">
              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertDescription>
                  Digite seu email para receber um link de redefinição de senha.
                </AlertDescription>
              </Alert>

              <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      {...resetForm.register('email')}
                    />
                  </div>
                  {resetForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {resetForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Link de Reset
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <Separator />
              
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setActiveTab('login')}
                  className="text-sm text-muted-foreground"
                >
                  Voltar para Login
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage; 