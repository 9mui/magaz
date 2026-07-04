import React, { useState, useEffect } from "react";
import { Check, X, MoreVertical, Wifi, Battery, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

interface TelegramFrameProps {
  children: React.ReactNode;
  botName?: string;
  botUsername?: string;
  onRefreshWebhook?: () => void;
  webhookStatus?: { success: boolean; url: string } | null;
}

export default function TelegramFrame({
  children,
  botName = "Telegram Cloth Shop",
  botUsername = "cloth_shop_bot",
  onRefreshWebhook,
  webhookStatus
}: TelegramFrameProps) {
  const [isTelegram, setIsTelegram] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Detect if running inside a real Telegram webview
    const isTgObj = !!(window as any).Telegram?.WebApp?.initData;
    setIsTelegram(isTgObj);

    // Dynamic clock for mockup status bar
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // If inside real Telegram WebApp, just render children full screen
  if (isTelegram) {
    return <div className="w-full h-screen bg-white text-black">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col md:flex-row items-center justify-center p-4 gap-8 font-sans">
      
      {/* Informative Side Panel (Explains the Telegram integration and bot setup) */}
      <div className="w-full md:w-80 bg-slate-100 text-slate-800 p-6 rounded-[24px] border border-slate-200 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2 text-blue-600">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <h2 className="font-extrabold text-lg tracking-tight">Telegram Mini App</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Это интерактивная модель <strong>Telegram Mini App</strong>. Мы воссоздали оригинальный интерфейс Telegram, чтобы вы могли тестировать магазин прямо в браузере!
        </p>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-2">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Инструкции по интеграции</div>
          <p className="text-xs text-slate-600">
            1. Добавьте бота в Telegram: <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 underline font-semibold">@{botUsername}</a>
          </p>
          <p className="text-xs text-slate-600">
            2. Отправьте боту команду <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-600 font-mono font-medium">/start</code>
          </p>
          <p className="text-xs text-slate-600">
            3. Бот ответит приветствием и кнопкой запуска этого веб-приложения!
          </p>
        </div>

        {webhookStatus && (
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Webhook Active</span>
              <span className="break-all font-mono text-[10px]">{webhookStatus.url}</span>
            </div>
          </div>
        )}

        <button
          onClick={onRefreshWebhook}
          className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
        >
          <RefreshCw className="w-4 h-4" />
          Связать Webhook заново
        </button>

        <div className="text-xs text-slate-400 text-center border-t border-slate-200 pt-3">
          Токен бота настроен на бэкенде. Заказы обрабатываются автоматически в реальном времени!
        </div>
      </div>

      {/* Main Telegram Interactive Mockup Shell */}
      <div className="relative w-full max-w-[350px] h-[720px] bg-slate-900 rounded-[40px] p-2 border-[8px] border-slate-900 shadow-2xl flex flex-col overflow-hidden select-none shrink-0">
        
        {/* Notch / Speaker bar */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-b-xl z-50 flex items-center justify-center">
          <div className="w-10 h-0.5 bg-slate-800 rounded-full"></div>
        </div>

        {/* Screen Content Area */}
        <div className="w-full h-full bg-white rounded-[32px] overflow-hidden flex flex-col relative">
          
          {/* iOS / Android Native Status Bar */}
          <div className="w-full h-10 bg-slate-50 flex items-center justify-between px-6 text-xs text-slate-900 z-40 shrink-0">
            <span className="font-semibold">{currentTime}</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" />
              <div className="text-[10px] font-bold">5G</div>
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Telegram App Header Bar (Mock) */}
          <div className="w-full h-12 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 z-40 shrink-0">
            <div className="flex items-center gap-1">
              <button className="p-1 text-slate-500 hover:bg-slate-200 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-slate-900">{botName}</span>
                  <span className="bg-blue-500 text-white rounded-full p-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">bot</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-full transition">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actual Shop App Root Canvas inside Mock */}
          <div className="flex-1 overflow-hidden relative bg-white">
            {children}
          </div>

          {/* Mock Home Indicator Bar */}
          <div className="w-full h-5 bg-white flex items-center justify-center z-40 shrink-0 pb-1">
            <div className="w-24 h-1 bg-slate-300 rounded-full"></div>
          </div>

        </div>
      </div>

    </div>
  );
}
