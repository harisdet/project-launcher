import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, X, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";

export default function RemindersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const utils = trpc.useUtils();
  const { t } = useTranslation();

  const filters = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
  }), [statusFilter]);

  const { data: remindersList, isLoading } = trpc.reminder.list.useQuery(filters);
  const { data: vehicles } = trpc.vehicle.list.useQuery();
  const { data: customersList } = trpc.customer.list.useQuery();

  const updateMutation = trpc.reminder.update.useMutation({
    onSuccess: () => {
      utils.reminder.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success(t("reminders.updated"));
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.reminder.delete.useMutation({
    onSuccess: () => {
      utils.reminder.list.invalidate();
      toast.success(t("reminders.deleted"));
    },
  });

  const getVehicleInfo = (vehicleId: number) => {
    const v = vehicles?.find((v) => v.id === vehicleId);
    return v ? `${v.registrationNumber} — ${v.make} ${v.model}` : "—";
  };

  const getCustomerName = (customerId: number) => {
    const c = customersList?.find((c) => c.id === customerId);
    return c?.name ?? "—";
  };

  const isOverdue = (dueDate: number) => dueDate < Date.now();
  const isDueSoon = (dueDate: number) => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return dueDate >= Date.now() && dueDate <= Date.now() + sevenDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("reminders.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("reminders.subtitle")}</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("reminders.allStatus")}</SelectItem>
            <SelectItem value="pending">{t("reminders.pending")}</SelectItem>
            <SelectItem value="sent">{t("reminders.sent")}</SelectItem>
            <SelectItem value="dismissed">{t("reminders.dismissed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}
        </div>
      ) : remindersList && remindersList.length > 0 ? (
        <div className="space-y-3">
          {remindersList.map((r) => {
            const overdue = r.status === "pending" && isOverdue(r.dueDate);
            const dueSoon = r.status === "pending" && isDueSoon(r.dueDate);

            return (
              <Card key={r.id} className={`border-0 shadow-sm ${overdue ? "ring-1 ring-destructive/30" : dueSoon ? "ring-1 ring-amber-300" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${overdue ? "bg-destructive/10" : dueSoon ? "bg-amber-50" : "bg-primary/5"}`}>
                        <Bell className={`h-5 w-5 ${overdue ? "text-destructive" : dueSoon ? "text-amber-600" : "text-primary"}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{r.reminderType}</p>
                          {overdue && (<Badge variant="destructive" className="text-xs">{t("reminders.overdue")}</Badge>)}
                          {dueSoon && !overdue && (<Badge className="text-xs bg-amber-100 text-amber-700 border-0">{t("reminders.dueSoon")}</Badge>)}
                          <Badge variant="outline" className="text-xs">{r.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{getCustomerName(r.customerId)} · {getVehicleInfo(r.vehicleId)}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {t("reminders.due", { date: new Date(r.dueDate).toLocaleDateString() })}
                        </div>
                        {r.message && (<p className="text-xs text-muted-foreground mt-1">{r.message}</p>)}
                      </div>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateMutation.mutate({ id: r.id, status: "sent" })} title={t("reminders.markAsSent")}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => updateMutation.mutate({ id: r.id, status: "dismissed" })} title={t("reminders.dismiss")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{statusFilter !== "all" ? t("reminders.noMatch") : t("reminders.noReminders")}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
