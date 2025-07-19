"use client";

import { LoginForm } from "./login-form";

export function LoginPageContainer() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent p-4">
      <LoginForm />
    </div>
  );
}