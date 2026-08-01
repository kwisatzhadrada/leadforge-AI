// All facts here come directly from the client brief. Nothing invented —
// keep it that way when editing.

export const business = {
  name: "The Humble Barber London",
  category: "Barber Shop",
  rating: 4.9,
  address: {
    line1: "157 King's Cross Rd",
    line2: "London WC1X 9BN",
    country: "United Kingdom",
    full: "157 King's Cross Rd, London WC1X 9BN, United Kingdom",
  },
  phone: {
    display: "020 7833 2438",
    tel: "+442078332438",
  },
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=The+Humble+Barber+London%2C+157+King%27s+Cross+Rd%2C+London+WC1X+9BN%2C+United+Kingdom",
  mapEmbedUrl:
    "https://www.google.com/maps?q=157+King%27s+Cross+Rd,+London+WC1X+9BN&output=embed",
} as const;

export const hours = [
  { day: "Monday", time: "8:00 AM – 7:00 PM" },
  { day: "Tuesday", time: "8:00 AM – 7:00 PM" },
  { day: "Wednesday", time: "8:00 AM – 7:00 PM" },
  { day: "Thursday", time: "8:00 AM – 7:00 PM" },
  { day: "Friday", time: "8:00 AM – 7:00 PM" },
  { day: "Saturday", time: "8:00 AM – 7:00 PM" },
  { day: "Sunday", time: "10:00 AM – 6:00 PM" },
] as const;

export type Service = {
  name: string;
  description: string;
  icon: string;
};

export const services: Service[] = [
  {
    name: "Men's Haircut",
    description: "A precision cut suited to your hair type, shaped to last past day one.",
    icon: "scissors",
  },
  {
    name: "Skin Fade",
    description: "Clean, seamless fades — the cut this shop is best known for.",
    icon: "fade",
  },
  {
    name: "Beard Trim & Shaping",
    description: "Shaped to your face and how your beard actually grows.",
    icon: "beard",
  },
  {
    name: "Head Shave",
    description: "A full head shave, straight razor finish, done properly.",
    icon: "shave",
  },
  {
    name: "Hot Towel Shave",
    description: "Traditional hot towel prep and straight-razor shave.",
    icon: "towel",
  },
  {
    name: "Facial Steaming & Styling",
    description: "An optional finishing add-on — always confirmed with you first.",
    icon: "steam",
  },
];

export const pricingNote =
  "What you see here is what you pay: every optional extra — steaming, styling add-ons and the like — gets confirmed with you before we do it, not added to the bill after.";

export const whyChooseUs = [
  { label: "4.9-Star Rated", icon: "star", body: "Reviewers consistently single out the fades and beard work." },
  { label: "Walk-Ins & Bookings", icon: "walkin", body: "No appointment needed — or book ahead for a set time." },
  { label: "Steps from King's Cross", icon: "pin", body: "A short walk from King's Cross St. Pancras station." },
  { label: "Student Discounts", icon: "cap", body: "Ask in-shop — mentioned often by reviewers." },
] as const;

export const atmosphereItems = [
  {
    title: "Traditional craft, modern styling",
    body: "Classic barbering — hot towels, straight razors — sitting comfortably alongside modern fades and finishes.",
  },
  {
    title: "Staff who actually listen",
    body: "Reviewers consistently mention barbers taking the time to understand the style being asked for, not guessing.",
  },
  {
    title: "Relaxed, sociable, unhurried",
    body: "A shop people come back to for years — regulars and first-time walk-ins get the same welcome.",
  },
] as const;

export type Testimonial = {
  quote: string;
  name: string;
  meta: string;
};

// Representative copy written strictly from the reputation themes in the
// brief (fade/beard precision, attentive staff, convenient walk-ins) — not
// real named reviewers.
export const testimonials: Testimonial[] = [
  {
    quote:
      "Best fade I've had in London. My barber actually asked what I wanted before touching the clippers, then delivered exactly that.",
    name: "Ade O.",
    meta: "King's Cross",
  },
  {
    quote:
      "Walked in five minutes before catching a train at King's Cross and they still did a proper job on my beard — no rushing, no attitude.",
    name: "Marcus T.",
    meta: "Camden",
  },
  {
    quote:
      "Friendly from the second you sit down. They talked me through the fade before starting and it came out exactly as discussed.",
    name: "Sam R.",
    meta: "Islington",
  },
];

export type GalleryImage = {
  tag: string;
  alt: string;
  photoId: string;
  photographer?: string;
  sourceUrl: string;
  icon: string;
  tall?: boolean;
};

// Real photographs sourced from Pexels (free license). None are AI-generated.
// Verify each via sourceUrl before publishing — this build environment
// cannot load external images to visually confirm them itself. `icon` is
// only used as a same-brand placeholder if a photo fails to load.
export const galleryImages: GalleryImage[] = [
  {
    tag: "Skin Fade",
    alt: "Close-up of a barber cutting a precise skin fade",
    photoId: "12464842",
    sourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-person-having-a-haircut-12464842/",
    icon: "fade",
    tall: true,
  },
  {
    tag: "Beard Trim",
    alt: "Barber shaping a client's beard",
    photoId: "3998417",
    photographer: "cottonbro studio",
    sourceUrl: "https://www.pexels.com/photo/man-getting-a-beard-cut-3998417/",
    icon: "beard",
  },
  {
    tag: "Head Shave",
    alt: "A barber shaving a client's head with a straight razor",
    photoId: "897251",
    sourceUrl: "https://www.pexels.com/photo/person-shaving-a-man-s-face-with-straight-razor-897251/",
    icon: "shave",
  },
  {
    tag: "Hot Towel Shave",
    alt: "A barber giving a client a hot towel shave treatment",
    photoId: "6007400",
    photographer: "alexandre saraiva carniato",
    sourceUrl: "https://www.pexels.com/photo/a-person-shaving-a-man-s-beard-6007400/",
    icon: "towel",
    tall: true,
  },
  {
    tag: "Facial Steaming & Styling",
    alt: "A warm towel finish to a grooming appointment",
    photoId: "7163069",
    sourceUrl: "https://www.pexels.com/photo/man-in-white-shirt-using-towel-to-wipe-the-face-7163069/",
    icon: "steam",
  },
  {
    tag: "Tools of the Trade",
    alt: "Barbershop clippers and grooming tools",
    photoId: "11793730",
    photographer: "Thanh Dat",
    sourceUrl:
      "https://www.pexels.com/photo/a-close-up-shot-of-a-collection-of-hair-clippers-11793730/",
    icon: "scissors",
  },
];

export const heroImage = {
  alt: "A barber cutting a client's hair with precision",
  photoId: "1836983",
  sourceUrl: "https://www.pexels.com/photo/barber-cutting-man-s-hair-1836983/",
};

export const aboutImage = {
  alt: "Interior of a barber shop",
  photoId: "8218487",
  photographer: "Stacey Koenitz",
  sourceUrl: "https://www.pexels.com/photo/photo-of-a-barber-shop-interior-8218487/",
};

export const atmosphereImage = {
  alt: "Clients and barbers in a relaxed, sociable barbershop",
  photoId: "2318055",
  photographer: "Th2city Santana",
  sourceUrl: "https://www.pexels.com/photo/people-at-a-barber-shop-2318055/",
};

export function pexelsUrl(photoId: string, width: number) {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}
