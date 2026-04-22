export type Size = "1/2kg" | "1kg" | "1.5kg";

export type CartItem = {
   id: string;
   productId: number;
   name: string;
   size: Size;
   price: number;
   quantity: number;
};

export type CheckoutFormData = {
   name: string;
   phone: string;
   address: string;
   time: string;
   notes: string;
};

export type Product = {
   id: number;
   name: string;
   desc: string;
   price: number;
   prices: { "1/2kg": number; "1kg": number; "1.5kg": number };
   category: string;
   image: string;
   popular: boolean;
};
