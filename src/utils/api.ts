import imageCompression from 'browser-image-compression';
import { CartItem, CheckoutFormData, Product, Topping } from '../types';
import { supabase } from './supabase';
import { toProxiedImageUrl } from './imageProxy';
import { getCartTotal } from './cart';

let productsCache: Product[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

// Reads every row of a query, 1000 at a time (Supabase's per-request cap).
async function fetchAllPages(buildQuery: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: any }>) {
  const pageSize = 1000;
  const rows: any[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export const api = {
  async fetchProducts(force = false): Promise<Product[]> {
    const now = Date.now();
    if (!force && productsCache && (now - lastFetch < CACHE_TTL)) {
      return productsCache;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const products = (data || []).map(p => ({
        ...p,
        desc: p.description,
        image: toProxiedImageUrl(p.image_url) || p.image,
        popular: p.is_popular,
        price: parseFloat(p.price),
        prices: typeof p.prices === 'string' ? JSON.parse(p.prices) : p.prices,
        stock: typeof p.stock === 'string' ? JSON.parse(p.stock) : (p.stock || {})
      })) as Product[];

      productsCache = products;
      lastFetch = now;
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return productsCache || [];
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

  // Dashboard stats. Supabase returns at most 1000 rows per request, so rows are read
  // page by page and counts use head-only count queries.
  async fetchOrderRangeStats(startISO: string, endISO: string) {
    const rows = await fetchAllPages((from, to) =>
      supabase
        .from('orders')
        .select('status,total_amount')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .order('created_at', { ascending: false })
        .range(from, to)
    );
    return { rangeRows: rows as { status: string; total_amount: number | null }[] };
  },

  async fetchLifetimeStats() {
    const countType = async (type: 'standard' | 'custom') => {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('type', type);
      if (error) throw error;
      return count || 0;
    };

    const [standardCount, customCount, rows] = await Promise.all([
      countType('standard'),
      countType('custom'),
      fetchAllPages((from, to) =>
        supabase
          .from('orders')
          .select('total_amount')
          .neq('status', 'cancelled')
          .order('id', { ascending: true })
          .range(from, to)
      )
    ]);
    const revenue = (rows as { total_amount: number | null }[]).reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return { standardCount, customCount, revenue };
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
      const totalAmount = getCartTotal(cart);

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

      // Decrement topping stock. Best-effort: a failure here must not block the
      // order that already succeeded above.
      await this.consumeToppings(cart);

      return true;
    } catch (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
  },

  async consumeToppings(cart: CartItem[]) {
    try {
      const totals = new Map<string, number>();
      for (const item of cart) {
        for (const t of item.toppings ?? []) {
          totals.set(t.id, (totals.get(t.id) || 0) + t.quantity);
        }
      }
      if (totals.size === 0) return;

      const p_toppings = Array.from(totals.entries()).map(([id, quantity]) => ({ id, quantity }));
      const { error } = await supabase.rpc('consume_toppings', { p_toppings });
      if (error) throw error;
    } catch (error) {
      console.error('Error consuming topping stock:', error);
    }
  },

  async fetchToppings(): Promise<Topping[]> {
    try {
      const { data, error } = await supabase
        .from('toppings')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(t => ({ ...t, price: parseFloat(t.price) })) as Topping[];
    } catch (error) {
      console.error('Error fetching toppings:', error);
      return [];
    }
  },

  async createTopping(topping: { name: string; price: number; stock: number }) {
    try {
      const { error } = await supabase.from('toppings').insert([{
        name: topping.name,
        price: topping.price,
        stock: topping.stock,
        is_available: true
      }]);
      if (error) throw error;
    } catch (error) {
      console.error('Error creating topping:', error);
      throw error;
    }
  },

  async updateTopping(id: string, updates: Partial<Pick<Topping, 'name' | 'price' | 'stock' | 'is_available'>>) {
    try {
      const { error } = await supabase.from('toppings').update(updates).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating topping:', error);
      throw error;
    }
  },

  async deleteTopping(id: string) {
    try {
      const { error } = await supabase.from('toppings').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting topping:', error);
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
          stock: stock,
          prep_duration: product.prep_duration || null,
          toppings_enabled: !!product.toppings_enabled
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
    try {
      // Only product images change here. They are served to every menu visitor
      // and cards never render wider than ~400px, so shrinking them is what
      // cuts storage egress. Payment screenshots and custom-order reference
      // photos are admin-only, low volume, and must stay legible enough to read
      // a UPI transaction ID off — so that path is left exactly as it was.
      const isProductImage = bucket === 'products';

      const options = isProductImage
        ? {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 800,
            fileType: 'image/webp',
            useWebWorker: true,
          }
        : {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          };

      const compressedFile = await imageCompression(file, options);

      // Convert to ArrayBuffer to prevent Android "Failed to fetch" file path access issues
      const arrayBuffer = await compressedFile.arrayBuffer();

      // Products are converted to WebP, so the source filename no longer
      // describes the bytes and the extension comes from the MIME type instead.
      const contentType = isProductImage
        ? compressedFile.type || 'image/webp'
        : compressedFile.type || 'image/png';
      const fileExt = isProductImage
        ? contentType.split('/').pop() || 'webp'
        : compressedFile.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket || 'orders')
        .upload(filePath, arrayBuffer, {
          contentType,
          // Product filenames are unique per upload, so the object never changes
          // and can be cached for a year instead of re-fetched hourly.
          cacheControl: isProductImage ? '31536000, immutable' : '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase Upload Error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket || 'orders')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
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
