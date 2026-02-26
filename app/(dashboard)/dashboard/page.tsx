import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Cat, CalendarDays, FileText } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch counts in parallel
  const [ownersRes, petsRes, appointmentsRes, invoicesRes] = await Promise.all([
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
  ]);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Dashboard
        </h1>
        <p className="text-zinc-400 mt-1">
          Overview of your clinic at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                {stat.label}
              </CardTitle>
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-zinc-100">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
