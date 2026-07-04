import React, { useState, useEffect } from "react";
import { Product, Order } from "../types";
import { Plus, Trash, Edit3, BarChart2, ShoppingBag, DollarSign, Clock, Package, Eye, Check, X, FileText, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onAddProduct: (product: Omit<Product, "id">) => Promise<Product>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onUpdateOrderStatus: (id: string, status: Order["status"]) => Promise<Order>;
  botInfo: any;
}

export default function AdminPanel({
  products,
  orders,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  botInfo
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "catalog">("dashboard");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Худи");
  const [formSizes, setFormSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [formStock, setFormStock] = useState("");
  const [formImage, setFormImage] = useState("");

  const categories = ["Худи", "Футболки", "Брюки", "Куртки", "Аксессуары"];

  // Open Edit Form
  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormDescription(prod.description);
    setFormPrice(prod.price.toString());
    setFormCategory(prod.category);
    setFormSizes(prod.sizes);
    setFormStock(prod.stock.toString());
    setFormImage(prod.image);
    setShowProductForm(true);
  };

  // Open Add Form
  const startAddProduct = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormCategory("Худи");
    setFormSizes(["S", "M", "L", "XL"]);
    setFormStock("20");
    setFormImage("");
    setShowProductForm(true);
  };

  // Submit form handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productPayload = {
      name: formName,
      description: formDescription,
      price: Math.max(0, Number(formPrice) || 0),
      category: formCategory,
      sizes: formSizes,
      stock: Math.max(0, Number(formStock) || 0),
      image: formImage || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600",
      isAvailable: true
    };

    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, productPayload);
      } else {
        await onAddProduct(productPayload);
      }
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert("Не удалось сохранить товар");
    }
  };

  const handleSizeToggle = (size: string) => {
    if (formSizes.includes(size)) {
      setFormSizes(formSizes.filter((s) => s !== size));
    } else {
      setFormSizes([...formSizes, size]);
    }
  };

  // Stats Calculations
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status === "Paid" || o.status === "Shipped")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const totalItemsAvailable = products.length;

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-blue-400" />
          <h1 className="font-extrabold text-sm tracking-wide uppercase">Admin Boutique</h1>
        </div>
        <div className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
          @{botInfo?.bot?.username || "bot"}
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="bg-white border-b border-slate-200 flex shrink-0">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === "dashboard"
              ? "border-blue-600 text-blue-600 bg-blue-50/10"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Сводка
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === "orders"
              ? "border-blue-600 text-blue-600 bg-blue-50/10"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          Заказы ({totalOrders})
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === "catalog"
              ? "border-blue-600 text-blue-600 bg-blue-50/10"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package className="w-4 h-4" />
          Каталог ({totalItemsAvailable})
        </button>
      </div>

      {/* Main Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        
        {/* TAB 1: DASHBOARD STATS */}
        {activeTab === "dashboard" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-4"
          >
            {/* Bento Grid Stats Card Layout */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col gap-1">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Выручка</span>
                <span className="text-base font-extrabold text-slate-950">{totalRevenue} ₽</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col gap-1">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Заказы</span>
                <span className="text-base font-extrabold text-slate-950">{totalOrders} шт.</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col gap-1">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ожидают</span>
                <span className="text-base font-extrabold text-slate-950">{pendingCount} шт.</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col gap-1">
                <Package className="w-5 h-5 text-pink-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Каталог</span>
                <span className="text-base font-extrabold text-slate-950">{totalItemsAvailable} поз.</span>
              </div>
            </div>

            {/* Telegram Webhook Diagnostics */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl flex flex-col gap-2.5 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Статус Телеграм Бота</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Имя бота</span>
                  <span className="font-semibold text-slate-200">{botInfo?.bot?.first_name || "Не инициализирован"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Username</span>
                  <span className="font-semibold text-slate-200">@{botInfo?.bot?.username || "Не инициализирован"}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[10px] text-slate-500">Зарегистрированный Webhook:</span>
                <span className="font-mono text-[9px] text-blue-400 select-all truncate bg-slate-950/60 px-2 py-1 rounded">
                  {botInfo?.webhook?.url || "Вебхук отсутствует"}
                </span>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Последние Заказы</h3>
              {orders.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">Заказы еще не оформлялись.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">#{order.id}</span>
                        <span className="text-[9px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.total} ₽</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                          order.status === "Paid" ? "bg-emerald-50 text-emerald-600" :
                          order.status === "Shipped" ? "bg-blue-50 text-blue-600" :
                          order.status === "Cancelled" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                        }`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            {orders.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-xl border border-slate-100">
                Заказы еще отсутствуют в базе.
              </div>
            ) : (
              orders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col gap-3"
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-sm text-slate-900">Заказ #{order.id}</span>
                      <span className="text-[9.5px] text-slate-400">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                      order.status === "Shipped" ? "bg-blue-100 text-blue-700" :
                      order.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-slate-50 p-2.5 rounded-lg text-xs flex flex-col gap-1.5 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Покупатель:</span>
                      <span className="font-semibold text-slate-800">
                        {order.telegramUser?.first_name || ""} {order.telegramUser?.last_name || ""} 
                        {order.telegramUser?.username && ` (@${order.telegramUser.username})`}
                      </span>
                    </div>
                    {order.telegramUser?.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Телефон:</span>
                        <span className="font-medium text-slate-800 select-all">{order.telegramUser.phone}</span>
                      </div>
                    )}
                    {order.telegramUser?.address && (
                      <div className="flex justify-between items-start">
                        <span className="text-slate-400 shrink-0">Доставка:</span>
                        <span className="font-medium text-slate-800 text-right max-w-[200px] break-words">{order.telegramUser.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Способ оплаты:</span>
                      <span className="font-medium text-slate-700 uppercase text-[10px]">
                        {order.paymentMethod === 'telegram_pay' ? 'Telegram Pay' : order.paymentMethod === 'cash_on_delivery' ? 'При получении' : 'Карта (Демо)'}
                      </span>
                    </div>
                  </div>

                  {/* Order items list */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Товары</span>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-8 h-8 rounded object-cover border border-slate-100 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-400">Размер: {item.selectedSize} x{item.quantity}</span>
                        </div>
                        <span className="font-semibold text-slate-800">{item.price * item.quantity} ₽</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary Total & Trigger Statuses Pipeline */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Итоговая сумма</span>
                      <span className="text-base font-extrabold text-slate-900">{order.total} ₽</span>
                    </div>

                    {/* Status change actions panel */}
                    <div className="flex gap-1.5">
                      {order.status === "Pending" && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, "Paid")}
                          className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] shadow-sm flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Оплачен
                        </button>
                      )}
                      {(order.status === "Pending" || order.status === "Paid") && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, "Shipped")}
                          className="py-1 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] shadow-sm flex items-center gap-1 transition"
                        >
                          🚚 Отправить
                        </button>
                      )}
                      {order.status !== "Cancelled" && order.status !== "Shipped" && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, "Cancelled")}
                          className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition"
                        >
                          <X className="w-4 h-4 stroke-[3]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* TAB 3: PRODUCT CATALOG (CRUD) */}
        {activeTab === "catalog" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            {/* Catalog Add Button */}
            <button
              onClick={startAddProduct}
              className="w-full h-11 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Добавить новую вещь в каталог
            </button>

            {/* List products for Admin */}
            <div className="flex flex-col gap-2">
              {products.map((prod) => (
                <div 
                  key={prod.id}
                  className="bg-white rounded-xl border border-slate-200/60 p-2.5 flex items-center gap-3 shadow-sm"
                >
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-xs text-slate-900 block truncate">{prod.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-800">{prod.price} ₽</span>
                      <span className="text-[9px] text-slate-400">• Доступно: {prod.stock} шт.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEditProduct(prod)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteProduct(prod.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      {/* Slide-over Form Overlay for Add/Edit Product */}
      <AnimatePresence>
        {showProductForm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductForm(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Form Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[420px] bg-white rounded-t-[24px] overflow-hidden max-h-[85%] z-10 flex flex-col"
            >
              <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50 shrink-0">
                <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">
                  {editingProduct ? "Редактировать вещь" : "Создать вещь"}
                </span>
                <button 
                  onClick={() => setShowProductForm(false)}
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Название товара *</label>
                  <input
                    type="text"
                    required
                    placeholder="Пример: Худи Оверсайз Голубой"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 text-sm transition outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Описание товара</label>
                  <textarea
                    placeholder="Детали материала, посадка, уход..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl p-3 text-sm transition outline-none min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Цена (руб.) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Пример: 3500"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 text-sm transition outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">В наличии (шт.) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Пример: 15"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 text-sm transition outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Категория *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 text-sm transition outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Размеры</label>
                  <div className="flex gap-2">
                    {["S", "M", "L", "XL", "One Size"].map((size) => {
                      const isChecked = formSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSizeToggle(size)}
                          className={`h-10 px-3 rounded-xl border text-xs font-bold transition flex-1 flex items-center justify-center ${
                            isChecked
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Ссылка на картинку (URL)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 text-sm transition outline-none"
                  />
                  <span className="text-[10.5px] text-slate-400">
                    Оставьте пустым, чтобы использовать стандартное изображение.
                  </span>
                </div>

                {/* Submit Panel */}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition duration-150 shadow-lg shadow-blue-100 active:scale-95 mt-2 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Сохранить товар
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
