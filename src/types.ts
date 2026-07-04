export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  stock: number;
  isAvailable: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export interface Order {
  id: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize: string;
    image: string;
  }[];
  total: number;
  status: 'Pending' | 'Paid' | 'Shipped' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
  telegramUser: {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
  };
  paymentMethod: 'telegram_pay' | 'cash_on_delivery' | 'demo_pay';
  paymentDetails?: string;
}

export interface BotInfo {
  username: string;
  firstName: string;
  canJoinGroups: boolean;
  canReadAllGroupMessages: boolean;
  supportsInlineQueries: boolean;
}
