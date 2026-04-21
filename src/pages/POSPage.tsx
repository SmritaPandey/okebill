import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { BarcodeScanner } from "../components/BarcodeScanner";
import {
  ShoppingCart,
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Receipt,
  User,
  Calculator,
  Camera
} from "lucide-react";
import { productsApi, posApi } from "@/lib/api-client";
import MainLayout from "@/components/layout/MainLayout";

interface CreateSaleRequest {
  tenantId: number;
  outletId: number;
  customerId?: number;
  items: any[];
  discountAmount: number;
  taxAmount: number;
  paymentMethod: string;
  userId: number;
}

interface CartItem {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  batchNumber?: string;
  serialNumber?: string;
}

export function POSPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults } = useQuery<any>({
    queryKey: ["products", "search", searchQuery],
    queryFn: () => productsApi.search({ tenantId: 1, query: searchQuery }),
    enabled: searchQuery.length > 0,
  });

  const createSaleMutation = useMutation({
    mutationFn: (sale: any) => posApi.createTransaction(sale),
    onSuccess: (sale: any) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setCart([]);
      setDiscountAmount(0);
      setTaxAmount(0);
      setCustomerId(undefined);
      setSearchQuery("");
      toast({
        title: "Sale completed!",
        description: `Transaction ${sale.transactionNumber} for ${formatCurrency(sale.totalAmount)}`,
      });
    },
    onError: (error) => {
      console.error("Failed to create sale:", error);
      toast({
        title: "Error",
        description: "Failed to complete sale",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const unitPrice = product.pricing?.sellingPrice || product.pricing?.basePrice || 0;
      const newItem: CartItem = {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: 1,
        unitPrice,
        discountAmount: 0,
        lineTotal: unitPrice,
      };
      setCart([...cart, newItem]);
    }

    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? {
          ...item,
          quantity: newQuantity,
          lineTotal: (newQuantity * item.unitPrice) - item.discountAmount
        }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateItemDiscount = (productId: number, discountAmount: number) => {
    setCart(cart.map(item =>
      item.productId === productId
        ? {
          ...item,
          discountAmount,
          lineTotal: (item.quantity * item.unitPrice) - discountAmount
        }
        : item
    ));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, total };
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    const { subtotal, total } = calculateTotals();

    const saleRequest = {
      tenantId: 1,
      outletId: 1,
      customerId,
      transactionType: 'sale',
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        batchNumber: item.batchNumber,
        serialNumber: item.serialNumber,
      })),
      discountAmount,
      taxAmount,
      paymentMethod,
      createdBy: parseInt(user?.id.toString() || "1"),
    };

    createSaleMutation.mutate(saleRequest);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setSearchQuery(barcode);
    // The search will automatically trigger and show results
  };

  const { subtotal, total } = calculateTotals();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
            <p className="mt-2 text-gray-600">
              Scan or search products to add them to the cart
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Live
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search & Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Product Search</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search by name, SKU, or scan barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowScanner(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults && searchResults.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.products.map((product) => (
                      <div
                        key={product.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => addToCart(product)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                            {product.brand && (
                              <p className="text-sm text-gray-500">{product.brand}</p>
                            )}
                            <div className="mt-2">
                              <span className="text-lg font-bold text-green-600">
                                {formatCurrency(product.pricing?.sellingPrice || product.pricing?.basePrice || 0)}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                Stock: {product.currentStock || 0}
                              </span>
                            </div>
                          </div>
                          <Button size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <User className="h-6 w-6 mb-2" />
                    <span className="text-sm">Customer</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Calculator className="h-6 w-6 mb-2" />
                    <span className="text-sm">Calculator</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Receipt className="h-6 w-6 mb-2" />
                    <span className="text-sm">Last Sale</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => setShowScanner(true)}
                  >
                    <Scan className="h-6 w-6 mb-2" />
                    <span className="text-sm">Scan Mode</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart & Checkout */}
          <div className="space-y-6">
            {/* Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Cart</span>
                  </span>
                  <Badge variant="secondary">
                    {cart.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.sku}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg touch-manipulation"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-semibold text-lg">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg touch-manipulation"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(item.lineTotal)}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.unitPrice)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Cart is empty</p>
                      <p className="text-sm">Search and add products to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Totals & Checkout */}
            {cart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Checkout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={paymentMethod === "cash" ? "default" : "outline"}
                        className="h-12 text-base touch-manipulation"
                        onClick={() => setPaymentMethod("cash")}
                      >
                        <DollarSign className="h-5 w-5 mr-2" />
                        Cash
                      </Button>
                      <Button
                        variant={paymentMethod === "card" ? "default" : "outline"}
                        className="h-12 text-base touch-manipulation"
                        onClick={() => setPaymentMethod("card")}
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        Card
                      </Button>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    className="w-full h-14 text-lg font-semibold rounded-xl shadow-md shadow-red-200 touch-manipulation"
                    onClick={handleCheckout}
                    disabled={createSaleMutation.isPending}
                  >
                    {createSaleMutation.isPending ? (
                      "Processing..."
                    ) : (
                      <>
                        <Receipt className="h-5 w-5 mr-2" />
                        Complete Sale — {formatCurrency(total)}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Barcode Scanner */}
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScanned}
        />
      </div>
    </MainLayout>
  );
}

export default POSPage;
