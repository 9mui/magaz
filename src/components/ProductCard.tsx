import React from "react";
import { Product } from "../types";
import { Plus, Minus, CheckCircle, Package } from "lucide-react";
import { motion } from "motion/react";

interface ProductCardProps {
  key?: any;
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product, size: string) => void;
  onRemoveFromCart: (product: Product, size: string) => void;
  onSelectProduct: (product: Product) => void;
}

export default function ProductCard({
  product,
  cartQuantity,
  onAddToCart,
  onRemoveFromCart,
  onSelectProduct
}: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  // Default to first size available
  const defaultSize = product.sizes[0] || "M";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col group hover:border-slate-200 transition duration-200"
    >
      {/* Product Image Panel */}
      <div 
        onClick={() => onSelectProduct(product)}
        className="relative aspect-square w-full bg-slate-50 overflow-hidden cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
        />
        
        {/* Category Tag */}
        <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {product.category}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center p-4">
            <Package className="w-8 h-8 text-slate-400 mb-1" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Нет в наличии</span>
          </div>
        )}
      </div>

      {/* Info & Action Section */}
      <div className="p-3.5 flex flex-col flex-1 gap-2 bg-white">
        <div className="flex-1">
          <h3 
            onClick={() => onSelectProduct(product)}
            className="font-bold text-slate-900 text-sm leading-tight hover:text-blue-600 cursor-pointer line-clamp-1 transition"
          >
            {product.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-normal leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Cart Counter Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Цена</span>
            <span className="text-base font-extrabold text-slate-900">{product.price} ₽</span>
          </div>

          {isOutOfStock ? (
            <button 
              disabled 
              className="py-1.5 px-3 bg-slate-100 text-slate-400 font-medium rounded-xl text-xs cursor-not-allowed"
            >
              Распродано
            </button>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center bg-blue-50 text-blue-600 rounded-xl p-1 border border-blue-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromCart(product, defaultSize);
                }}
                className="w-7 h-7 flex items-center justify-center hover:bg-blue-100 rounded-lg active:scale-90 transition"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              
              <span className="w-8 text-center text-sm font-bold text-blue-700">
                {cartQuantity}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product, defaultSize);
                }}
                className="w-7 h-7 flex items-center justify-center hover:bg-blue-100 rounded-lg active:scale-90 transition"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product, defaultSize);
              }}
              className="py-1.5 px-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition duration-200 shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Добавить
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
