
"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { User, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";

const adminUsers = [
  {
    name: "Loop69 Admin",
    role: "Provided Admin Account",
    email: "loop69org@gmail.com",
    avatar: <User className="h-6 w-6 text-muted-foreground" />,
  },
  // Add other admin users here if needed
];

export function AdminSelector() {
  const router = useRouter();

  const handleLogin = (userEmail: string) => {
    // In a real app, you would perform an authentication action here.
    // For this prototype, we'll just log it and navigate.
    console.log(`Logging in as ${userEmail}`);
    router.push("/dashboard");
  };

  return (
    <Card className="w-full max-w-md p-8 bg-white/80 backdrop-blur-lg border-white/20 shadow-2xl shadow-black/10">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mb-4 shadow-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
            <ShieldCheck className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-blue-900">Zappy Health</h1>
        <p className="text-sm text-gray-500">Admin Entry Point</p>
        <p className="mt-4 text-sm text-gray-600 max-w-xs">
          Select an administrator account to access the dashboard.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xs font-semibold uppercase text-gray-400 mb-2">
          Available Administrator Accounts
        </h2>
        <div className="space-y-3">
          {adminUsers.map((user) => (
            <Button
              key={user.email}
              variant="outline"
              className="w-full h-auto justify-start p-4 bg-white hover:bg-gray-50 border rounded-lg"
              onClick={() => handleLogin(user.email)}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  {user.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400 px-4">
          This is a development environment with predefined administrator accounts. All users have full admin access to the Zappy Health dashboard.
        </p>
      </div>
    </Card>
  );
}
