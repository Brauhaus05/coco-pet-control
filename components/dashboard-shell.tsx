"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PawPrint,
  LayoutDashboard,
  Users,
  Cat,
  Stethoscope,
  CalendarDays,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Owners", href: "/dashboard/owners", icon: Users },
  { label: "Pets", href: "/dashboard/pets", icon: Cat },
  { label: "Medical Records", href: "/dashboard/medical-records", icon: Stethoscope },
  { label: "Appointments", href: "/dashboard/appointments", icon: CalendarDays },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
];

interface DashboardShellProps {
  children: React.ReactNode;
  profile: {
    full_name: string;
    role: string;
    clinics: { name: string } | null;
  } | null;
}

export default function DashboardShell({
  children,
  profile,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto print:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            CoCo
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Clinic info at the bottom */}
        <div className="p-4 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground truncate">
            {profile?.clinics?.name ?? "No clinic"}
          </p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 shrink-0 print:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 hover:bg-accent"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground hidden sm:inline-block">
                  {profile?.full_name ?? "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-popover border-border"
            >
              <div className="px-2 py-1.5">
                <p className="text-sm text-foreground font-medium">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile?.role}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
