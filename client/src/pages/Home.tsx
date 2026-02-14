import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  CheckCircle2,
  IndianRupee,
  Users,
  ArrowRight,
  Bell,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/LanguageContext";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  invoiced: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Home() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: t("dashboard.pendingJobs"),
      value: (stats?.pendingJobs ?? 0) + (stats?.inProgressJobs ?? 0),
      subtitle: t("dashboard.openInProgress", {
        open: stats?.pendingJobs ?? 0,
        inProgress: stats?.inProgressJobs ?? 0,
      }),
      icon: ClipboardList,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: t("dashboard.completedJobs"),
      value: stats?.completedJobs ?? 0,
      subtitle: t("dashboard.totalCompletedInvoiced"),
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: t("dashboard.totalRevenue"),
      value: `₹${Number(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      subtitle: t("dashboard.fromCompletedJobs"),
      icon: IndianRupee,
      color: "text-primary",
      bg: "bg-primary/5",
    },
    {
      title: t("dashboard.customersVehicles"),
      value: stats?.totalCustomers ?? 0,
      subtitle: t("dashboard.vehiclesRegistered", { count: stats?.totalVehicles ?? 0 }),
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={`${stat.bg} p-2.5 rounded-xl`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t("dashboard.recentJobCards")}</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setLocation("/job-cards")}>
                {t("common.viewAll")} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stats?.recentJobs && stats.recentJobs.length > 0 ? (
              <div className="space-y-3">
                {stats.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => setLocation(`/job-cards/${job.id}`)}>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{job.jobNumber}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{job.description || t("common.noDescription")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[job.status] ?? "bg-gray-100 text-gray-700"}`}>{job.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                {t("dashboard.noJobCards")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t("dashboard.upcomingReminders")}</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setLocation("/reminders")}>
                {t("common.viewAll")} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stats?.upcomingReminders && stats.upcomingReminders.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{reminder.reminderType}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("reminders.due", { date: new Date(reminder.dueDate).toLocaleDateString() })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{reminder.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                {t("dashboard.noReminders")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
