import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  metadata?: Record<string, any>;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role?: string;
  lastSignIn?: string;
  emailConfirmed: boolean;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: Session | null;
  error: string | null;
}

export class AuthService {
  // ==================== AUTENTICAÇÃO ====================

  /**
   * Realizar login do usuário
   */
  static async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: this.translateAuthError(error)
        };
      }

      const authUser = this.mapUserToAuthUser(data.user);

      return {
        user: authUser,
        session: data.session,
        error: null
      };
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        user: null,
        session: null,
        error: 'Erro inesperado durante o login'
      };
    }
  }

  /**
   * Registrar novo usuário
   */
  static async signUp(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            ...userData.metadata
          }
        }
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: this.translateAuthError(error)
        };
      }

      const authUser = data.user ? this.mapUserToAuthUser(data.user) : null;

      return {
        user: authUser,
        session: data.session,
        error: null
      };
    } catch (error) {
      console.error('Erro no registro:', error);
      return {
        user: null,
        session: null,
        error: 'Erro inesperado durante o registro'
      };
    }
  }

  /**
   * Logout do usuário
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: this.translateAuthError(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { error: 'Erro inesperado durante o logout' };
    }
  }

  /**
   * Obter usuário atual
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return this.mapUserToAuthUser(user);
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  /**
   * Obter sessão atual
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      return session;
    } catch (error) {
      console.error('Erro ao obter sessão atual:', error);
      return null;
    }
  }

  // ==================== RECUPERAÇÃO DE SENHA ====================

  /**
   * Solicitar reset de senha
   */
  static async requestPasswordReset(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { error: this.translateAuthError(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);
      return { error: 'Erro inesperado ao solicitar reset de senha' };
    }
  }

  /**
   * Atualizar senha
   */
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error: this.translateAuthError(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return { error: 'Erro inesperado ao atualizar senha' };
    }
  }

  // ==================== GESTÃO DE PERFIL ====================

  /**
   * Atualizar perfil do usuário
   */
  static async updateProfile(updates: {
    fullName?: string;
    email?: string;
    metadata?: Record<string, any>;
  }): Promise<{ error: string | null }> {
    try {
      const updateData: any = {};

      if (updates.email) {
        updateData.email = updates.email;
      }

      if (updates.fullName || updates.metadata) {
        updateData.data = {
          ...(updates.fullName && { full_name: updates.fullName }),
          ...updates.metadata
        };
      }

      const { error } = await supabase.auth.updateUser(updateData);

      if (error) {
        return { error: this.translateAuthError(error) };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { error: 'Erro inesperado ao atualizar perfil' };
    }
  }

  // ==================== LISTENERS ====================

  /**
   * Listener para mudanças no estado de autenticação
   */
  static onAuthStateChange(callback: (user: AuthUser | null, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? this.mapUserToAuthUser(session.user) : null;
      callback(user, session);
    });
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Verificar se usuário está autenticado
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session;
  }

  /**
   * Mapear User do Supabase para AuthUser
   */
  private static mapUserToAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || user.email || 'Usuário',
      role: user.user_metadata?.role || 'user',
      lastSignIn: user.last_sign_in_at || undefined,
      emailConfirmed: user.email_confirmed_at !== null
    };
  }

  /**
   * Traduzir erros de autenticação para português
   */
  private static translateAuthError(error: AuthError): string {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
      'User not found': 'Usuário não encontrado',
      'Weak password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
      'Email already registered': 'Este email já está cadastrado',
      'Invalid email': 'Email inválido',
      'Password too short': 'Senha muito curta. Use pelo menos 6 caracteres.',
      'User already registered': 'Usuário já cadastrado',
      'Invalid password': 'Senha inválida',
      'Email rate limit exceeded': 'Muitas tentativas. Tente novamente em alguns minutos.',
      'Signups not allowed': 'Cadastros não permitidos no momento',
      'Too many requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
      'Network error': 'Erro de conexão. Verifique sua internet.',
    };

    // Verificar mensagens específicas
    for (const [key, value] of Object.entries(errorMessages)) {
      if (error.message.includes(key)) {
        return value;
      }
    }

    // Casos específicos por código
    switch (error.status) {
      case 422:
        return 'Email ou senha inválidos';
      case 429:
        return 'Muitas tentativas. Tente novamente em alguns minutos.';
      case 400:
        return 'Dados inválidos fornecidos';
      default:
        return error.message || 'Erro de autenticação';
    }
  }

  // ==================== VALIDAÇÕES ====================

  /**
   * Validar email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar senha
   */
  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
      return { isValid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
    }
    
    if (password.length > 128) {
      return { isValid: false, message: 'Senha muito longa (máximo 128 caracteres)' };
    }

    // Verificar se tem pelo menos uma letra e um número
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasLetter || !hasNumber) {
      return { isValid: false, message: 'Senha deve conter pelo menos uma letra e um número' };
    }

    return { isValid: true };
  }

  /**
   * Gerar senha forte
   */
  static generateStrongPassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Garantir pelo menos uma letra maiúscula, minúscula, número e símbolo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Preencher o resto
    for (let i = 4; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Embaralhar
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
} 