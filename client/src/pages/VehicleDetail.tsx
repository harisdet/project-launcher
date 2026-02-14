import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Car, ClipboardList, History } from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  invoiced: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = parseInt(id!);
  const [, setLocation] = useLocation();

  const { data: vehicle, isLoading } = trpc.vehicle.getById.useQuery({ id: vehicleId });
  const { data: customer } = trpc.customer.getById.useQuery(
    { id: vehicle?.customerId ?? 0 },
    { enabled: !!vehicle?.customerId }
  );
  const { data: serviceHistory } = trpc.jobCard.serviceHistory.useQuery({ vehicleId });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vehicle not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/vehicles")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Vehicles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/vehicles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{vehicle.registrationNumber}</h1>
          <p className="text-muted-foreground text-sm">
            {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
          </p>
        </div>
        <Badge variant="outline">{vehicle.vehicleType}</Badge>
      </div>

      {/* Vehicle Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              <p
                className="text-sm font-medium text-primary cursor-pointer hover:underline"
                onClick={() => customer && setLocation(`/customers/${customer.id}`)}
              >
                {customer?.name ?? "Loading..."}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-medium">{vehicle.vehicleType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Color</p>
              <p className="text-sm font-medium">{vehicle.color || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registered</p>
              <p className="text-sm font-medium">{new Date(vehicle.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service History */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-4 w-4" /> Service History
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setLocation(`/job-cards?vehicleId=${vehicleId}`)}
            >
              <ClipboardList className="h-4 w-4 mr-1" /> New Job Card
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {serviceHistory && serviceHistory.length > 0 ? (
            <div className="space-y-3">
              {serviceHistory.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/job-cards/${job.id}`)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{job.jobNumber}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[job.status]}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {job.description || "No description"} &middot; {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    ₹{Number(job.grandTotal ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Car className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No service history for this vehicle.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
