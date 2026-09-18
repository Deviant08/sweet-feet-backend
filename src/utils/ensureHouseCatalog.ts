import Product from "../models/product.model";

/** Homepage featured shoes — Sweet Feet’s own listings, not a retailer. */
export const HOUSE_CATALOG = [
  {
    houseKey: "sf-trainers",
    name: "Trainers",
    category: "trainers",
    gender: "unisex",
    price: 45000,
    color: "black",
    badge: "top",
    badgeLabel: "SWEET FEET",
    rating: 4.6,
    ratingCount: 84,
    sizes: [40, 41, 42, 43, 44],
    img: "https://i.pinimg.com/1200x/a2/44/58/a2445825e5f5617fd76606d0151897fc.jpg",
  },
  {
    houseKey: "sf-casual-shoes",
    name: "Casual shoes",
    category: "casual",
    gender: "unisex",
    price: 32000,
    color: "white",
    badge: "top",
    badgeLabel: "SWEET FEET",
    rating: 4.4,
    ratingCount: 61,
    sizes: [39, 40, 41, 42, 43],
    img: "https://i.pinimg.com/1200x/95/d5/e1/95d5e18c05b0269621143c82adc57342.jpg",
  },
  {
    houseKey: "sf-corporate-shoes",
    name: "Corporate shoes",
    category: "corporate",
    gender: "men",
    price: 55000,
    color: "brown",
    badge: "top",
    badgeLabel: "SWEET FEET",
    rating: 4.7,
    ratingCount: 52,
    sizes: [40, 41, 42, 43, 44, 45],
    img: "https://png.pngtree.com/png-vector/20240910/ourmid/pngtree-mens-classic-brown-leather-dress-shoes-with-white-background-png-image_13804868.png",
  },
  {
    houseKey: "sf-loafers",
    name: "Loafers",
    category: "loafers",
    gender: "unisex",
    price: 38500,
    color: "black",
    badge: "top",
    badgeLabel: "SWEET FEET",
    rating: 4.5,
    ratingCount: 73,
    sizes: [38, 39, 40, 41, 42, 43],
    img: "https://www.shutterstock.com/image-photo/glossy-black-leather-loafers-casual-600nw-2508631511.jpg",
  },
  {
    houseKey: "sf-runners",
    name: "Runners",
    category: "runners",
    gender: "unisex",
    price: 28000,
    color: "multi",
    badge: "top",
    badgeLabel: "SWEET FEET",
    rating: 4.3,
    ratingCount: 97,
    sizes: [40, 41, 42, 43, 44],
    img: "https://media.istockphoto.com/id/1249496770/photo/running-shoes.jpg?s=612x612&w=0&k=20&c=b4MahNlk4LH6H1ksJApfnlQ5ZPM3KGhI5i_yqhGD9c4=",
  },
];

/**
 * Insert missing official products only. Never overwrites admin edits.
 */
export async function ensureHouseCatalog(): Promise<void> {
  let created = 0;
  for (const item of HOUSE_CATALOG) {
    const exists = await Product.findOne({ houseKey: item.houseKey }).select("_id");
    if (exists) continue;
    await Product.create({
      ...item,
      isHouse: true,
      isActive: true,
    });
    created += 1;
  }
  if (created) {
    console.log(`Sweet Feet house catalogue: added ${created} official product${created === 1 ? "" : "s"}`);
  } else {
    console.log("Sweet Feet house catalogue: already in place");
  }
}
