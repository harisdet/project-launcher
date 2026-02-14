import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ClipboardList, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  invoiced: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function JobCardsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { t } = useTranslation();

  const filters = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
  }), [statusFilter, search]);

  const { data: jobCardsList, isLoading } = trpc.jobCard.list.useQuery(filters);
  const { data: customersList } = trpc.customer.list.useQuery();
  const { data: vehiclesList } = trpc.vehicle.byCustomer.useQuery(
    { customerId: selectedCustomerId! },
    { enabled: !!selectedCustomerId }
  );

  const createMutation = trpc.jobCard.create.useMutation({
    onSuccess: (data) => {
      utils.jobCard.list.invalidate();
      setDialogOpen(false);
      toast.success(t("jobCards.createdSuccess", { jobNumber: data.jobNumber }));
      setLocation(`/job-cards/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId) {
      toast.error(t("jobCards.selectCustomerVehicle"));
      return;
    }
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      customerId: selectedCustomerId,
      vehicleId: selectedVehicleId,
      description: (fd.get("description") as string) || undefined,
      odometerReading: fd.get("odometerReading") ? parseInt(fd.get("odometerReading") as string) : undefined,
      notes: (fd.get("notes") as string) || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("jobCards.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("jobCards.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setSelectedCustomerId(null); setSelectedVehicleId(null); }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> {t("jobCards.newJobCard")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("jobCards.createJobCard")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("jobCards.customer")} *</Label>
                <Select value={selectedCustomerId?.toString() ?? ""} onValueChange={(v) => { setSelectedCustomerId(parseInt(v)); setSelectedVehicleId(null); }}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t("jobCards.selectCustomer")} /></SelectTrigger>
                  <SelectContent>
                    {customersList?.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name} — {c.phone}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("jobCards.vehicle")} *</Label>
                <Select value={selectedVehicleId?.toString() ?? ""} onValueChange={(v) => setSelectedVehicleId(parseInt(v))} disabled={!selectedCustomerId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={selectedCustomerId ? t("jobCards.selectVehicle") : t("jobCards.selectCustomerFirst")} /></SelectTrigger>
                  <SelectContent>
                    {vehiclesList?.map((v) => (<SelectItem key={v.id} value={v.id.toString()}>{v.registrationNumber} — {v.make} {v.model}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("jobCards.description")}</Label>
                <Textarea name="description" placeholder={t("jobCards.descriptionPlaceholder")} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{t("jobCards.odometerReading")}</Label>
                <Input name="odometerReading" type="number" placeholder="e.g. 45000" />
              </div>
              <div className="space-y-2">
                <Label>{t("jobCards.notes")}</Label>
                <Textarea name="notes" placeholder={t("jobCards.notesPlaceholder")} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("common.creating") : t("jobCards.createJobCard")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("jobCards.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("jobCards.allStatus")}</SelectItem>
            <SelectItem value="open">{t("jobCards.open")}</SelectItem>
            <SelectItem value="in-progress">{t("jobCards.inProgress")}</SelectItem>
            <SelectItem value="completed">{t("jobCards.completed")}</SelectItem>
            <SelectItem value="invoiced">{t("jobCards.invoiced")}</SelectItem>
            <SelectItem value="cancelled">{t("jobCards.cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          ) : jobCardsList && jobCardsList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("jobCards.jobNumber")}</TableHead>
                  <TableHead>{t("jobCards.description")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.total")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("common.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobCardsList.map((job) => (
                  <TableRow key={job.id} className="cursor-pointer" onClick={() => setLocation(`/job-cards/${job.id}`)}>
                    <TableCell className="font-medium">{job.jobNumber}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{job.description || <span className="text-muted-foreground">{t("common.noDescription")}</span>}</TableCell>
                    <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[job.status]}`}>{job.status}</span></TableCell>
                    <TableCell className="hidden md:table-cell font-medium">₹{Number(job.grandTotal ?? 0).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{search || statusFilter !== "all" ? t("jobCards.noMatch") : t("jobCards.noJobCards")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
