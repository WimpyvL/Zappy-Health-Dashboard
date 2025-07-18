
"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/dashboard-nav";
import { Leaf } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

// Create a client
const queryClient = new QueryClient();

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
        <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-10 w-10 p-0" asChild>
                    <a href="/dashboard">
                    <Leaf className="w-6 h-6 text-primary" />
                    <span className="sr-only">HealthFlow</span>
                    </a>
                </Button>
                <h2 className="text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                    HealthFlow
                </h2>
                </div>
                <SidebarTrigger className="lg:hidden" />
            </div>
            </SidebarHeader>
            <SidebarContent>
            <DashboardNav />
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <main className="flex-1 p-6 lg:p-8 overflow-auto bg-slate-50">
            {children}
            </main>
        </SidebarInset>
        <Toaster />
        </SidebarProvider>
    </QueryClientProvider>
  );
}
