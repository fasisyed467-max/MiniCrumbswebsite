import { CartItem, CheckoutFormData } from '../types';
import { PHONE_NUMBER } from '../data/constants';
import { getCartItemTotal, getCartTotal } from './cart';

export function createWaLink(cart: CartItem[] = [], form?: CheckoutFormData) {
   let text = `*New Order from Mini Crumbs Website*\n`;
   text += `--------------------------\n\n`;

   if (cart.length > 0) {
      cart.forEach((item, index) => {
         text += `*${index + 1}. ${item.name}*\n`;
         text += `Size: ${item.size}\n`;
         text += `Qty: ${item.quantity}\n`;
         if (item.prepDuration) {
            text += `Prep time: ${item.prepDuration}\n`;
         }
         if (item.toppings && item.toppings.length > 0) {
            text += `Toppings:\n`;
            item.toppings.forEach(t => {
               text += `   - ${t.name} x${t.quantity} — ₹${t.price * t.quantity}\n`;
            });
         }
         text += `Subtotal: ₹${getCartItemTotal(item)}\n\n`;
      });
      text += `*Total Amount:* ₹${getCartTotal(cart)}\n`;
      text += `--------------------------\n\n`;
   }

   if (form) {

      text += `*DELIVERY DETAILS*\n`;
      text += `📍 *Address:* ${form.address}\n`;
      text += `👤 *Name:* ${form.name}\n`;
      text += `📞 *Phone:* ${form.phone}\n`;
      if (form.paymentScreenshotUrl) {
         text += `📸 *Payment Screenshot:* ${form.paymentScreenshotUrl}\n`;
      }
      if (form.notes) {
         text += `📝 *Notes:* ${form.notes}\n`;
      }
      text += `\n`;
   }

   text += `Please confirm my order. Thanks!`;

   return `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(text)}`;
}
