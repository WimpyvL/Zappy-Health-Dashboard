
"use client"

import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if user is available (including the mock user)
  React.useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Render a loading state while auth is being checked or bypassed
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
       <div className="flex flex-col items-center text-center">
         <Loader2 className="animate-spin rounded-full h-8 w-8 text-primary mb-4" />
         <p className="text-muted-foreground">Initializing session...</p>
      </div>
    </main>
  );
}
