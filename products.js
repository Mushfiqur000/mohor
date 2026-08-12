// products.js — Static fallback product catalog
// Used only when Firestore is empty/unreachable. Keep structure compatible
// with documents created from the Admin dashboard. This file is intentionally
// small and safe; update it in the Admin UI or in Firestore for production.

window.productsData = [
  {
    id: "sample-1",
    title: { en: "Sample Three-Piece Set", bn: "নমুনা থ্রি-পিস" },
    category: "three-piece",
    price: 1850,
    images: ["assets/image-placeholder.svg"],
    colors: ["Maroon", "Olive"],
    sizes: ["S", "M", "L"],
    sizeMeasurements: { M: { en: "Bust: 36in, Waist: 30in", bn: "বুক: 36in, কোমর: 30in" } },
    description: { en: "A sample fallback product used when Firestore is unavailable.", bn: "ফায়ারস্টোর অনুপলভ্য হলে ব্যবহারের জন্য নমুনা পণ্য।" },
    details: ["Hand-finished embroidery", "Machine-wash gentle"]
  }
];
