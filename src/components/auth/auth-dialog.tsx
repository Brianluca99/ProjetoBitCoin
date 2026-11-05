import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { actions, useAuthModal } from "@/lib/store";
import { ApiError } from "@/services/http";
import { useAuthActions } from "@/services/client-api";

export function AuthDialog() {
  const mode = useAuthModal();
  return (
    <Dialog open={mode !== null} onOpenChange={(o) => !o && actions.openAuth(null)}>
      <DialogContent className="max-w-sm">
        <AuthForm
          key={mode ?? "x"}
          mode={mode === "register" ? "register" : "login"}
          inDialog
          onDone={() => actions.openAuth(null)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function AuthForm({
  mode: initial,
  onDone,
  inDialog,
}: {
  mode: "login" | "register";
  onDone?: () => void;
  inDialog?: boolean;
}) {
  const { login, register } = useAuthActions();
  const [mode, setMode] = useState(initial);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Partial<Record<string, string>>>({});
  const pending = login.isPending || register.isPending;
  const isReg = mode === "register";
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao conectar com o Google.");
    }
  };
  const Title = inDialog ? DialogTitle : "h1";
  const Desc = inDialog ? DialogDescription : "p";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const errs: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs["email"] = "Informe um e-mail válido.";
    if (password.length < 8) errs["password"] = "A senha precisa ter ao menos 8 caracteres.";
    if (isReg && String(f.get("name") ?? "").trim().length < 2) errs["name"] = "Informe seu nome.";
    if (isReg && password !== f.get("confirm")) errs["confirm"] = "As senhas não coincidem.";
    setFields(errs);
    setError(null);
    if (Object.keys(errs).length) return;
    try {
      if (isReg) {
        const session = await register.mutateAsync({
          name: String(f.get("name")).trim(),
          email,
          password,
        });
        toast.success(
          session
            ? "Conta criada com sucesso!"
            : "Conta criada. Verifique seu e-mail para confirmar o cadastro.",
        );
      } else {
        const session = await login.mutateAsync({ email, password });
        toast.success(`Bem-vindo, ${session.user.name}!`);
      }
      onDone?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        setError(err.message);
      } else setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    }
  };

  const fieldError = (name: string) =>
    fields[name] ? (
      <p id={`auth-${name}-err`} className="text-xs text-destructive">
        {fields[name]}
      </p>
    ) : null;
  const aria = (name: string) =>
    fields[name] ? { "aria-invalid": true, "aria-describedby": `auth-${name}-err` } : {};

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 text-center">
        <p className="font-display text-xl font-bold tracking-widest text-primary">KURIO</p>
        <Title className="text-lg font-semibold">
          {isReg ? "Criar perfil de colecionador" : "Entrar"}
        </Title>
        <Desc className="text-sm text-muted-foreground">
          {isReg
            ? "Cadastre-se para comprar e guardar suas edições."
            : "Acesse sua conta para continuar. Demo: ana@kurio.art / kurio123"}
        </Desc>
      </div>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {isReg && (
          <div className="space-y-1.5">
            <Label htmlFor="auth-name">Nome completo</Label>
            <Input id="auth-name" name="name" autoComplete="name" {...aria("name")} />
            {fieldError("name")}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="auth-email">E-mail</Label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            {...aria("email")}
          />
          {fieldError("email")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="auth-password">Senha</Label>
          <div className="relative">
            <Input
              id="auth-password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete={isReg ? "new-password" : "current-password"}
              className="pr-10"
              {...aria("password")}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {fieldError("password")}
        </div>
        {isReg && (
          <div className="space-y-1.5">
            <Label htmlFor="auth-confirm">Confirmar senha</Label>
            <Input
              id="auth-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              {...aria("confirm")}
            />
            {fieldError("confirm")}
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full uppercase" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {isReg ? "Criar conta" : "Entrar"}
        </Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full uppercase"
          onClick={handleGoogleLogin}
        >
          Entrar com Google
        </Button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        {isReg ? "Já tem conta? " : "Ainda não tem conta? "}
        <button
          type="button"
          className="text-primary underline-offset-4 hover:underline"
          onClick={() => {
            setMode(isReg ? "login" : "register");
            setFields({});
            setError(null);
          }}
        >
          {isReg ? "Entrar" : "Criar conta"}
        </button>
      </p>
    </div>
  );
}
