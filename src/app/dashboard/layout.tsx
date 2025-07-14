"use client";

import * as React from "react";
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-10 w-10 p-0" asChild>
                <a href="/dashboard">
                  <Leaf className="w-6 h-6 text-primary" />
                  <span className="sr-only">Zappy</span>
                </a>
              </Button>
              <h2 className="text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                Zappy
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
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
