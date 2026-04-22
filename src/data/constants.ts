import { Product } from '../types';

export const PHONE_NUMBER = "9505540326"; // Using standard wa.me format without '+'
export const INSTAGRAM_HANDLE = "@mini_crumbs.hyd";

export const CATEGORIES = ["All", "Skillet Cakes", "Brownies", "Cheesecakes", "Best Sellers", "Custom"];

export const PRODUCTS: Product[] = [
   {
      id: 1,
      name: "Choco Lava Skillet",
      desc: "Warm, gooey chocolate lava centered skillet cake for ultimate indulgence.",
      price: 499,
      prices: { "1/2kg": 499, "1kg": 899, "1.5kg": 1299 },
      category: "Skillet Cakes",
      image: "/Chco Lava skillet.png",
      popular: true,
   },
   {
      id: 2,
      name: "Dark Chocolate Skillet",
      desc: "Rich, intense dark chocolate baked to perfection in a classic skillet.",
      price: 549,
      prices: { "1/2kg": 549, "1kg": 999, "1.5kg": 1399 },
      category: "Skillet Cakes",
      image: "/Dark Chocolate Skillet.png",
      popular: false,
   },
   {
      id: 3,
      name: "Lotus Biscoff Cheesecake",
      desc: "Creamy cheesecake swirled with Lotus Biscoff spread and topped with biscuit crumbs.",
      price: 699,
      prices: { "1/2kg": 699, "1kg": 1299, "1.5kg": 1899 },
      category: "Cheesecakes",
      image: "/Lotus Biscoff cheese cake.png",
      popular: true,
   },
   {
      id: 4,
      name: "Matilda Bento Cake",
      desc: "Small but mighty chocolate cake inspired by the classic movie, perfect for gifting.",
      price: 449,
      prices: { "1/2kg": 449, "1kg": 849, "1.5kg": 1199 },
      category: "Best Sellers",
      image: "/Matilda Bento Cake.png",
      popular: true,
   },
   {
      id: 5,
      name: "Raw Chocolate Cake",
      desc: "Pure, decadent chocolate cake made with premium ingredients for a clean taste.",
      price: 599,
      prices: { "1/2kg": 599, "1kg": 1099, "1.5kg": 1599 },
      category: "Best Sellers",
      image: "/Raw choclatecale.png",
      popular: false,
   },
   {
      id: 6,
      name: "Red Velvet Skillet",
      desc: "Velvety smooth red velvet base with a light chocolate note and creamy finish.",
      price: 549,
      prices: { "1/2kg": 549, "1kg": 999, "1.5kg": 1399 },
      category: "Skillet Cakes",
      image: "/Red velvet skillet.png",
      popular: false,
   },
   {
      id: 7,
      name: "Basque Cheesecake",
      desc: "Famous burnt cheesecake with a caramelized top and super creamy center.",
      price: 749,
      prices: { "1/2kg": 749, "1kg": 1399, "1.5kg": 1999 },
      category: "Cheesecakes",
      image: "/Basque cheesecake.png",
      popular: true,
   },
   {
      id: 8,
      name: "Chocolate Brownie Slab",
      desc: "A massive slab of our signature fudgy brownies, perfect for celebrations.",
      price: 899,
      prices: { "1/2kg": 899, "1kg": 1699, "1.5kg": 2399 },
      category: "Brownies",
      image: "/Chocolate Brownie Slab.png",
      popular: false,
   },
];


