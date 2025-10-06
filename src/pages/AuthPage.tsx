// Authentication page with login only
// Based on blueprint:javascript_auth_all_persistance integration

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logoConecteRua from '@/assets/logo-conecte-rua-final.png';

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const AuthPage = () => {
  const { user, login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already authenticated (after hooks are called)
  if (user) {
    return <Navigate to="/" replace />;
  }

  const onLogin = async (data: LoginFormData) => {
    try {
      await login({
        username: data.username,
        password: data.password,
      });
    } catch (error) {
      // Error is already handled in the login function with toast
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="w-full max-w-md space-y-4">
        {/* Logo */}
        <div className="text-center">
          <img 
            src={logoConecteRua} 
            alt="Sistema de Georreferenciamento" 
            className="h-36 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Conectando Pessoas aos Cuidados
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Sistema de Georreferenciamento
          </p>
        </div>

        {/* Authentication Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>
              Entre com suas credenciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">Nome de Usuário</Label>
                      <Input
                        id="login-username"
                        data-testid="input-login-username"
                        {...loginForm.register("username")}
                        placeholder="Digite seu nome de usuário"
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-red-500 text-sm mt-1">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          data-testid="input-login-password"
                          type={showPassword ? "text" : "password"}
                          {...loginForm.register("password")}
                          placeholder="Digite sua senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      data-testid="button-login"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Entrar
                    </Button>
                  </form>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default AuthPage;