import React, { useState, useEffect } from "react";
import { Product, CartItem, Order } from "./types";
import ProductCard from "./components/ProductCard";
import ProductDetail from "./components/ProductDetail";
import Cart from "./components/Cart";
import AdminPanel from "./components/AdminPanel";
import TelegramFrame from "./components/TelegramFrame";
import { ShoppingBag, ShoppingCart, User, Clock, Settings, Search, RefreshCw, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Navigation tabs: 'shop' | 'cart' | 'orders' | 'admin'
  const [activeTab, setActiveTab] = useState<"shop" | "cart" | "orders" | "admin">("shop");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [searchTerm, setSearchTerm] = useState("");

  // Diagnostics & Telegram Bot state
  const [botInfo, setBotInfo] = useState<any>(null);
  const [webhookStatus, setWebhookStatus] = useState<{ success: boolean; url: string } | null>(null);
  const [isTelegramWebview, setIsTelegramWebview] = useState(false);

  // Initialize Telegram WebApp on mount
  useEffect(() => {
    const tgObj = (window as any).Telegram?.WebApp;
    if (tgObj) {
      tgObj.ready();
      tgObj.expand();
      setIsTelegramWebview(true);
      
      // Map Telegram themeParams to CSS variables
      if (tgObj.themeParams) {
        const root = document.documentElement;
        Object.entries(tgObj.themeParams).forEach(([key, value]) => {
          root.style.setProperty(`--tg-theme-${key.replace(/_/g, "-")}`, value as string);
        });
      }
    }

    // Load initial products, orders and diagnostics
    fetchProducts();
    fetchOrders();
    fetchBotInfo();

    // Check if '?admin=true' is set in query (e.g. from the admin button)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("admin") === "true") {
      setActiveTab("admin");
    }
  }, []);

  // Update Telegram Native MainButton
  useEffect(() => {
    const tgObj = (window as any).Telegram?.WebApp;
    if (tgObj) {
      const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
      const totalPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

      if (totalCount > 0 && activeTab === "shop") {
        tgObj.MainButton.setText(`ПОСМОТРЕТЬ ЗАКАЗ (${totalCount} шт. • ${totalPrice} ₽)`);
        tgObj.MainButton.show();
        
        // Define click behavior
        const handleMainButtonClick = () => {
          setActiveTab("cart");
        };
        
        tgObj.MainButton.onClick(handleMainButtonClick);
        
        // Cleanup listener on next trigger
        return () => {
          tgObj.MainButton.offClick(handleMainButtonClick);
        };
      } else {
        tgObj.MainButton.hide();
      }
    }
  }, [cart, activeTab]);

  // REST API fetches
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchBotInfo = async () => {
    try {
      const res = await fetch("/api/bot-info");
      const data = await res.json();
      setBotInfo(data);
      if (data.webhook?.url) {
        setWebhookStatus({ success: true, url: data.webhook.url });
      }

      // Auto-register webhook if it is missing or points to a different domain
      const expectedWebhookUrl = `${window.location.origin}/api/bot-webhook`;
      if (!data.webhook?.url || !data.webhook.url.startsWith(window.location.origin)) {
        console.log("Webhook is missing or points to a different domain. Auto-registering...");
        try {
          const setRes = await fetch("/api/set-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: window.location.origin })
          });
          const setData = await setRes.json();
          if (setData.success) {
            setWebhookStatus({ success: true, url: expectedWebhookUrl });
            const updatedRes = await fetch("/api/bot-info");
            const updatedData = await updatedRes.json();
            setBotInfo(updatedData);
          }
        } catch (webhookErr) {
          console.error("Failed to auto-register webhook:", webhookErr);
        }
      }
    } catch (err) {
      console.error("Error fetching bot info:", err);
    }
  };

  const handleRefreshWebhook = async () => {
    try {
      const res = await fetch("/api/set-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: window.location.origin })
      });
      const data = await res.json();
      if (data.success) {
        setWebhookStatus({ success: true, url: `${window.location.origin}/api/bot-webhook` });
        fetchBotInfo();
        alert("Воркинг! Вебхук бота успешно связан с текущим URL-адресом приложения.");
      } else {
        alert("Не удалось связать вебхук. Убедитесь, что бот-токен верен.");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при установке вебхука.");
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, size: string) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size
      );
      if (existingIdx > -1) {
        const nextCart = [...prevCart];
        nextCart[existingIdx].quantity += 1;
        return nextCart;
      }
      return [...prevCart, { product, quantity: 1, selectedSize: size }];
    });
  };

  const handleRemoveFromCart = (product: Product, size: string) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size
      );
      if (existingIdx > -1) {
        const nextCart = [...prevCart];
        if (nextCart[existingIdx].quantity <= 1) {
          return nextCart.filter((_, idx) => idx !== existingIdx);
        } else {
          nextCart[existingIdx].quantity -= 1;
          return nextCart;
        }
      }
      return prevCart;
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Checkout call
  const handleCheckout = async (orderData: {
    items: any[];
    total: number;
    telegramUser: any;
    paymentMethod: "telegram_pay" | "cash_on_delivery" | "demo_pay";
  }) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });
    const order = await res.json();
    fetchOrders(); // Refresh order histories
    fetchProducts(); // Refresh stocks
    return order;
  };

  // CRUD Admin functions
  const handleAddProduct = async (newProduct: Omit<Product, "id">) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct)
    });
    const saved = await res.json();
    fetchProducts();
    return saved;
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    const updated = await res.json();
    fetchProducts();
    return updated;
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();
    fetchProducts();
    return data.success;
  };

  const handleUpdateOrderStatus = async (id: string, status: Order["status"]) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const updated = await res.json();
    fetchOrders();
    return updated;
  };

  // Cart total count helper for tab counter
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Filters
  const categoriesList = ["Все", "Худи", "Футболки", "Брюки", "Куртки", "Аксессуары"];
  
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "Все" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <TelegramFrame
      botName="Telegram Cloth Shop"
      botUsername={botInfo?.bot?.username || "cloth_shop_bot"}
      onRefreshWebhook={handleRefreshWebhook}
      webhookStatus={webhookStatus}
    >
      <div className="w-full h-full bg-white flex flex-col overflow-hidden relative">
        
        {/* Main Content Render Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            
            {/* SHOP CATALOGUE TAB */}
            {activeTab === "shop" && (
              <motion.div
                key="shop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col overflow-hidden"
              >
                {/* Search Bar Segment */}
                <div className="px-4 pt-3.5 pb-2 shrink-0 flex flex-col gap-3 border-b border-slate-100">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Поиск одежды..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-10 bg-slate-100 border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-9 pr-4 text-xs transition outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                  </div>

                  {/* Horizontal Categories Row */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`h-7 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition duration-150 ${
                          selectedCategory === cat
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Catalog Grid */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400">
                      Товары не найдены
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pb-8">
                      {filteredProducts.map((p) => {
                        // Calc aggregate quantities in cart for this product across all sizes
                        const qty = cart
                          .filter((item) => item.product.id === p.id)
                          .reduce((acc, item) => acc + item.quantity, 0);

                        return (
                          <ProductCard
                            key={p.id}
                            product={p}
                            cartQuantity={qty}
                            onAddToCart={handleAddToCart}
                            onRemoveFromCart={handleRemoveFromCart}
                            onSelectProduct={setSelectedProduct}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* CART CHECKOUT TAB */}
            {activeTab === "cart" && (
              <motion.div
                key="cart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full overflow-hidden"
              >
                <Cart
                  cartItems={cart}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  onCheckout={handleCheckout}
                />
              </motion.div>
            )}

            {/* ORDERS HISTORY LOGS TAB */}
            {activeTab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col overflow-hidden px-4 py-4"
              >
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  История Заказов
                </h2>
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      Вы еще не совершали покупок. Сделайте свой первый заказ прямо сейчас!
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div 
                        key={order.id} 
                        className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2.5 text-xs"
                      >
                        <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5 font-bold">
                          <span className="text-slate-800">Заказ #{order.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                            order.status === "Paid" ? "bg-emerald-50 text-emerald-600" :
                            order.status === "Shipped" ? "bg-blue-50 text-blue-600" :
                            order.status === "Cancelled" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                          }`}>{order.status}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate max-w-[180px]">{i.name} ({i.selectedSize}) x{i.quantity}</span>
                              <span className="font-semibold">{i.price * i.quantity} ₽</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-200/50 pt-1.5 text-[10px] text-slate-400">
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="text-slate-900 font-extrabold text-sm">Итого: {order.total} ₽</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* ADMIN CONSOLE PORTAL TAB */}
            {activeTab === "admin" && (
              <motion.div
                key="admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full overflow-hidden"
              >
                <AdminPanel
                  products={products}
                  orders={orders}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  botInfo={botInfo}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Floating Custom Checkout bar in Browser previews if cart is populated */}
        {!isTelegramWebview && totalCartCount > 0 && activeTab === "shop" && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-16 left-4 right-4 z-40"
          >
            <button
              onClick={() => setActiveTab("cart")}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold rounded-xl text-xs transition duration-150 shadow-lg shadow-blue-100 flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Оформить заказ ({totalCartCount} шт.)</span>
              </div>
              <span className="bg-blue-600 px-2.5 py-1 rounded-lg">
                {cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)} ₽
              </span>
            </button>
          </motion.div>
        )}

        {/* Global Bottom Tab Bar Navigation */}
        <div className="h-14 bg-slate-100 border-t border-slate-200 flex items-center justify-around text-slate-500 shrink-0 z-40">
          <button
            onClick={() => setActiveTab("shop")}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
              activeTab === "shop" ? "text-sky-600 font-bold" : "hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[9px]">Каталог</span>
          </button>

          <button
            onClick={() => setActiveTab("cart")}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative ${
              activeTab === "cart" ? "text-sky-600 font-bold" : "hover:text-slate-800"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-[9px]">Корзина</span>
            {totalCartCount > 0 && (
              <span className="absolute top-2.5 right-6 bg-red-500 text-white text-[8px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                {totalCartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
              activeTab === "orders" ? "text-sky-600 font-bold" : "hover:text-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[9px]">Заказы</span>
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
              activeTab === "admin" ? "text-sky-600 font-bold" : "hover:text-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-[9px]">Админка</span>
          </button>
        </div>

      </div>

      {/* Global Bottom Sheet Drawer for Product Detailed Inspection */}
      <ProductDetail
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        cartQuantity={(size) => {
          if (!selectedProduct) return 0;
          const item = cart.find(
            (c) => c.product.id === selectedProduct.id && c.selectedSize === size
          );
          return item ? item.quantity : 0;
        }}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
      />
    </TelegramFrame>
  );
}
