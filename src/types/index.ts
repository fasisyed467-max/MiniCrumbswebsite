export type Size = string;

export type CartItem = {
   id: string;
   productId: string;
   name: string;
   size: Size;
   price: number;
   quantity: number;
};

export type CheckoutFormData = {
   name: string;
   phone: string;
   address: string;
   notes: string;
   paymentScreenshot?: File | null;
   paymentScreenshotUrl?: string;
};

export type Product = {
   id: string;
   name: string;
   desc: string;
   price: number;
   prices: Record<string, number>;
   category: string;
   image: string;
   popular: boolean;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_time: string;
  notes: string;
  type: 'standard' | 'custom';
  total_amount: number;
  items: CartItem[];
  status: 'pending' | 'received' | 'baking' | 'delivery' | 'cancelled';
  custom_details?: {
    weight: string;
    description: string;
    budget: string;
  };
  reference_image_url?: string;
  payment_screenshot_url?: string;
  created_at: string;
  order_number: number;
};
