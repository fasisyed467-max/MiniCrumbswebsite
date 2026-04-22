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
      // Format datetime-local (YYYY-MM-DDTHH:mm) to something nice
      let readableTime = form.time;
      try {
         if (form.time) {
            const date = new Date(form.time);
            if (!isNaN(date.getTime())) {
               readableTime = date.toLocaleString('en-IN', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short', 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
               });
            }
         }
      } catch (e) {
         console.error("Error formatting date:", e);
      }

      text += `*DELIVERY DETAILS*\n`;
      text += `📍 *Address:* ${form.address}\n`;
      text += `⏰ *Date & Time:* ${readableTime}\n`;
      text += `👤 *Name:* ${form.name}\n`;
      text += `📞 *Phone:* ${form.phone}\n`;
      if (form.notes) {
         text += `📝 *Notes:* ${form.notes}\n`;
      }
      text += `\n`;
   }
   
   text += `Please confirm my order. Thanks!`;
   
   return `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(text)}`;
}

