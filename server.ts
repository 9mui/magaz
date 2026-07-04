import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

// Bot configuration
const BOT_TOKEN = "8705241918:AAEEICZ-NqS86VQHghlVf91kkKdAcyfrVZM";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Seed data
const DEFAULT_PRODUCTS = [
  {
    id: "1",
    name: "Classic Oversized Hoodie",
    description: "Премиальное худи свободного кроя. Выполнено из плотного трехниточного футера с начесом. Идеально для прохладных дней и стильного городского аутфита.",
    price: 4900,
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop",
    category: "Худи",
    sizes: ["S", "M", "L", "XL"],
    stock: 25,
    isAvailable: true
  },
  {
    id: "2",
    name: "Minimalist Logo Tee",
    description: "Футболка из 100% органического хлопка премиального качества. Минималистичный вышитый логотип на груди, плотный воротник, современный крой.",
    price: 2500,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop",
    category: "Футболки",
    sizes: ["S", "M", "L", "XL"],
    stock: 50,
    isAvailable: true
  },
  {
    id: "3",
    name: "Cargo Streetwear Pants",
    description: "Брюки-карго в стиле аутентичного стритвира. Множество удобных карманов, регулируемый низ брючин на затяжках, прочный износостойкий материал.",
    price: 5900,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop",
    category: "Брюки",
    sizes: ["M", "L", "XL"],
    stock: 18,
    isAvailable: true
  },
  {
    id: "4",
    name: "Retro Baseball Cap",
    description: "Классическая бейсболка из плотного хлопкового канваса с винтажным эффектом варки. Регулируемый ремешок из натуральной кожи с металлической пряжкой.",
    price: 1900,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop",
    category: "Аксессуары",
    sizes: ["One Size"],
    stock: 30,
    isAvailable: true
  },
  {
    id: "5",
    name: "Urban Windbreaker Jacket",
    description: "Легкая ветровка со специальной влаго- и ветрозащитной пропиткой. Скрытый капюшон, качественная фурнитура YKK, идеальная посадка.",
    price: 7500,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop",
    category: "Куртки",
    sizes: ["S", "M", "L", "XL"],
    stock: 12,
    isAvailable: true
  },
  {
    id: "6",
    name: "Techwear Joggers",
    description: "Технологичные спортивные джоггеры с водоотталкивающим покрытием. Эластичный пояс с карабином, молнии внизу штанин для изменения силуэта.",
    price: 4500,
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600&auto=format&fit=crop",
    category: "Брюки",
    sizes: ["S", "M", "L"],
    stock: 22,
    isAvailable: true
  },
  {
    id: "7",
    name: "Knitted Cotton Sweater",
    description: "Фактурный свитер крупной вязки из мягкого натурального хлопка. Спущенное плечо, уютный ворот и манжеты в рубчик. Создает непринужденный осенний образ.",
    price: 5500,
    image: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?q=80&w=600&auto=format&fit=crop",
    category: "Худи",
    sizes: ["S", "M", "L"],
    stock: 15,
    isAvailable: true
  },
  {
    id: "8",
    name: "Premium Canvas Tote Bag",
    description: "Прочная холщовая сумка-тоут для повседневных покупок и прогулок. Усиленные ручки, внутренний карман на молнии для ценных мелочей.",
    price: 1500,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
    category: "Аксессуары",
    sizes: ["One Size"],
    stock: 40,
    isAvailable: true
  }
];

// Ensure data folder and files exist
async function ensureDataSetup() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Check products
    try {
      await fs.access(PRODUCTS_FILE);
    } catch {
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2));
      console.log("Seeded initial products catalog.");
    }

    // Check orders
    try {
      await fs.access(ORDERS_FILE);
    } catch {
      await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2));
      console.log("Initialized empty orders storage.");
    }
  } catch (error) {
    console.error("Error setting up files directory:", error);
  }
}

async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    const config = JSON.parse(data);
    if (config.APP_URL) {
      process.env.APP_URL = config.APP_URL;
      console.log(`Loaded APP_URL from config.json: ${config.APP_URL}`);
    }
  } catch {
    // Config doesn't exist yet, that's fine
  }
}

// Database Read/Write Helpers
async function readProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

async function writeProducts(products: any[]) {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

async function readOrders() {
  try {
    const data = await fs.readFile(ORDERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeOrders(orders: any[]) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Bot webhook setup
let botUsername = "";
async function initBot() {
  try {
    const res = await fetch(`${TELEGRAM_API}/getMe`);
    const data = await res.json() as any;
    if (data.ok) {
      botUsername = data.result.username;
      console.log(`Telegram Bot authenticated: @${botUsername} (${data.result.first_name})`);
      
      const appUrl = process.env.APP_URL;
      if (appUrl && !appUrl.includes("MY_APP_URL")) {
        await configureWebhook(appUrl);
      } else {
        console.log("APP_URL is empty or placeholder. Webhook not auto-configured. Use UI to register webhook.");
      }
    } else {
      console.error("Failed to authenticate Telegram Bot: Token might be invalid.", data);
    }
  } catch (err) {
    console.error("Error connecting to Telegram Bot API:", err);
  }
}

async function configureWebhook(baseUrl: string) {
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/bot-webhook`;
  try {
    const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "pre_checkout_query", "callback_query"]
      })
    });
    const data = await res.json() as any;
    console.log(`Setting Telegram webhook to ${webhookUrl}:`, data);
    return data.ok;
  } catch (err) {
    console.error(`Error setting webhook to ${webhookUrl}:`, err);
    return false;
  }
}

// REST API Endpoints

// 1. Get products catalog
app.get("/api/products", async (req, res) => {
  const products = await readProducts();
  res.json(products);
});

// 2. Add / update / delete products (Admin endpoints)
app.post("/api/products", async (req, res) => {
  const products = await readProducts();
  const newProduct = {
    ...req.body,
    id: req.body.id || Date.now().toString(),
    price: Number(req.body.price),
    stock: Number(req.body.stock),
    sizes: Array.isArray(req.body.sizes) ? req.body.sizes : ["S", "M", "L", "XL"],
    isAvailable: req.body.isAvailable !== false
  };
  products.push(newProduct);
  await writeProducts(products);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", async (req, res) => {
  const products = await readProducts();
  const index = products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  const updatedProduct = {
    ...products[index],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : products[index].price,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : products[index].stock,
    isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : products[index].isAvailable
  };
  products[index] = updatedProduct;
  await writeProducts(products);
  res.json(updatedProduct);
});

app.delete("/api/products/:id", async (req, res) => {
  const products = await readProducts();
  const filtered = products.filter((p: any) => p.id !== req.params.id);
  await writeProducts(filtered);
  res.json({ success: true });
});

// 3. Orders endpoints
app.get("/api/orders", async (req, res) => {
  const orders = await readOrders();
  // Sort by date newest first
  orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(orders);
});

app.post("/api/orders", async (req, res) => {
  const orders = await readOrders();
  const products = await readProducts();

  const newOrder = {
    id: "ORD-" + Math.floor(100000 + Math.random() * 900000).toString(),
    items: req.body.items,
    total: req.body.total,
    status: req.body.status || "Pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    telegramUser: req.body.telegramUser || {},
    paymentMethod: req.body.paymentMethod || "demo_pay",
    paymentDetails: req.body.paymentDetails || ""
  };

  // Adjust stock
  for (const item of newOrder.items) {
    const prod = products.find((p: any) => p.id === item.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
    }
  }
  await writeProducts(products);

  orders.push(newOrder);
  await writeOrders(orders);

  // Bot notification to Admin or User if Chat ID is available
  const userChatId = newOrder.telegramUser?.id;
  const username = newOrder.telegramUser?.username ? `@${newOrder.telegramUser.username}` : "Неизвестный";
  
  // Construct a beautiful message in Russian
  const orderList = newOrder.items.map((i: any) => `• ${i.name} (${i.selectedSize}) x${i.quantity} — ${i.price} руб.`).join("\n");
  const notificationText = `🛒 *Новый заказ #${newOrder.id}!*\n\n*Покупатель:* ${newOrder.telegramUser?.first_name || ""} ${newOrder.telegramUser?.last_name || ""} (${username})\n*Телефон:* ${newOrder.telegramUser?.phone || "Не указан"}\n*Адрес:* ${newOrder.telegramUser?.address || "Не указан"}\n\n*Товары:*\n${orderList}\n\n*Итого к оплате:* *${newOrder.total} руб.*\n*Способ оплаты:* ${newOrder.paymentMethod === 'telegram_pay' ? 'Telegram Pay' : newOrder.paymentMethod === 'cash_on_delivery' ? 'При получении' : 'Демо-оплата'}\n*Статус заказа:* ${newOrder.status}`;

  // Notify the user via the bot if they ordered via Telegram
  if (userChatId) {
    try {
      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: userChatId,
          text: `🎉 *Ваш заказ #${newOrder.id} успешно оформлен!*\n\n*Товары:*\n${orderList}\n\n*Сумма:* *${newOrder.total} руб.*\n*Статус:* В обработке\n\nСпасибо за покупку! Мы свяжемся с вами в ближайшее время!`,
          parse_mode: "Markdown"
        })
      });
    } catch (err) {
      console.error("Error notifying user via Telegram Bot:", err);
    }
  }

  res.status(201).json(newOrder);
});

// Update order status (Admin endpoint + trigger Telegram notify)
app.put("/api/orders/:id/status", async (req, res) => {
  const orders = await readOrders();
  const order = orders.find((o: any) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const oldStatus = order.status;
  const newStatus = req.body.status;
  order.status = newStatus;
  order.updatedAt = new Date().toISOString();
  await writeOrders(orders);

  // Send status change notification to User via Bot if user chat id is known
  const userChatId = order.telegramUser?.id;
  if (userChatId && oldStatus !== newStatus) {
    let statusMsg = "";
    switch (newStatus) {
      case "Paid":
        statusMsg = `✅ *Ваш заказ #${order.id} успешно оплачен!* Мы готовим его к отправке.`;
        break;
      case "Shipped":
        statusMsg = `🚚 *Ваш заказ #${order.id} передан в доставку!* Ожидайте курьера или посылку.`;
        break;
      case "Cancelled":
        statusMsg = `❌ *Ваш заказ #${order.id} был отменен.* Если у вас есть вопросы, напишите нам.`;
        break;
    }

    if (statusMsg) {
      try {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: userChatId,
            text: statusMsg,
            parse_mode: "Markdown"
          })
        });
      } catch (err) {
        console.error("Error sending status notification via Bot:", err);
      }
    }
  }

  res.json(order);
});

// 4. Force trigger set webhook or check webhook status
app.get("/api/bot-info", async (req, res) => {
  try {
    const response = await fetch(`${TELEGRAM_API}/getMe`);
    const botData = await response.json() as any;
    const webhookRes = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const webhookData = await webhookRes.json() as any;

    res.json({
      bot: botData.ok ? botData.result : null,
      webhook: webhookData.ok ? webhookData.result : null,
      appUrl: process.env.APP_URL || "Not set"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/set-webhook", async (req, res) => {
  const url = req.body.url || process.env.APP_URL;
  if (!url) {
    return res.status(400).json({ error: "No URL provided or found in env" });
  }

  process.env.APP_URL = url;

  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify({ APP_URL: url }, null, 2));
    console.log(`Saved APP_URL to config.json: ${url}`);
  } catch (err) {
    console.error("Failed to save configuration:", err);
  }

  const success = await configureWebhook(url);
  res.json({ success, url });
});

// Telegram Webhook receiver endpoint
app.post("/api/bot-webhook", async (req, res) => {
  const update = req.body;
  // console.log("Received Telegram update:", JSON.stringify(update));

  res.sendStatus(200); // Respond instantly to Telegram

  try {
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text || "";
      const user = message.from || {};

      if (text.startsWith("/start")) {
        const appUrl = process.env.APP_URL || "";
        const cleanUrl = appUrl.replace(/\/$/, "");

        const welcomeText = `👋 *Привет, ${user.first_name || "друг"}!*\n\nДобро пожаловать в *Telegram Cloth Shop* — наш премиальный магазин одежды прямо внутри Telegram! 🛍️✨\n\nМы создали для вас удобный каталог с самыми стильными вещами, простой корзиной и моментальной оплатой.\n\n👇 Нажмите кнопку ниже, чтобы открыть магазин и начать шопинг!`;

        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🛍️ Открыть каталог одежды",
                    web_app: {
                      url: cleanUrl || "https://ais-dev-vlkjlgjzaqfn2aiwhkqkbm-205384829947.asia-southeast1.run.app"
                    }
                  }
                ],
                [
                  {
                    text: "👑 Панель Администратора",
                    web_app: {
                      url: cleanUrl ? `${cleanUrl}/?admin=true` : "https://ais-dev-vlkjlgjzaqfn2aiwhkqkbm-205384829947.asia-southeast1.run.app/?admin=true"
                    }
                  }
                ]
              ]
            }
          })
        });
      } else if (text.startsWith("/help")) {
        const helpText = `ℹ️ *Справка по магазину*\n\nЭтот бот работает как Telegram Mini App магазин одежды.\n\nКоманды:\n/start — Открыть главное меню и войти в магазин\n\n*Как заказать?*\n1. Откройте магазин по кнопке ниже.\n2. Выберите понравившиеся товары и размер.\n3. Добавьте в корзину и оформите заказ.\n4. Вы получите уведомление об изменении статуса вашего заказа!`;
        const appUrl = process.env.APP_URL || "https://ais-dev-vlkjlgjzaqfn2aiwhkqkbm-205384829947.asia-southeast1.run.app";
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: helpText,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🛍️ Открыть магазин",
                    web_app: {
                      url: appUrl
                    }
                  }
                ]
              ]
            }
          })
        });
      }
    } else if (update.pre_checkout_query) {
      // Respond to pre_checkout_query for Telegram Invoice
      const queryId = update.pre_checkout_query.id;
      await fetch(`${TELEGRAM_API}/answerPreCheckoutQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_checkout_query_id: queryId,
          ok: true
        })
      });
    } else if (update.message?.successful_payment) {
      // Payment completed successfully!
      const payment = update.message.successful_payment;
      const orderId = payment.invoice_payload;
      const chatId = update.message.chat.id;

      const orders = await readOrders();
      const order = orders.find((o: any) => o.id === orderId);
      if (order) {
        order.status = "Paid";
        order.updatedAt = new Date().toISOString();
        await writeOrders(orders);
        
        const successText = `🎉 *Оплата успешно получена!*\n\nНомер вашего заказа: *#${orderId}*\nСумма: *${(payment.total_amount / 100).toFixed(2)} ${payment.currency}*\n\nСпасибо за покупку в нашем магазине! Администраторы уже готовят ваш заказ к отправке! 🚚💨`;
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: successText,
            parse_mode: "Markdown"
          })
        });
      }
    }
  } catch (err) {
    console.error("Error handling bot webhook update:", err);
  }
});

// Start express server and hook Vite / Static serving
async function startServer() {
  await ensureDataSetup();
  await loadConfig();
  await initBot();

  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Serve index.html for all non-api requests
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
