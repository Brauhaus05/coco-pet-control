import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Cat,
  CalendarDays,
  FileText,
  Clock,
  Activity,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();

  // Fetch all data in parallel
  const [
    ownersRes,
    petsRes,
    appointmentsRes,
    invoicesRes,
    upcomingRes,
    recentOwnersRes,
    recentPetsRes,
    recentRecordsRes,
    recentApptsRes,
    monthPaidRes,
    monthOutstandingRes,
  ] = await Promise.all([
    // Stat counts
    supabase.from("owners").select("id", { count: "exact", head: true }),
    supabase.from("pets").select("id", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "sent"]),

    // Upcoming appointments (next 5)
    supabase
      .from("appointments")
      .select("id, start_time, end_time, reason, status, pets(name), profiles:vet_id(full_name)")
      .gte("start_time", now.toISOString())
      .eq("status", "scheduled")
      .order("start_time", { ascending: true })
      .limit(5),

    // Recent activity — owners (last 5)
    supabase
      .from("owners")
      .select("id, first_name, last_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent activity — pets (last 5)
    supabase
      .from("pets")
      .select("id, name, species, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent activity — medical records (last 5)
    supabase
      .from("medical_records")
      .select("id, visit_date, diagnosis, created_at, pets(name)")
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent activity — appointments (last 5)
    supabase
      .from("appointments")
      .select("id, start_time, reason, status, created_at, pets(name)")
      .order("created_at", { ascending: false })
      .limit(5),

    // Revenue this month — paid
    supabase
      .from("invoices")
      .select("total")
      .eq("status", "paid")
      .gte("issue_date", format(startOfMonth(now), "yyyy-MM-dd"))
      .lte("issue_date", format(endOfMonth(now), "yyyy-MM-dd")),

    // Revenue this month — outstanding
    supabase
      .from("invoices")
      .select("total")
      .in("status", ["draft", "sent", "overdue"])
      .gte("issue_date", format(startOfMonth(now), "yyyy-MM-dd"))
      .lte("issue_date", format(endOfMonth(now), "yyyy-MM-dd")),
  ]);

  // Stats
  const stats = [
    {
      label: "Total Owners",
      value: ownersRes.count ?? 0,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/20",
    },
    {
      label: "Total Pets",
      value: petsRes.count ?? 0,
      icon: Cat,
      gradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/20",
    },
    {
      label: "Upcoming Appointments",
      value: appointmentsRes.count ?? 0,
      icon: CalendarDays,
      gradient: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
    },
    {
      label: "Open Invoices",
      value: invoicesRes.count ?? 0,
      icon: FileText,
      gradient: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-500/20",
    },
  ];

  // Upcoming appointments
  const upcoming = (upcomingRes.data ?? []) as any[];

  // Revenue
  const monthPaid = (monthPaidRes.data ?? []).reduce(
    (sum: number, inv: any) => sum + Number(inv.total),
    0
  );
  const monthOutstanding = (monthOutstandingRes.data ?? []).reduce(
    (sum: number, inv: any) => sum + Number(inv.total),
    0
  );
  const monthTotal = monthPaid + monthOutstanding;

  // Recent activity — merge and sort by created_at
  type ActivityItem = {
    id: string;
    type: "owner" | "pet" | "record" | "appointment";
    title: string;
    subtitle: string;
    created_at: string;
    href: string;
  };

  const recentActivity: ActivityItem[] = [
    ...(recentOwnersRes.data ?? []).map((o: any) => ({
      id: o.id,
      type: "owner" as const,
      title: `${o.first_name} ${o.last_name}`,
      subtitle: "New owner registered",
      created_at: o.created_at,
      href: `/dashboard/owners/${o.id}`,
    })),
    ...(recentPetsRes.data ?? []).map((p: any) => ({
      id: p.id,
      type: "pet" as const,
      title: p.name,
      subtitle: `New ${p.species} added`,
      created_at: p.created_at,
      href: `/dashboard/pets/${p.id}`,
    })),
    ...(recentRecordsRes.data ?? []).map((r: any) => ({
      id: r.id,
      type: "record" as const,
      title: r.pets?.name ?? "Unknown pet",
      subtitle: r.diagnosis ? `Dx: ${r.diagnosis}` : "Medical visit",
      created_at: r.created_at,
      href: `/dashboard/medical-records/${r.id}`,
    })),
    ...(recentApptsRes.data ?? []).map((a: any) => ({
      id: a.id,
      type: "appointment" as const,
      title: a.pets?.name ?? "Appointment",
      subtitle: a.reason ?? "Scheduled visit",
      created_at: a.created_at,
      href: `/dashboard/appointments/${a.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const activityColors: Record<string, string> = {
    owner: "bg-blue-500/10 text-blue-500",
    pet: "bg-emerald-500/10 text-emerald-500",
    record: "bg-purple-500/10 text-purple-500",
    appointment: "bg-amber-500/10 text-amber-500",
  };

  const activityIcons: Record<string, typeof Users> = {
    owner: Users,
    pet: Cat,
    record: FileText,
    appointment: CalendarDays,
  };

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of your clinic at a glance.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-card border-border hover:border-border transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Widgets Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Appointments */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base text-foreground">
                  Upcoming Appointments
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Next scheduled visits
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/appointments"
              className="text-xs text-emerald-600 hover:text-emerald-500 font-medium"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No upcoming appointments scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/dashboard/appointments/${apt.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-amber-600 leading-none">
                          {format(new Date(apt.start_time), "dd")}
                        </span>
                        <span className="text-[10px] text-amber-500 uppercase leading-none mt-0.5">
                          {format(new Date(apt.start_time), "MMM")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {apt.pets?.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.reason ?? "Scheduled visit"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(apt.start_time), "h:mm a")}
                      </p>
                      {apt.profiles?.full_name && (
                        <p className="text-xs text-muted-foreground">
                          Dr. {apt.profiles.full_name}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base text-foreground">
                  Revenue
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(now, "MMMM yyyy")}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/invoices"
              className="text-xs text-emerald-600 hover:text-emerald-500 font-medium"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Invoiced
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(monthTotal)}
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-emerald-600 font-medium">
                  Paid {formatCurrency(monthPaid)}
                </span>
                <span className="text-amber-600 font-medium">
                  Outstanding {formatCurrency(monthOutstanding)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{
                    width: monthTotal > 0 ? `${(monthPaid / monthTotal) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                    Collected
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {monthTotal > 0 ? `${Math.round((monthPaid / monthTotal) * 100)}%` : "—"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wider">
                    Pending
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(monthOutstanding)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">
                Recent Activity
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest updates across all modules
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No recent activity yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item) => {
                const Icon = activityIcons[item.type] ?? FileText;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activityColors[item.type]}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "MMM dd")}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        {format(new Date(item.created_at), "h:mm a")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
