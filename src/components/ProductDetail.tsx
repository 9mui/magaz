import React, { useState } from "react";
import { Product } from "../types";
import { X, Plus, Minus, Check, ShoppingBag, Box } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
  cartQuantity: (size: string) => number;
  onAddToCart: (product: Product, size: string) => void;
  onRemoveFromCart: (product: Product, size: string) => void;
}

export default function ProductDetail({
  product,
  onClose,
  cartQuantity,
  onAddToCart,
  onRemoveFromCart
}: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");

  if (!product) return null;

  // Select first size as default if not set
  if (!selectedSize && product.sizes.length > 0) {
    setSelectedSize(product.sizes[0]);
  }

  const quantityInCart = cartQuantity(selectedSize);
  const isOutOfStock = product.stock <= 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Semi-transparent Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black"
        />

        {/* Slide-up Container */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-w-[420px] bg-white rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden max-h-[85%] z-10"
        >
          {/* Header Drag Handle Decoration */}
          <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-3 shrink-0"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrollable details panel */}
          <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-5">
            {/* Image Slider Mock / Main Image */}
            <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                {product.category}
              </div>
            </div>

            {/* Title & Price Header */}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h2>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">{product.price} ₽</span>
                <span className="text-xs text-slate-400">В наличии: {product.stock} шт.</span>
              </div>
            </div>

            {/* Description Paragraph */}
            <div className="flex flex-col gap-1.5">
              <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">О товаре</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {product.description}
              </p>
            </div>

            {/* Sizes Selection Selector */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Выберите размер</h4>
                {selectedSize && (
                  <span className="text-xs text-blue-600 font-bold">Размер: {selectedSize}</span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 px-4 rounded-xl text-sm font-bold border transition duration-150 flex items-center justify-center min-w-11 ${
                      selectedSize === size
                        ? "bg-blue-500 border-blue-500 text-white shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Interactive Actions Bar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Итого за вещь</span>
              <span className="text-lg font-bold text-slate-950">{product.price} ₽</span>
            </div>

            {isOutOfStock ? (
              <button
                disabled
                className="py-3 px-6 bg-slate-200 text-slate-400 font-bold rounded-2xl text-sm cursor-not-allowed flex items-center gap-2"
              >
                <Box className="w-4 h-4" />
                Распродано
              </button>
            ) : quantityInCart > 0 ? (
              <div className="flex items-center bg-blue-50 text-blue-600 rounded-2xl p-1.5 border border-blue-100 shadow-sm">
                <button
                  onClick={() => onRemoveFromCart(product, selectedSize)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-blue-100 rounded-xl active:scale-95 transition"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>
                
                <span className="w-10 text-center text-base font-extrabold text-blue-900">
                  {quantityInCart}
                </span>

                <button
                  onClick={() => onAddToCart(product, selectedSize)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-blue-100 rounded-xl active:scale-95 transition"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(product, selectedSize)}
                className="py-3 px-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold rounded-2xl text-sm transition duration-150 shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Добавить в корзину
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
