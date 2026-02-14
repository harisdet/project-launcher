import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Car } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: vehicles, isLoading } = trpc.vehicle.list.useQuery(
    search ? { search } : undefined
  );

  const { data: customersList } = trpc.customer.list.useQuery();

  const createVehicleMutation = trpc.vehicle.create.useMutation({
    onSuccess: (data) => {
      utils.vehicle.list.invalidate();
      setDialogOpen(false);
      setSelectedCustomerId("");
      toast.success("Vehicle added successfully");
      setLocation(`/vehicles/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    const fd = new FormData(e.currentTarget);
    createVehicleMutation.mutate({
      customerId: parseInt(selectedCustomerId),
      registrationNumber: fd.get("registrationNumber") as string,
      vehicleType: fd.get("vehicleType") as "2-wheeler" | "4-wheeler",
      make: fd.get("make") as string,
      model: fd.get("model") as string,
      year: fd.get("year") ? parseInt(fd.get("year") as string) : undefined,
      color: (fd.get("color") as string) || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground mt-1">
            All registered vehicles across customers
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedCustomerId("");
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="space-y-2">
                <Label>Owner (Customer) *</Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customersList?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} — {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Registration Number *</Label>
                <Input
                  name="registrationNumber"
                  required
                  placeholder="e.g. MH01AB1234"
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Type *</Label>
                <select
                  name="vehicleType"
                  required
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="2-wheeler">2-Wheeler</option>
                  <option value="4-wheeler">4-Wheeler</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Make *</Label>
                  <Input name="make" required placeholder="e.g. Honda" />
                </div>
                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Input name="model" required placeholder="e.g. City" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input name="year" type="number" placeholder="e.g. 2023" />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input name="color" placeholder="e.g. White" />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createVehicleMutation.isPending}
              >
                {createVehicleMutation.isPending ? "Adding..." : "Add Vehicle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by registration, make, or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : vehicles && vehicles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="hidden md:table-cell">Year</TableHead>
                  <TableHead className="hidden md:table-cell">Color</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer"
                    onClick={() => setLocation(`/vehicles/${v.id}`)}
                  >
                    <TableCell className="font-medium">
                      {v.registrationNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {v.vehicleType}
                      </Badge>
                    </TableCell>
                    <TableCell>{v.make}</TableCell>
                    <TableCell>{v.model}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {v.year || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {v.color || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                {search
                  ? "No vehicles match your search."
                  : "No vehicles registered yet. Add your first vehicle to get started."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
