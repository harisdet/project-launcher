import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Phone, Mail, Users } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { t } = useTranslation();

  const { data: customers, isLoading } = trpc.customer.list.useQuery(
    search ? { search } : undefined
  );

  const createMutation = trpc.customer.create.useMutation({
    onSuccess: () => {
      utils.customer.list.invalidate();
      setDialogOpen(false);
      toast.success(t("customers.addedSuccess"));
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      email: (fd.get("email") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("customers.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("customers.subtitle")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> {t("customers.addCustomer")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("customers.addNew")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("customers.name")} *</Label>
                <Input id="name" name="name" required placeholder={t("customers.customerName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("customers.phone")} *</Label>
                <Input id="phone" name="phone" required placeholder={t("customers.phoneNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("customers.email")}</Label>
                <Input id="email" name="email" type="email" placeholder={t("customers.emailAddress")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t("customers.address")}</Label>
                <Textarea id="address" name="address" placeholder={t("customers.fullAddress")} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("common.adding") : t("customers.addCustomer")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("customers.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          ) : customers && customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("customers.name")}</TableHead>
                  <TableHead>{t("customers.phone")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("customers.email")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("customers.address")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("customers.added")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setLocation(`/customers/${c.id}`)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm"><Phone className="h-3 w-3 text-muted-foreground" />{c.phone}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {c.email ? (<span className="flex items-center gap-1.5 text-sm"><Mail className="h-3 w-3 text-muted-foreground" />{c.email}</span>) : (<span className="text-muted-foreground text-sm">—</span>)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{c.address || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{search ? t("customers.noMatch") : t("customers.noCustomers")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
