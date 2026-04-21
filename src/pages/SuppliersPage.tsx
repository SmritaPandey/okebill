import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Search,
  Truck,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Clock,
  DollarSign
} from "lucide-react";
import { suppliersApi } from "@/lib/api-client";
import MainLayout from "@/components/layout/MainLayout";

interface SupplierForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: string;
  paymentTerms: string;
}

const emptyForm: SupplierForm = { name: "", email: "", phone: "", address: "", leadTimeDays: "7", paymentTerms: "30" };

export function SuppliersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SupplierForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["suppliers", "list", searchTerm],
    queryFn: () => suppliersApi.list({ tenantId: 1, search: searchTerm || undefined }),
  });

  const suppliers = data?.suppliers || [];

  const createMutation = useMutation({
    mutationFn: (data: SupplierForm) => suppliersApi.create({
      tenantId: 1,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address ? { street: data.address } : undefined,
      leadTimeDays: parseInt(data.leadTimeDays) || 7,
      paymentTerms: parseInt(data.paymentTerms) || 30,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsCreateDialogOpen(false);
      setFormData(emptyForm);
      toast({ title: "Success", description: "Supplier created successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierForm }) => suppliersApi.update(id, {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address ? { street: data.address } : undefined,
      leadTimeDays: parseInt(data.leadTimeDays) || 7,
      paymentTerms: parseInt(data.paymentTerms) || 30,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsEditDialogOpen(false);
      setFormData(emptyForm);
      setEditId(null);
      toast({ title: "Success", description: "Supplier updated successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDeleteId(null);
      toast({ title: "Success", description: "Supplier deleted successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (supplier: any) => {
    setEditId(supplier.id);
    setFormData({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: typeof supplier.address === "object" ? supplier.address?.street || "" : supplier.address || "",
      leadTimeDays: String(supplier.leadTimeDays || 7),
      paymentTerms: String(supplier.paymentTerms || 30),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) updateMutation.mutate({ id: editId, data: formData });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const getSupplierBadge = (supplier: any) => {
    if (supplier.status === "preferred") return <Badge className="bg-green-100 text-green-800">Preferred</Badge>;
    if (supplier.creditLimit > 150000) return <Badge className="bg-red-100 text-red-800">Major</Badge>;
    return <Badge variant="secondary">Active</Badge>;
  };

  const SupplierFormFields = ({ onSubmit, submitLabel, isPending }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string; isPending: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name *</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="ABC Wholesale Co." required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="orders@supplier.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+1 (555) 123-4567" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="100 Industrial Blvd, City" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leadTime">Lead Time (days)</Label>
          <Input id="leadTime" type="number" value={formData.leadTimeDays} onChange={(e) => setFormData(prev => ({ ...prev, leadTimeDays: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
          <Input id="paymentTerms" type="number" value={formData.paymentTerms} onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); setFormData(emptyForm); }}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="mt-2 text-gray-600">Manage your supplier relationships and purchase orders</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) setFormData(emptyForm); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Supplier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogDescription>Create a new supplier profile</DialogDescription>
              </DialogHeader>
              <SupplierFormFields onSubmit={handleCreate} submitLabel="Create Supplier" isPending={createMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">Active suppliers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preferred</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{suppliers.filter((s: any) => s.status === "preferred").length}</div>
              <p className="text-xs text-muted-foreground">Top tier partners</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Lead Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length > 0 ? Math.round(suppliers.reduce((sum: number, s: any) => sum + (s.leadTimeDays || 0), 0) / suppliers.length) : 0} days</div>
              <p className="text-xs text-muted-foreground">Delivery time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(suppliers.reduce((sum: number, s: any) => sum + (s.creditLimit || 0), 0))}</div>
              <p className="text-xs text-muted-foreground">Credit limits</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search suppliers by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier: any) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {supplier.supplierCode || `Supplier #${supplier.id}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getSupplierBadge(supplier)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />{supplier.email}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />{supplier.phone}
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {typeof supplier.address === "object" ? supplier.address.street || JSON.stringify(supplier.address) : supplier.address}
                    </div>
                  )}

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lead Time:</span>
                      <span className="font-medium">{supplier.leadTimeDays || 0} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Terms:</span>
                      <span className="font-medium">{supplier.paymentTerms || 0} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Credit Limit:</span>
                      <span className="font-medium">{formatCurrency(supplier.creditLimit || 0)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(supplier)}>
                      <Edit className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteId(supplier.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {suppliers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first supplier</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setFormData(emptyForm); setEditId(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>Update supplier information</DialogDescription>
            </DialogHeader>
            <SupplierFormFields onSubmit={handleUpdate} submitLabel="Save Changes" isPending={updateMutation.isPending} />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
              <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}

export default SuppliersPage;
