import { Leaf } from 'lucide-react';
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Leaf className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight mt-4">HealthFlow Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Please sign in to continue.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
