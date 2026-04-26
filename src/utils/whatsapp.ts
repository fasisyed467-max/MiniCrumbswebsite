import { CartItem, CheckoutFormData } from '../types';
import { PHONE_NUMBER } from '../data/constants';

export function createWaLink(cart: CartItem[] = [], form?: CheckoutFormData) {
   let text = `*New Order from Mini Crumbs Website*\n`;
   text += `--------------------------\n\n`;
   
   if (cart.length > 0) {
      cart.forEach((item, index) => {
         text += `*${index + 1}. ${item.name}*\n`;
         text += `Size: ${item.size}\n`;
         text += `Qty: ${item.quantity}\n`;
         text += `Subtotal: ₹${item.price * item.quantity}\n\n`;
      });
      const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      text += `*Total Amount:* ₹${total}\n`;
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

