// Authentication hook with real backend integration
// Phase 6: Production-Ready Authentication

import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type User = {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for current user on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser({
          ...userData,
          isAdmin: Boolean(userData.isAdmin),
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginData): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/login', credentials);
      
      if (response.user) {
        setUser({
          ...response.user,
          isAdmin: Boolean(response.user.isAdmin),
        });
        toast({
          title: "Sucesso!",
          description: response.message || "Login realizado com sucesso!",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Usuário ou senha inválidos",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/register', data);
      
      if (response.user) {
        // In development, auto-login after registration
        if (process.env.NODE_ENV === 'development') {
          setUser({
            ...response.user,
            isAdmin: Boolean(response.user.isAdmin),
          });
        }
        
        toast({
          title: "Sucesso!",
          description: response.message || "Cadastro realizado com sucesso!",
        });
        
        // If email verification is required (production)
        if (response.emailVerificationRequired) {
          toast({
            title: "Verificação de email",
            description: "Verifique seu email para ativar sua conta",
          });
        }
      }
    } catch (error: any) {
      console.error("Register error:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await apiRequest('POST', '/api/logout', {});
      setUser(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      
      // Clear any cached data
      localStorage.removeItem("conecterua_user");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Erro no logout",
        description: error.message || "Erro ao desconectar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
