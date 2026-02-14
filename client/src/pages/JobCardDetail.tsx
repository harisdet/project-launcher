import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Wrench,
  Package,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  invoiced: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function JobCardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const jobCardId = parseInt(id!);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);

  const { data: job, isLoading } = trpc.jobCard.getById.useQuery({ id: jobCardId });
  const { data: customer } = trpc.customer.getById.useQuery(
    { id: job?.customerId ?? 0 },
    { enabled: !!job?.customerId }
  );
  const { data: vehicle } = trpc.vehicle.getById.useQuery(
    { id: job?.vehicleId ?? 0 },
    { enabled: !!job?.vehicleId }
  );
  const { data: services } = trpc.serviceItem.list.useQuery({ jobCardId });
  const { data: partsList } = trpc.part.list.useQuery({ jobCardId });

  const updateStatusMutation = trpc.jobCard.update.useMutation({
    onSuccess: () => {
      utils.jobCard.getById.invalidate({ id: jobCardId });
      utils.dashboard.stats.invalidate();
      toast.success("Status updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const addServiceMutation = trpc.serviceItem.add.useMutation({
    onSuccess: () => {
      utils.serviceItem.list.invalidate({ jobCardId });
      utils.jobCard.getById.invalidate({ id: jobCardId });
      setServiceDialogOpen(false);
      toast.success("Service item added");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteServiceMutation = trpc.serviceItem.delete.useMutation({
    onSuccess: () => {
      utils.serviceItem.list.invalidate({ jobCardId });
      utils.jobCard.getById.invalidate({ id: jobCardId });
      toast.success("Service item removed");
    },
  });

  const addPartMutation = trpc.part.add.useMutation({
    onSuccess: () => {
      utils.part.list.invalidate({ jobCardId });
      utils.jobCard.getById.invalidate({ id: jobCardId });
      setPartDialogOpen(false);
      toast.success("Part added");
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePartMutation = trpc.part.delete.useMutation({
    onSuccess: () => {
      utils.part.list.invalidate({ jobCardId });
      utils.jobCard.getById.invalidate({ id: jobCardId });
      toast.success("Part removed");
    },
  });

  const deleteJobMutation = trpc.jobCard.delete.useMutation({
    onSuccess: () => {
      toast.success("Job card deleted");
      setLocation("/job-cards");
    },
    onError: (err) => toast.error(err.message),
  });

  const createReminderMutation = trpc.reminder.create.useMutation({
    onSuccess: () => {
      setReminderDialogOpen(false);
      toast.success("Reminder created");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addServiceMutation.mutate({
      jobCardId,
      description: fd.get("description") as string,
      laborCharge: fd.get("laborCharge") as string,
    });
  };

  const handleAddPart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const qty = parseInt(fd.get("quantity") as string) || 1;
    const price = parseFloat(fd.get("unitPrice") as string) || 0;
    addPartMutation.mutate({
      jobCardId,
      name: fd.get("name") as string,
      partNumber: (fd.get("partNumber") as string) || undefined,
      quantity: qty,
      unitPrice: price.toFixed(2),
      totalPrice: (qty * price).toFixed(2),
    });
  };

  const handleCreateReminder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!job) return;
    const fd = new FormData(e.currentTarget);
    const dueDateStr = fd.get("dueDate") as string;
    createReminderMutation.mutate({
      vehicleId: job.vehicleId,
      customerId: job.customerId,
      jobCardId,
      reminderType: fd.get("reminderType") as string,
      dueDate: new Date(dueDateStr).getTime(),
      message: (fd.get("message") as string) || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Job card not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/job-cards")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Job Cards
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/job-cards")} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{job.jobNumber}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[job.status]}`}>
              {job.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Created {new Date(job.createdAt).toLocaleDateString()}
            {job.completedAt && ` · Completed ${new Date(job.completedAt).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={job.status}
            onValueChange={(v) => updateStatusMutation.mutate({ id: jobCardId, status: v as any })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/job-cards/${jobCardId}/invoice`)}
          >
            <FileText className="h-4 w-4 mr-1" /> Invoice
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Job Card?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {job.jobNumber} and all associated service items and parts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteJobMutation.mutate({ id: jobCardId })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Job Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p
                className="text-sm font-medium text-primary cursor-pointer hover:underline"
                onClick={() => customer && setLocation(`/customers/${customer.id}`)}
              >
                {customer?.name ?? "Loading..."} · {customer?.phone}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vehicle</p>
              <p
                className="text-sm font-medium text-primary cursor-pointer hover:underline"
                onClick={() => vehicle && setLocation(`/vehicles/${vehicle.id}`)}
              >
                {vehicle?.registrationNumber} — {vehicle?.make} {vehicle?.model}
              </p>
            </div>
            {job.odometerReading && (
              <div>
                <p className="text-xs text-muted-foreground">Odometer</p>
                <p className="text-sm font-medium">{job.odometerReading.toLocaleString()} km</p>
              </div>
            )}
            {job.description && (
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{job.description}</p>
              </div>
            )}
            {job.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm">{job.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-3">Cost Summary</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Labor Charges</span>
                <span className="font-medium">₹{Number(job.totalLabor ?? 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parts Cost</span>
                <span className="font-medium">₹{Number(job.totalParts ?? 0).toLocaleString("en-IN")}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Grand Total</span>
                <span className="font-bold text-primary">₹{Number(job.grandTotal ?? 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="mt-4">
              <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Bell className="h-4 w-4 mr-1" /> Set Service Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Service Reminder</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateReminder} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Reminder Type *</Label>
                      <Input name="reminderType" required placeholder="e.g. Oil Change, General Service" />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date *</Label>
                      <Input name="dueDate" type="date" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Input name="message" placeholder="Optional reminder message" />
                    </div>
                    <Button type="submit" className="w-full" disabled={createReminderMutation.isPending}>
                      {createReminderMutation.isPending ? "Creating..." : "Create Reminder"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Items */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Service Items (Labor)
            </CardTitle>
            <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Service Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddService} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Input name="description" required placeholder="e.g. Engine oil change" />
                  </div>
                  <div className="space-y-2">
                    <Label>Labor Charge (₹) *</Label>
                    <Input name="laborCharge" required type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <Button type="submit" className="w-full" disabled={addServiceMutation.isPending}>
                    {addServiceMutation.isPending ? "Adding..." : "Add Service Item"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {services && services.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Charge</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{Number(s.laborCharge).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteServiceMutation.mutate({ id: s.id, jobCardId })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No service items added yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Parts */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" /> Parts Used
            </CardTitle>
            <Dialog open={partDialogOpen} onOpenChange={setPartDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Part
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Part</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddPart} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Part Name *</Label>
                    <Input name="name" required placeholder="e.g. Oil Filter" />
                  </div>
                  <div className="space-y-2">
                    <Label>Part Number</Label>
                    <Input name="partNumber" placeholder="Optional" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input name="quantity" type="number" required defaultValue="1" min="1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price (₹) *</Label>
                      <Input name="unitPrice" type="number" step="0.01" required placeholder="0.00" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={addPartMutation.isPending}>
                    {addPartMutation.isPending ? "Adding..." : "Add Part"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {partsList && partsList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead className="hidden sm:table-cell">Part #</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partsList.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {p.partNumber || "—"}
                    </TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right">
                      ₹{Number(p.unitPrice).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{Number(p.totalPrice).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deletePartMutation.mutate({ id: p.id, jobCardId })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No parts added yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
