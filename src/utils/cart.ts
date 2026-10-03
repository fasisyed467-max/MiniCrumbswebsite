import { CartItem } from '../types';

// Toppings are priced per selected count and added once per cart line
// (not multiplied by the line's item quantity).
export const getToppingsTotal = (item: CartItem): number =>
   (item.toppings ?? []).reduce((sum, t) => sum + t.price * t.quantity, 0);

export const getCartItemTotal = (item: CartItem): number =>
   item.price * item.quantity + getToppingsTotal(item);

export const getCartTotal = (cart: CartItem[] = []): number =>
   cart.reduce((sum, item) => sum + getCartItemTotal(item), 0);
