import React, { useState, useEffect } from "react";
import { CartItem, Order } from "../types";
import { ShoppingCart, User, Phone, MapPin, CheckCircle, Shield, CreditCard, Sparkles, X, ChevronRight, Coins } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CartProps {
  cartItems: CartItem[];
  onAddToCart: (product: any, size: string) => void;
  onRemoveFromCart: (product: any, size: string) => void;
  onClearCart: () => void;
  onCheckout: (orderData: {
    items: any[];
    total: number;
    telegramUser: any;
    paymentMethod: "telegram_pay" | "cash_on_delivery" | "demo_pay";
  }) => Promise<Order>;
}

export default function Cart({
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onCheckout
}: CartProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"telegram_pay" | "cash_on_delivery" | "demo_pay">("demo_pay");
  
  // States for handling checkout flow
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemoPaymentSheet, setShowDemoPaymentSheet] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Telegram User detection
  const [tgUser, setTgUser] = useState<any>(null);

  useEffect(() => {
    // Detect Telegram user if running inside native Telegram client
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user) {
      const user = tg.initDataUnsafe.user;
      setTgUser(user);
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      if (user.username) {
        // Simple default storage values or mocks
      }
    }
  }, []);

  const totalCartPrice = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckoutClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!firstName || !phone || !address) {
      alert("Пожалуйста, заполните Имя, Телефон и Адрес доставки!");
      return;
    }

    if (paymentMethod === "demo_pay") {
      // Trigger interactive sliding payment checkout modal
      setShowDemoPaymentSheet(true);
    } else {
      // Direct checkout for COD or custom telegram pay triggers
      await executeFinalCheckout();
    }
  };

  const executeFinalCheckout = async () => {
    setIsSubmitting(true);
    try {
      const formattedItems = cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        image: item.product.image
      }));

      const finalUser = {
        id: tgUser?.id || Math.floor(100000 + Math.random() * 900000), // Fallback mock ID
        username: tgUser?.username || "browser_guest",
        first_name: firstName,
        last_name: lastName,
        phone,
        address
      };

      const order = await onCheckout({
        items: formattedItems,
        total: totalCartPrice,
        telegramUser: finalUser,
        paymentMethod
      });

      setLastPlacedOrder(order);
      onClearCart();
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Ошибка при оформлении заказа!");
    } finally {
      setIsSubmitting(false);
      setShowDemoPaymentSheet(false);
    }
  };

  if (lastPlacedOrder) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 text-center flex flex-col items-center justify-center min-h-[400px] h-full gap-5 bg-white"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
          <CheckCircle className="w-12 h-12 stroke-[2.5]" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h2 className="text-2xl font-extrabold text-slate-900">Заказ #{(lastPlacedOrder as any).id} Оформлен!</h2>
          <p className="text-sm text-slate-500">
            Мы успешно зарегистрировали ваш заказ на сумму <strong className="text-slate-800">{lastPlacedOrder.total} ₽</strong>.
          </p>
        </div>

        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs text-slate-600 flex flex-col gap-2.5">
          <div className="font-bold text-slate-800 border-b border-slate-200/60 pb-1.5 flex justify-between">
            <span>Детали Заказа</span>
            <span className="text-blue-600 font-bold">{lastPlacedOrder.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Покупатель:</span>
            <span className="font-medium text-slate-800">{firstName} {lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Способ оплаты:</span>
            <span className="font-medium text-slate-800">
              {lastPlacedOrder.paymentMethod === "telegram_pay" ? "Telegram Pay" : lastPlacedOrder.paymentMethod === "cash_on_delivery" ? "При получении" : "Карта (Имитация)"}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-slate-400">Адрес доставки:</span>
            <span className="font-medium text-slate-800 text-right max-w-[180px] break-words">{address}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          {tgUser?.id 
            ? "🤖 Мы отправили вам квитанцию с деталями заказа в чат-бот Telegram! Ожидайте дальнейших уведомлений."
            : "💬 Чтобы получать реальные уведомления о статусах заказов от чат-бота, запустите его в Telegram по токену!"
          }
        </p>

        <button
          onClick={() => setLastPlacedOrder(null)}
          className="mt-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition"
        >
          Вернуться в каталог
        </button>
      </motion.div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[350px] gap-4 bg-white">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-1 max-w-xs">
          <h3 className="font-bold text-slate-800 text-base">Ваша корзина пуста</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Добавьте понравившиеся вещи из каталога одежды, выберите необходимый размер и вернитесь сюда для оформления заказа.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
        
        {/* Cart Line Items */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4" />
            Ваш Выбор ({cartItems.length})
          </h3>
          <div className="flex flex-col gap-2.5">
            {cartItems.map((item, idx) => (
              <div 
                key={`${item.product.id}-${item.selectedSize}`}
                className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
              >
                <img 
                  src={item.product.image} 
                  alt={item.product.name} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" 
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-xs truncate">{item.product.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="bg-blue-50 text-blue-700 font-bold text-[9px] px-1.5 py-0.5 rounded uppercase">
                      Размер: {item.selectedSize}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.product.price} ₽ / шт.
                    </span>
                  </div>
                </div>

                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                  <button 
                    onClick={() => onRemoveFromCart(item.product, item.selectedSize)}
                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                  <button 
                    onClick={() => onAddToCart(item.product, item.selectedSize)}
                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Details */}
        <form onSubmit={handleCheckoutClick} className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <User className="w-4 h-4" />
            Контактные Данные
          </h3>

          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                required
                placeholder="Имя *" 
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 text-sm transition outline-none"
              />
              <input 
                type="text" 
                placeholder="Фамилия" 
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 text-sm transition outline-none"
              />
            </div>

            <div className="relative">
              <input 
                type="tel" 
                required
                placeholder="Номер телефона *" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl pl-9 pr-3 text-sm transition outline-none"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>

            <div className="relative">
              <input 
                type="text" 
                required
                placeholder="Адрес доставки *" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl pl-9 pr-3 text-sm transition outline-none"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Payment Method Selectors */}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 mt-3 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            Способ Оплаты
          </h3>

          <div className="flex flex-col gap-2">
            {/* Demo card option */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
              paymentMethod === "demo_pay" 
                ? "bg-blue-50/50 border-blue-300 text-slate-900" 
                : "border-slate-200 hover:bg-slate-50/40"
            }`}>
              <input 
                type="radio" 
                name="payment" 
                className="mt-1" 
                checked={paymentMethod === "demo_pay"} 
                onChange={() => setPaymentMethod("demo_pay")}
              />
              <div>
                <span className="text-xs font-bold block">Виртуальная карта (Имитация)</span>
                <span className="text-[10px] text-slate-400">Симуляция платежной системы Telegram с вводом пин-кода. Рекомендуется!</span>
              </div>
            </label>

            {/* Cash on delivery */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
              paymentMethod === "cash_on_delivery" 
                ? "bg-blue-50/50 border-blue-300 text-slate-900" 
                : "border-slate-200 hover:bg-slate-50/40"
            }`}>
              <input 
                type="radio" 
                name="payment" 
                className="mt-1" 
                checked={paymentMethod === "cash_on_delivery"} 
                onChange={() => setPaymentMethod("cash_on_delivery")}
              />
              <div>
                <span className="text-xs font-bold block">При получении</span>
                <span className="text-[10px] text-slate-400">Оплата наличными курьеру или картой при получении посылки.</span>
              </div>
            </label>
          </div>
        </form>

      </div>

      {/* Persistent Checkout Action Panel */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between text-slate-800 text-sm font-semibold px-1">
          <span>Сумма заказа:</span>
          <span className="text-base font-extrabold text-slate-950">{totalCartPrice} ₽</span>
        </div>

        <button
          onClick={handleCheckoutClick}
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold rounded-xl text-sm transition duration-150 shadow-lg shadow-blue-100 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? "Оформление..." : "Оформить заказ"}
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Interactive Telegram-style Demo Payment Sheet */}
      <AnimatePresence>
        {showDemoPaymentSheet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Dark back layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoPaymentSheet(false)}
              className="absolute inset-0 bg-black/70"
            />

            {/* Simulated Payment dialog */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[420px] bg-slate-900 text-white rounded-t-[28px] overflow-hidden p-6 z-10 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-sm uppercase tracking-wider text-slate-300">Telegram Pay</span>
                </div>
                <button 
                  onClick={() => setShowDemoPaymentSheet(false)}
                  className="p-1 hover:bg-slate-800 rounded-full text-slate-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mock Credit Card Graphics */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-800 p-5 rounded-2xl shadow-xl border border-blue-400/20 flex flex-col justify-between h-40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8"></div>
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-xs tracking-wider text-blue-200">DEMO CHECKOUT</span>
                  <div className="w-10 h-7 bg-white/20 rounded-md backdrop-blur-sm"></div>
                </div>

                <div className="font-mono text-lg tracking-[0.2em] my-1 text-slate-100">
                  ••••  ••••  ••••  4242
                </div>

                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-blue-200 uppercase tracking-widest font-bold">Держатель</span>
                    <span className="text-xs font-medium tracking-wide">{firstName} {lastName || "GUEST"}</span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-[9px] text-blue-200 uppercase tracking-widest font-bold">Сумма</span>
                    <span className="text-base font-extrabold tracking-wide">{totalCartPrice} ₽</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <span className="text-xs text-slate-400">Шлюз платежа</span>
                <span className="text-xs text-slate-300 flex items-center justify-center gap-1 font-medium">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Защищено сквозным шифрованием Telegram
                </span>
              </div>

              <button
                onClick={executeFinalCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-extrabold rounded-2xl text-sm tracking-wide shadow-xl shadow-blue-900/30 active:scale-95 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Проведение транзакции..."
                ) : (
                  <>
                    Оплатить {totalCartPrice} ₽
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
