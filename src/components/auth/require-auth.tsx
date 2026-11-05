import type { ReactNode } from "react";
import { AuthForm } from "@/components/auth/auth-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/services/client-api";

export function RequireAuth({ children, message }: { children: ReactNode; message: string }) {
  const { user, isLoading } = useSession();
  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-10" aria-busy="true"><Skeleton className="h-96 w-full" /></div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        <AuthForm mode="login" />
      </div>
    );
  }
  return <>{children}</>;
}
