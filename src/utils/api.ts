import { CartItem, CheckoutFormData, Product } from '../types';
import { supabase } from './supabase';

export const api = {
  async fetchProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure prices are correctly parsed if they come as JSONB
      return (data || []).map(p => ({
        ...p,
        desc: p.description,
        image: p.image_url,
        popular: p.is_popular,
        price: parseFloat(p.price),
        prices: typeof p.prices === 'string' ? JSON.parse(p.prices) : p.prices,
        stock: typeof p.stock === 'string' ? JSON.parse(p.stock) : (p.stock || {})
      })) as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('type', 'standard')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  async fetchCustomOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('type', 'custom')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching custom orders:', error);
      return [];
    }
  },

  async submitOrder(cart: CartItem[], formData: CheckoutFormData) {
    try {
      const totalAmount = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
      
      const { error } = await supabase.rpc('place_order_with_stock', {
        p_customer_name: formData.name,
        p_customer_phone: formData.phone,
        p_delivery_address: formData.address,
        p_notes: formData.notes,
        p_payment_screenshot_url: formData.paymentScreenshotUrl,
        p_total_amount: totalAmount,
        p_items: cart
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
  },

  async submitCustomOrder(data: any, imageFile?: File) {
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await this.uploadImage(imageFile, 'orders');
      }

      const { error } = await supabase
        .from('orders')
        .insert([{
          customer_name: data.name,
          customer_phone: data.phone,
          delivery_address: data.location,
          delivery_time: data.time,
          notes: data.cakeMessage,
          type: 'custom',
          custom_details: {
            weight: data.weight,
            description: data.cakeMessage,
            budget: 'TBD'
          },
          reference_image_url: imageUrl,
          status: 'pending'
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error submitting custom order:', error);
      throw error;
    }
  },

  async submitProduct(product: any, imageFile?: File) {
    try {
      let imageUrl = product.image; // Keep existing if no new file
      if (imageFile) {
        imageUrl = await this.uploadImage(imageFile, 'products');
      }

      const prices: Record<string, number> = {};
      const stock: Record<string, number> = {};
      
      product.variants.forEach((v: any) => {
        if (v.size) {
          if (v.price) prices[v.size] = parseFloat(v.price);
          if (v.stock) stock[v.size] = parseInt(v.stock);
          else stock[v.size] = 0;
        }
      });

      const { error } = await supabase
        .from('products')
        .insert([{
          name: product.name,
          category: product.category,
          price: parseFloat(product.variants[0]?.price || '0'),
          description: product.description,
          image_url: imageUrl,
          is_available: product.availability === 'Yes',
          is_popular: false,
          prices: prices,
          stock: stock
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  async updateProduct(id: string, updates: any) {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async updateOrderStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  async uploadImage(file: File, bucket: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async getSystemMetrics() {
    try {
      const { data, error } = await supabase.rpc('get_system_metrics');
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return null;
    }
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
