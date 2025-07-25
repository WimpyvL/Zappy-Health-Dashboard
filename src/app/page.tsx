"use client"

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin' || user.role === 'provider') {
        router.push("/dashboard");
      } else {
        router.push("/my-services");
      }
    }
<<<<<<< HEAD
  }, [user, authLoading, router]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting...</p>
=======
  }, [user, router]);

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      await signIn(values.email, values.password);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setLoading(true);
    try {
      await signUp(values.email, values.password, { 
        firstName: values.firstName, 
        lastName: values.lastName,
        displayName: `${values.firstName} ${values.lastName}`
      });
      toast({
        title: "Account Created",
        description: "Your account has been successfully created. Please log in.",
      });
      setActiveTab("login"); // Switch to login tab after signup
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
<<<<<<< HEAD
    } finally {
      setLoading(false);
    }
  };
  
  const handleDemoLogin = async (role: 'admin' | 'provider' | 'patient') => {
    setLoading(true);
    try {
      const demoAccounts = {
        admin: { email: "admin@zappy.com", password: "adminPassword123!" },
        provider: { email: "provider@zappy.com", password: "providerPassword123!" },
        patient: { email: "patient@zappy.com", password: "patientPassword123!" }
      };
      
      const account = demoAccounts[role];
      await signIn(account.email, account.password);
    } catch (error) {
      // Error is handled in auth context
      console.error("Demo login error:", error);
    
=======
>>>>>>> dd48230f1490504a7bf658f14b4c77975720fb3c
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
<<<<<<< HEAD
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Leaf className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Zappy</CardTitle>
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
=======
      <AdminSelector />
>>>>>>> dd48230f1490504a7bf658f14b4c77975720fb3c
>>>>>>> 09f51c1c02f6c4ac984835ff478df6040d66e12a
    </main>
  );
}
