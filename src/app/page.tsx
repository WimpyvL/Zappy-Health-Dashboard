
"use client"

import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Redirect if already logged in and not loading
  React.useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      // The redirect will be handled by the useEffect hook
    } catch (error: any) {
      // The useAuth hook handles the toast notification for errors
      console.error("Login page caught an error:", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'provider' | 'patient') => {
    setIsSubmitting(true);
    try {
      const demoAccounts = {
        admin: { email: "admin@healthflow.com", password: "adminPassword123!" },
        provider: { email: "provider@healthflow.com", password: "providerPassword123!" },
        patient: { email: "patient@healthflow.com", password: "patientPassword123!" }
      };
      
      const account = demoAccounts[role];
      await signIn(account.email, account.password);
    } catch (error) {
      // Error is handled in auth context
      console.error("Demo login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render nothing or a loading spinner while checking auth state
  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin rounded-full h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Leaf className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to HealthFlow</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or try demo accounts</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin('admin')}
              disabled={isSubmitting}
              className="text-xs"
            >
              Admin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin('provider')}
              disabled={isSubmitting}
              className="text-xs"
            >
              Provider
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin('patient')}
              disabled={isSubmitting}
              className="text-xs"
            >
              Patient
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Demo accounts are pre-configured for testing different user roles
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
