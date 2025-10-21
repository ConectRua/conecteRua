import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ShieldPlus, UserPlus2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const createUserSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres").max(50),
  email: z.string().email("Informe um email válido").max(255),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  isAdmin: z.boolean().default(false),
  welcomeMessage: z
    .string()
    .max(500, "Mensagem pode ter no máximo 500 caracteres")
    .optional()
    .transform((value) => value?.trim() || undefined),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

type AdminCreateUserResponse = {
  user: {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
  };
  message?: string;
};

const AdminUsuarios = () => {
  const { toast } = useToast();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      isAdmin: false,
      welcomeMessage: "",
    },
  });

  const { mutateAsync, isPending } = useMutation<
    { response: AdminCreateUserResponse; welcomeMessage?: string },
    unknown,
    CreateUserFormValues
  >({
    mutationFn: async (values: CreateUserFormValues) => {
      const { welcomeMessage, ...userPayload } = values;
      const response = (await apiRequest(
        "POST",
        "/api/admin/users",
        userPayload,
      )) as AdminCreateUserResponse;
      return { response, welcomeMessage };
    },
    onSuccess: ({ response, welcomeMessage }) => {
      form.reset({
        username: "",
        email: "",
        password: "",
        isAdmin: false,
        welcomeMessage: "",
      });

      toast({
        title: "Usuário criado com sucesso",
        description: `Conta ${response.user.username} configurada${
          response.user.isAdmin ? " como administradora." : "."
        }`,
      });

      if (welcomeMessage) {
        toast({
          title: "Mensagem salva",
          description: "Guarde esta mensagem para compartilhar com o novo usuário.",
        });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Tente novamente mais tarde.";
      toast({
        title: "Não foi possível criar o usuário",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: CreateUserFormValues) => {
    await mutateAsync(values);
  };

  const { control, register, handleSubmit, formState } = form;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ShieldPlus className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Crie novas contas para a equipe e defina se cada usuário terá privilégios administrativos no sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus2 className="h-5 w-5 text-primary" />
            Novo usuário
          </CardTitle>
          <CardDescription>
            Informe as credenciais iniciais. O usuário poderá alterar a senha após o primeiro acesso.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de usuário</Label>
                <Input
                  id="username"
                  placeholder="ex: maria.souza"
                  {...register("username")}
                  disabled={isPending}
                />
                {formState.errors.username && (
                  <p className="text-xs text-destructive">{formState.errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@instituicao.org"
                  {...register("email")}
                  disabled={isPending}
                />
                {formState.errors.email && (
                  <p className="text-xs text-destructive">{formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Senha temporária</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  {...register("password")}
                  disabled={isPending}
                />
                {formState.errors.password && (
                  <p className="text-xs text-destructive">{formState.errors.password.message}</p>
                )}
              </div>
              <Controller
                name="isAdmin"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Permissões</Label>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">Administrador</p>
                        <p className="text-xs text-muted-foreground">
                          Pode gerenciar usuários e acessar configurações sensíveis.
                        </p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Mensagem opcional</Label>
              <Textarea
                id="welcomeMessage"
                placeholder="Anote uma mensagem de boas-vindas ou instruções para compartilhar com o novo usuário."
                {...register("welcomeMessage")}
                disabled={isPending}
                rows={4}
              />
              {formState.errors.welcomeMessage && (
                <p className="text-xs text-destructive">{formState.errors.welcomeMessage.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar usuário
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminUsuarios;
