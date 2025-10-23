import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAdminUsers, useAdminResetUserPassword } from "@/hooks/useApiData";
import { apiRequest, queryKeys } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, ShieldPlus, UserPlus2, Users, KeyRound } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const createUserSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres").max(50),
  email: z.string().email("Informe um email válido").max(255),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
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

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme a nova senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const AdminUsuarios = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useAdminUsers();

  const users = usersData?.users ?? [];

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.isAdmin !== b.isAdmin) {
          return a.isAdmin ? -1 : 1;
        }
        return a.username.localeCompare(b.username);
      }),
    [users],
  );

  const adminCount = useMemo(() => sortedUsers.filter((user) => user.isAdmin).length, [sortedUsers]);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<AdminUserSummary | null>(null);

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: resetFormState,
    reset: resetResetForm,
  } = resetPasswordForm;

  const { mutateAsync: resetUserPassword, isPending: isResettingPassword } = useAdminResetUserPassword();

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
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
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });

      form.reset({
        username: "",
        email: "",
        password: "",
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

  const openResetDialog = (user: AdminUserSummary) => {
    setUserToReset(user);
    resetResetForm();
    setIsResetDialogOpen(true);
  };

  const closeResetDialog = () => {
    setIsResetDialogOpen(false);
    setUserToReset(null);
    resetResetForm();
  };

  const onResetSubmit = async (values: ResetPasswordFormValues) => {
    if (!userToReset) {
      return;
    }

    await resetUserPassword({
      userId: userToReset.id,
      newPassword: values.newPassword,
    });

    closeResetDialog();
  };

  const { register, handleSubmit, formState } = form;

  return (
    <>
      <Dialog
        open={isResetDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeResetDialog();
          } else {
            setIsResetDialogOpen(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha de acesso</DialogTitle>
            <DialogDescription>
              {userToReset
                ? `Informe a nova senha para o usuário ${userToReset.username}. Compartilhe-a com segurança.`
                : "Selecione um usuário para redefinir a senha."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-new-password">Nova senha</Label>
              <Input
                id="reset-new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo de 6 caracteres"
                {...registerReset("newPassword")}
              />
              {resetFormState.errors.newPassword && (
                <p className="text-xs text-destructive">{resetFormState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-confirm-password">Confirmar nova senha</Label>
              <Input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                {...registerReset("confirmPassword")}
              />
              {resetFormState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{resetFormState.errors.confirmPassword.message}</p>
              )}
            </div>
            <DialogFooter className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeResetDialog}
                disabled={isResettingPassword}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isResettingPassword || !userToReset}>
                {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldPlus className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Crie novas contas para a equipe controlando os acessos ao painel administrativo.
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

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuários cadastrados
            </CardTitle>
            <CardDescription>
              {sortedUsers.length === 0
                ? "Acompanhe as contas com acesso ao painel administrativo."
                : `Total de ${sortedUsers.length} usuário${sortedUsers.length > 1 ? "s" : ""}, incluindo ${adminCount} administrador${
                    adminCount === 1 ? "" : "es"
                  }.`}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetchUsers()}
            disabled={isUsersLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isUsersLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {isUsersLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : isUsersError ? (
            <div className="space-y-4">
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Não foi possível carregar a lista de usuários.
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetchUsers()}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : sortedUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.isAdmin ? "secondary" : "outline"}>
                          {user.isAdmin ? "Administrador" : "Padrão"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.emailVerified ? "secondary" : "outline"}>
                          {user.emailVerified ? "Verificado" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openResetDialog(user)}
                          disabled={isResettingPassword}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Redefinir senha
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum usuário cadastrado até o momento.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default AdminUsuarios;
