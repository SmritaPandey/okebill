import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  Warehouse,
  AlertTriangle,
  Calendar,
  Plus,
  Minus,
  Edit,
  Scan,
  Filter,
  Download,
  Upload,
  Package
} from "lucide-react";
import { inventoryApi } from "@/lib/api-client";
import MainLayout from "@/components/layout/MainLayout";

interface AdjustStockRequest {
  tenantId: number;
  productId: number;
  outletId: number;
  adjustmentType: string;
  quantity: number;
  reason: string;
  notes: string;
  userId: number;
}

export function InventoryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [outletFilter, setOutletFilter] = useState("all");
  const [alertFilter, setAlertFilter] = useState("all");
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustmentType: "increase",
    quantity: 0,
    reason: "",
    notes: "",
  });

  const { data: stockData, isLoading } = useQuery<any>({
    queryKey: ["inventory", "stock-levels", outletFilter, alertFilter],
    queryFn: () => inventoryApi.getStockLevels({
      tenantId: 1,
      outletId: outletFilter !== 'all' ? parseInt(outletFilter) : undefined,
      lowStockOnly: alertFilter === "low_stock",
      expiringOnly: alertFilter === "expiring",
    }),
  });

  const adjustStockMutation = useMutation({
    mutationFn: (adjustment: AdjustStockRequest) => inventoryApi.adjustStock(adjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setIsAdjustDialogOpen(false);
      setSelectedStock(null);
      setAdjustmentData({
        adjustmentType: "increase",
        quantity: 0,
        reason: "",
        notes: "",
      });
      toast({
        title: "Success",
        description: "Stock adjusted successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to adjust stock:", error);
      toast({
        title: "Error",
        description: "Failed to adjust stock",
        variant: "destructive",
      });
    },
  });

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    const adjustment: AdjustStockRequest = {
      tenantId: 1,
      productId: selectedStock.productId,
      outletId: selectedStock.outletId,
      adjustmentType: adjustmentData.adjustmentType,
      quantity: adjustmentData.quantity,
      reason: adjustmentData.reason,
      notes: adjustmentData.notes,
      userId: parseInt(user?.id.toString() || "1")
    };

    adjustStockMutation.mutate(adjustment);
  };

  const openAdjustDialog = (stock: any) => {
    setSelectedStock(stock);
    setIsAdjustDialogOpen(true);
  };

  const getStockStatus = (stock: any) => {
    if (stock.expiryAlert) return { color: "bg-red-100 text-red-800", text: "Expiring" };
    if (stock.lowStockAlert) return { color: "bg-yellow-100 text-yellow-800", text: "Low Stock" };
    return { color: "bg-green-100 text-green-800", text: "In Stock" };
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="mt-2 text-gray-600">
              Monitor stock levels, track batches, and manage inventory
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Scan className="h-4 w-4 mr-2" />
              Scan Audit
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stockData?.items.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all outlets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stockData?.items.filter(s => s.lowStockAlert).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Need reordering
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stockData?.items?.filter(s => s.expiryAlert).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Within 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $0
              </div>
              <p className="text-xs text-muted-foreground">
                Inventory value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={outletFilter} onValueChange={setOutletFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Outlets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outlets</SelectItem>
                  <SelectItem value="1">Main Store</SelectItem>
                  <SelectItem value="2">Warehouse</SelectItem>
                </SelectContent>
              </Select>
              <Select value={alertFilter} onValueChange={setAlertFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low_stock">Low Stock Only</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => {
                setOutletFilter("all");
                setAlertFilter("all");
              }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stock Levels Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {stockData?.items.map((stock) => {
              const status = getStockStatus(stock);
              return (
                <Card key={`${stock.productId}-${stock.outletId}`} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{stock.productName}</CardTitle>
                        <CardDescription className="mt-1">
                          SKU: {stock.sku} | Outlet: {stock.outletName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustDialog(stock)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Adjust
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Stock Levels</p>
                        <div className="mt-1 space-y-1">
                          <p className="text-lg font-bold">
                            {stock.totalQuantity} total
                          </p>
                          <p className="text-sm text-gray-600">
                            {stock.availableQuantity} available, {stock.reservedQuantity} reserved
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700">Batches</p>
                        <div className="mt-1 space-y-1">
                          {stock.batches.slice(0, 3).map((batch, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{batch.quantity}</span>
                              {batch.batchNumber && (
                                <span className="text-gray-600 ml-1">
                                  (Batch: {batch.batchNumber})
                                </span>
                              )}
                              {batch.expiryDate && (
                                <span className="text-red-600 ml-1">
                                  Exp: {formatDate(batch.expiryDate)}
                                </span>
                              )}
                            </div>
                          ))}
                          {stock.batches.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{stock.batches.length - 3} more batches
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700">Alerts</p>
                        <div className="mt-1 space-y-1">
                          {stock.lowStockAlert && (
                            <div className="flex items-center text-yellow-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span className="text-sm">Low stock</span>
                            </div>
                          )}
                          {stock.expiryAlert && (
                            <div className="flex items-center text-red-600">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span className="text-sm">Items expiring soon</span>
                            </div>
                          )}
                          {!stock.lowStockAlert && !stock.expiryAlert && (
                            <span className="text-sm text-green-600">No alerts</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {stockData?.items.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Warehouse className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {alertFilter
                ? "No items match the selected filter"
                : "Start by adding products and stock levels"
              }
            </p>
          </div>
        )}

        {/* Stock Adjustment Dialog */}
        <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Stock</DialogTitle>
              <DialogDescription>
                {selectedStock && `Adjust stock for ${selectedStock.productName}`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                <Select
                  value={adjustmentData.adjustmentType}
                  onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, adjustmentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">Increase Stock</SelectItem>
                    <SelectItem value="decrease">Decrease Stock</SelectItem>
                    <SelectItem value="set">Set Stock Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select
                  value={adjustmentData.reason}
                  onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_count">Stock Count</SelectItem>
                    <SelectItem value="damaged">Damaged Goods</SelectItem>
                    <SelectItem value="expired">Expired Items</SelectItem>
                    <SelectItem value="theft">Theft/Loss</SelectItem>
                    <SelectItem value="return">Customer Return</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdjustDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={adjustStockMutation.isPending}>
                  {adjustStockMutation.isPending ? "Adjusting..." : "Adjust Stock"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

export default InventoryPage;
