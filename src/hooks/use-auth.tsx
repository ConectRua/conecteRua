// Authentication hook for the georeferencing system
// Mock implementation for frontend-only authentication

import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Mock user type for frontend
type MockUser = {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
};

type MockLoginData = {
  username: string;
  password: string;
};

type MockRegisterData = {
  username: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: MockUser | null;
  isLoading: boolean;
  login: (credentials: MockLoginData) => Promise<void>;
  register: (data: MockRegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for development
const MOCK_USERS: (MockUser & { password: string })[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@conecterua.com",
    password: "123456",
    emailVerified: true,
    createdAt: new Date(),
  },
  {
    id: 2,
    username: "usuario",
    email: "usuario@conecterua.com", 
    password: "123456",
    emailVerified: true,
    createdAt: new Date(),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("conecterua_user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("conecterua_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: MockLoginData): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = MOCK_USERS.find(
      u => u.username === credentials.username && u.password === credentials.password
    );

    if (!foundUser) {
      setIsLoading(false);
      throw new Error("Usuário ou senha inválidos");
    }

    const { password, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem("conecterua_user", JSON.stringify(userWithoutPassword));
    
    toast({
      title: "Sucesso!",
      description: "Login realizado com sucesso!",
    });
    
    setIsLoading(false);
  };

  const register = async (data: MockRegisterData): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if username already exists
    const existingUser = MOCK_USERS.find(u => u.username === data.username);
    if (existingUser) {
      setIsLoading(false);
      throw new Error("Nome de usuário já existe");
    }

    // Check if email already exists
    const existingEmail = MOCK_USERS.find(u => u.email === data.email);
    if (existingEmail) {
      setIsLoading(false);
      throw new Error("Email já cadastrado");
    }

    // Create new user
    const newUser: MockUser = {
      id: MOCK_USERS.length + 1,
      username: data.username,
      email: data.email,
      emailVerified: true, // Auto-verify for mock
      createdAt: new Date(),
    };

    // Add to mock database
    MOCK_USERS.push({ ...newUser, password: data.password });
    
    setUser(newUser);
    localStorage.setItem("conecterua_user", JSON.stringify(newUser));
    
    toast({
      title: "Sucesso!",
      description: "Cadastro realizado com sucesso! Email verificado automaticamente.",
    });
    
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("conecterua_user");
    
    toast({
      title: "Sucesso!",
      description: "Logout realizado com sucesso!",
    });
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}