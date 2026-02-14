import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Wrench } from "lucide-react";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const jobCardId = parseInt(id!);
  const [, setLocation] = useLocation();

  const { data, isLoading } = trpc.jobCard.invoiceData.useQuery({ jobCardId });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (!data || !data.job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice data not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/job-cards")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Job Cards
        </Button>
      </div>
    );
  }

  const { job, customer, vehicle, services, parts } = data;

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between no-print">
        <Button variant="ghost" onClick={() => setLocation(`/job-cards/${jobCardId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Job Card
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print Invoice
        </Button>
      </div>

      {/* Invoice */}
      <div className="bg-white rounded-xl shadow-sm border p-8 max-w-3xl mx-auto print:shadow-none print:border-0 print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Workshop Manager</h1>
              <p className="text-xs text-muted-foreground">Auto Repair & Service</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
            <p className="text-sm text-muted-foreground mt-1">{job.jobNumber}</p>
            <p className="text-xs text-muted-foreground">
              Date: {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Customer & Vehicle Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Bill To
            </p>
            <p className="font-semibold">{customer?.name}</p>
            <p className="text-sm text-muted-foreground">{customer?.phone}</p>
            {customer?.email && (
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            )}
            {customer?.address && (
              <p className="text-sm text-muted-foreground">{customer.address}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Vehicle Details
            </p>
            <p className="font-semibold">{vehicle?.registrationNumber}</p>
            <p className="text-sm text-muted-foreground">
              {vehicle?.make} {vehicle?.model} {vehicle?.year ? `(${vehicle.year})` : ""}
            </p>
            <p className="text-sm text-muted-foreground">Type: {vehicle?.vehicleType}</p>
            {job.odometerReading && (
              <p className="text-sm text-muted-foreground">
                Odometer: {job.odometerReading.toLocaleString()} km
              </p>
            )}
          </div>
        </div>

        {/* Service Items */}
        {services && services.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Service Items
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">#</th>
                  <th className="text-left py-2 font-semibold">Description</th>
                  <th className="text-right py-2 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s, i) => (
                  <tr key={s.id} className="border-b border-dashed">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2">{s.description}</td>
                    <td className="py-2 text-right font-medium">
                      ₹{Number(s.laborCharge).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="py-2 text-right font-semibold">
                    Labor Subtotal
                  </td>
                  <td className="py-2 text-right font-semibold">
                    ₹{Number(job.totalLabor ?? 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Parts */}
        {parts && parts.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Parts Used
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">#</th>
                  <th className="text-left py-2 font-semibold">Part</th>
                  <th className="text-right py-2 font-semibold">Qty</th>
                  <th className="text-right py-2 font-semibold">Unit Price</th>
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p, i) => (
                  <tr key={p.id} className="border-b border-dashed">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2">
                      {p.name}
                      {p.partNumber && (
                        <span className="text-muted-foreground ml-1">({p.partNumber})</span>
                      )}
                    </td>
                    <td className="py-2 text-right">{p.quantity}</td>
                    <td className="py-2 text-right">
                      ₹{Number(p.unitPrice).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 text-right font-medium">
                      ₹{Number(p.totalPrice).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="py-2 text-right font-semibold">
                    Parts Subtotal
                  </td>
                  <td className="py-2 text-right font-semibold">
                    ₹{Number(job.totalParts ?? 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Grand Total */}
        <div className="mt-6 pt-4 border-t-2 border-primary/20">
          <div className="flex justify-between items-center">
            <div>
              {job.description && (
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="font-medium">Work Description:</span> {job.description}
                </p>
              )}
              {job.notes && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Notes:</span> {job.notes}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Grand Total</p>
              <p className="text-3xl font-bold text-primary">
                ₹{Number(job.grandTotal ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Thank you for your business. This is a computer-generated invoice.
          </p>
        </div>
      </div>
    </div>
  );
}
