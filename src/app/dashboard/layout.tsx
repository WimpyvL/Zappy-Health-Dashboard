
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
import { Leaf, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import monitoring, { setUserId, logInfo, trackUserAction } from "@/lib/monitoring";

// Enhanced QueryClient with error logging
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Log query errors to monitoring
        monitoring.logError(new Error(`Query failed: ${error?.message}`), {
          type: 'query_error',
          failureCount,
          status: error?.status,
        });

        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Log mutation errors to monitoring
        monitoring.logError(new Error(`Mutation failed: ${error?.message}`), {
          type: 'mutation_error',
          failureCount,
          status: error?.status,
        });

        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();

  // Set up monitoring integration
  React.useEffect(() => {
    if (user) {
      setUserId(user.uid);
      logInfo('User authenticated', {
        role: user.role,
        email: user.email,
      });
      trackUserAction('dashboard_access', 'layout', { role: user.role });
    }
  }, [user]);

  // Track performance
  React.useEffect(() => {
    const stopTimer = monitoring.startTimer('dashboard_render');
    logInfo('Dashboard layout rendered');
    
    return () => {
      stopTimer();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    logInfo('Dashboard access denied - no user');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        monitoring.logError(error, {
          type: 'dashboard_layout_error',
          componentStack: errorInfo.componentStack,
          userId: user.uid,
        });
      }}
    >
      <SidebarProvider>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            monitoring.logError(error, {
              type: 'sidebar_error',
              componentStack: errorInfo.componentStack,
            });
          }}
        >
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      trackUserAction('logout', 'header');
                      logout();
                    }}
                    className="h-8 w-8 p-0"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                  <SidebarTrigger className="lg:hidden" />
                </div>
              </div>
              {user && (
                <div className="px-2 py-2 text-sm text-gray-600 group-data-[collapsible=icon]:hidden">
                  <div className="font-medium">{user.displayName || user.email}</div>
                  <div className="text-xs capitalize">{user.role}</div>
                </div>
              )}
            </SidebarHeader>
            <SidebarContent>
              <ErrorBoundary
                onError={(error, errorInfo) => {
                  monitoring.logError(error, {
                    type: 'navigation_error',
                    componentStack: errorInfo.componentStack,
                  });
                }}
              >
                <DashboardNav />
              </ErrorBoundary>
            </SidebarContent>
          </Sidebar>
        </ErrorBoundary>
        
        <SidebarInset>
          <main className="flex-1 p-6 lg:p-8 overflow-auto bg-slate-50">
            <ErrorBoundary
              onError={(error, errorInfo) => {
                monitoring.logError(error, {
                  type: 'main_content_error',
                  componentStack: errorInfo.componentStack,
                  route: window.location.pathname,
                  userId: user.uid,
                });
              }}
              resetKeys={[window.location.pathname]}
              resetOnPropsChange
            >
              {children}
            </ErrorBoundary>
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </ErrorBoundary>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        monitoring.logError(error, {
          type: 'root_layout_error',
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <QueryClientProvider client={queryClient}>
        <DashboardContent>{children}</DashboardContent>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
