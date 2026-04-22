import { CartItem, CheckoutFormData } from '../types';
import { PHONE_NUMBER } from '../data/constants';

export function createWaLink(cart: CartItem[] = [], form?: CheckoutFormData) {
   let text = `*New Order from Mini Crumbs Website*%0A`;
   text += `--------------------------%0A%0A`;
   
   if (cart.length > 0) {
      cart.forEach((item, index) => {
         text += `*${index + 1}. ${item.name}*%0A`;
         text += `Size: ${item.size}%0A`;
         text += `Qty: ${item.quantity}%0A`;
         text += `Subtotal: ₹${item.price * item.quantity}%0A%0A`;
      });
      const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      text += `*Total Amount:* ₹${total}%0A`;
      text += `--------------------------%0A%0A`;
   }

   if (form) {
      // Format datetime-local (YYYY-MM-DDTHH:mm) to something nice
      let readableTime = form.time;
      try {
         if (form.time) {
            const date = new Date(form.time);
            readableTime = date.toLocaleString('en-IN', { 
               weekday: 'short', 
               day: 'numeric', 
               month: 'short', 
               hour: 'numeric', 
               minute: '2-digit',
               hour12: true 
            });
         }
      } catch (e) {
         readableTime = form.time;
      }

      text += `*DELIVERY DETAILS*%0A`;
      text += `📍 *Address:* ${form.address}%0A`;
      text += `⏰ *Date & Time:* ${readableTime}%0A`;
      text += `👤 *Name:* ${form.name}%0A`;
      text += `📞 *Phone:* ${form.phone}%0A`;
      if (form.notes) {
         text += `📝 *Notes:* ${form.notes}%0A`;
      }
      text += `%0A`;
   }
   
   text += `Please confirm my order. Thanks!`;
   
   const encodedText = text; // It's already mostly URL safe with %0A, but let's be sure
   return `https://wa.me/${PHONE_NUMBER}?text=${encodedText}`;
}
