import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Car } from "lucide-react";
import { useLocation } from "wouter";

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: vehicles, isLoading } = trpc.vehicle.list.useQuery(
    search ? { search } : undefined
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
        <p className="text-muted-foreground mt-1">
          All registered vehicles across customers
        </p>
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
                    <TableCell className="font-medium">{v.registrationNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {v.vehicleType}
                      </Badge>
                    </TableCell>
                    <TableCell>{v.make}</TableCell>
                    <TableCell>{v.model}</TableCell>
                    <TableCell className="hidden md:table-cell">{v.year || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{v.color || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                {search ? "No vehicles match your search." : "No vehicles registered yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
