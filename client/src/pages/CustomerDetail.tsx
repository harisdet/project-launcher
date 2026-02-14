import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Car, Phone, Mail, MapPin, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id!);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [editOpen, setEditOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const { t } = useTranslation();

  const { data: customer, isLoading } = trpc.customer.getById.useQuery({ id: customerId });
  const { data: vehicles } = trpc.vehicle.byCustomer.useQuery({ customerId });

  const updateMutation = trpc.customer.update.useMutation({
    onSuccess: () => {
      utils.customer.getById.invalidate({ id: customerId });
      setEditOpen(false);
      toast.success(t("customers.updatedSuccess"));
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.customer.delete.useMutation({
    onSuccess: () => {
      toast.success(t("customers.deletedSuccess"));
      setLocation("/customers");
    },
    onError: (err) => toast.error(err.message),
  });

  const createVehicleMutation = trpc.vehicle.create.useMutation({
    onSuccess: () => {
      utils.vehicle.byCustomer.invalidate({ customerId });
      setVehicleDialogOpen(false);
      toast.success(t("vehicles.addedSuccess"));
    },
    onError: (err) => toast.error(err.message),
  });

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: customerId,
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      email: (fd.get("email") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
    });
  };

  const handleAddVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createVehicleMutation.mutate({
      customerId,
      registrationNumber: fd.get("registrationNumber") as string,
      vehicleType: fd.get("vehicleType") as "2-wheeler" | "4-wheeler",
      make: fd.get("make") as string,
      model: fd.get("model") as string,
      year: fd.get("year") ? parseInt(fd.get("year") as string) : undefined,
      color: (fd.get("color") as string) || undefined,
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

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("customers.notFound")}</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/customers")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("customers.backToCustomers")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/customers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">{t("customers.customerSince", { date: new Date(customer.createdAt).toLocaleDateString() })}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" /> {t("common.edit")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("customers.editCustomer")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("customers.name")} *</Label>
                  <Input id="name" name="name" required defaultValue={customer.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("customers.phone")} *</Label>
                  <Input id="phone" name="phone" required defaultValue={customer.phone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("customers.email")}</Label>
                  <Input id="email" name="email" type="email" defaultValue={customer.email ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("customers.address")}</Label>
                  <Textarea id="address" name="address" defaultValue={customer.address ?? ""} rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? t("common.saving") : t("common.saveChanges")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("customers.deleteCustomer")}</AlertDialogTitle>
                <AlertDialogDescription>{t("customers.deleteConfirm", { name: customer.name })}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate({ id: customerId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center"><Phone className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t("customers.phone")}</p>
                <p className="text-sm font-medium">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center"><Mail className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t("customers.email")}</p>
                <p className="text-sm font-medium">{customer.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center"><MapPin className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t("customers.address")}</p>
                <p className="text-sm font-medium">{customer.address || "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{t("nav.vehicles")}</CardTitle>
            <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t("vehicles.addVehicle")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("vehicles.addVehicle")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddVehicle} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("vehicles.registrationNumber")} *</Label>
                    <Input name="registrationNumber" required placeholder="e.g. MH01AB1234" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("vehicles.vehicleType")} *</Label>
                    <select name="vehicleType" required className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                      <option value="2-wheeler">{t("vehicles.twoWheeler")}</option>
                      <option value="4-wheeler">{t("vehicles.fourWheeler")}</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("vehicles.make")} *</Label>
                      <Input name="make" required placeholder="e.g. Honda" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("vehicles.model")} *</Label>
                      <Input name="model" required placeholder="e.g. City" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("vehicles.year")}</Label>
                      <Input name="year" type="number" placeholder="e.g. 2023" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("vehicles.color")}</Label>
                      <Input name="color" placeholder="e.g. White" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createVehicleMutation.isPending}>
                    {createVehicleMutation.isPending ? t("common.adding") : t("vehicles.addVehicle")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {vehicles && vehicles.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {vehicles.map((v) => (
                <div key={v.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setLocation(`/vehicles/${v.id}`)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center"><Car className="h-5 w-5 text-primary" /></div>
                      <div>
                        <p className="font-medium text-sm">{v.registrationNumber}</p>
                        <p className="text-xs text-muted-foreground">{v.make} {v.model} {v.year ? `(${v.year})` : ""}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{v.vehicleType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Car className="h-8 w-8 mx-auto mb-2 opacity-40" />
              {t("vehicles.noVehiclesForCustomer")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
