
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Package,
  FileText,
  ClipboardCheck,
  Shield,
  MessageSquare,
  Contact,
  Store,
  Tag,
  Ticket,
  Box,
  Library,
  Settings,
  History,
  Palette,
  Heart,
  ShoppingBag,
  Leaf,
  Calendar,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";

const adminNavGroups = [
    {
        label: "Overview",
        items: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
    },
    {
        label: "Patient Care",
        items: [
            { href: "/dashboard/patients", label: "Patients", icon: Users },
            { href: "/dashboard/sessions", label: "Sessions", icon: CalendarDays },
        ]
    },
    {
        label: "Orders & Billing",
        items: [
            { href: "/dashboard/orders", label: "Orders", icon: Package },
            { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
        ]
    },
    {
        label: "Management",
        items: [
            { href: "/dashboard/tasks", label: "Tasks", icon: ClipboardCheck },
            { href: "/dashboard/insurance", label: "Insurance", icon: Shield },
            { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
        ]
    },
    {
        label: "Admin",
        items: [
            { href: "/dashboard/admin/providers", label: "Providers", icon: Contact },
            { href: "/dashboard/admin/pharmacies", label: "Pharmacies", icon: Store },
            { href: "/dashboard/admin/tags", label: "Tags", icon: Tag },
            { href: "/dashboard/admin/discounts", label: "Discounts", icon: Ticket },
        ]
    },
    {
        label: "Products & Content",
        items: [
            { href: "/dashboard/admin/products", label: "Products", icon: Box },
            { href: "/dashboard/admin/resources", label: "Resources", icon: Library },
        ]
    },
    {
        label: "System",
        items: [
            { href: "/dashboard/settings", label: "Settings", icon: Settings },
            { href: "/dashboard/admin/audit-log", label: "Audit Log", icon: History },
        ]
    }
];

const patientNavGroups = [
    {
        label: "My Health",
        items: [
            { href: "/my-services", label: "My Services", icon: Heart },
            { href: "/dashboard/shop", label: "Explore Services", icon: ShoppingBag },
            { href: "/dashboard/orders", label: "My Orders", icon: Package },
        ]
    },
    {
        label: "Support",
        items: [
            { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
        ]
    },
     {
        label: "Account",
        items: [
            { href: "/dashboard/settings", label: "Settings", icon: Settings },
        ]
    }
];

export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || 'patient';

  const navGroups = role === 'admin' || role === 'provider' ? adminNavGroups : patientNavGroups;

  const isActive = (href: string) => {
    if (!pathname) return false;
    
    // Exact match for the dashboard, otherwise startsWith for nested routes
    if (href === "/dashboard" || href === "/my-services") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {navGroups.map((group, index) => (
        <React.Fragment key={group.label}>
          {index > 0 && <SidebarSeparator />}
          <SidebarGroup>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(link.href)}
                    tooltip={{
                      children: link.label,
                    }}
                  >
                    <Link href={link.href}>
                      <link.icon />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </React.Fragment>
      ))}
    </>
  );
}
