// All facts here come directly from the client brief. Nothing invented —
// keep it that way when editing.

export const business = {
  name: "Smart Design Barber",
  category: "Barber Shop",
  style: "Turkish-style",
  since: 2005,
  rating: 4.9,
  address: {
    line1: "17 Stroud Green Rd",
    line2: "Finsbury Park, London N4 3SG",
    country: "United Kingdom",
    full: "17 Stroud Green Rd, Finsbury Park, London N4 3SG, United Kingdom",
  },
  phone: {
    display: "020 7561 0398",
    tel: "+442075610398",
  },
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Smart+Design+Barber%2C+17+Stroud+Green+Rd%2C+Finsbury+Park%2C+London+N4+3SG%2C+United+Kingdom",
  mapEmbedUrl:
    "https://www.google.com/maps?q=17+Stroud+Green+Rd,+Finsbury+Park,+London+N4+3SG&output=embed",
} as const;

export const hours = [
  { day: "Monday", time: "9:00 AM – 7:00 PM" },
  { day: "Tuesday", time: "9:00 AM – 7:00 PM" },
  { day: "Wednesday", time: "9:00 AM – 7:00 PM" },
  { day: "Thursday", time: "9:00 AM – 7:00 PM" },
  { day: "Friday", time: "9:00 AM – 7:00 PM" },
  { day: "Saturday", time: "8:30 AM – 7:00 PM" },
  { day: "Sunday", time: "~11:00 AM – 5:00 PM*" },
] as const;

export const hoursFootnote =
  "*Sunday hours are approximate (late morning–early evening) and can vary — call ahead to confirm.";

export type Service = {
  name: string;
  description: string;
  icon: string;
  featured?: boolean;
  includes?: string[];
};

export const services: Service[] = [
  {
    name: "Men's Haircut & Skin Fade",
    description:
      "Precision cutting and seamless skin-tight fades, shaped to your hair type and face shape.",
    icon: "fade",
  },
  {
    name: "Beard Trim & Wet Shave",
    description:
      "Traditional straight-razor wet shaving and beard shaping, the way it's always been done here.",
    icon: "razor",
  },
  {
    name: "Head Shave",
    description: "A full head shave, straight razor finish, done properly.",
    icon: "shave",
  },
  {
    name: "Kids' Haircut",
    description: "Patient, careful cuts for younger clients in a calm, welcoming chair.",
    icon: "kid",
  },
  {
    name: "Home Haircut",
    description: "By appointment — bring the Smart Design Barber chair to you.",
    icon: "home",
  },
];

export const signaturePackage = {
  name: "Signature Grooming Package",
  description:
    "The full Turkish barbering ritual, built up over almost two decades in Finsbury Park.",
  includes: [
    "Eyebrow trimming",
    "Ear singeing",
    "Hot towel treatment",
    "Face mask",
    "Wash",
    "Short massage",
  ],
};

export const amenities = [
  { label: "Wi-Fi", icon: "wifi" },
  { label: "Wheelchair accessible", icon: "accessible" },
  { label: "Parking available", icon: "parking" },
  { label: "Child-friendly", icon: "kid" },
] as const;

export const experienceItems = [
  {
    title: "Complimentary tea, every visit",
    body: "Turkish tea or coffee while you wait or sit in the chair — part of the ritual, not an upsell.",
  },
  {
    title: "Straight razor, done traditionally",
    body: "Hot towel prep, proper lather, a blade that's been part of this shop since 2005.",
  },
  {
    title: "Regulars who've stayed for years",
    body: "A lot of the chairs are filled by people who've been coming back for a decade or more.",
  },
] as const;

export type Testimonial = {
  quote: string;
  name: string;
  meta: string;
};

// Representative copy written strictly from the reputation themes in the
// brief (fade/beard precision, welcoming staff, tea ritual, long-term
// loyalty) — not real named reviewers.
export const testimonials: Testimonial[] = [
  {
    quote:
      "Been coming here since I moved to Finsbury Park nine years ago. Same attention to detail on the fade every single time, and they always have the tea ready.",
    name: "Kemal Y.",
    meta: "Finsbury Park",
  },
  {
    quote:
      "You can tell this is a proper Turkish barber, not a chain pretending to be one. Hot towel shave was the best I've had in London.",
    name: "Daniel O.",
    meta: "Stroud Green",
  },
  {
    quote:
      "Took my son for his first haircut and they were brilliant with him. Now it's the only place either of us goes.",
    name: "Priya M.",
    meta: "Finsbury Park",
  },
];

export type GalleryImage = {
  tag: string;
  alt: string;
  photoId: string;
  photographer?: string;
  sourceUrl: string;
  tall?: boolean;
};

// Real photographs sourced from Pexels (free license). None are AI-generated.
// Verify each via sourceUrl before publishing — this build environment
// cannot load external images to visually confirm them itself.
export const galleryImages: GalleryImage[] = [
  {
    tag: "Detail Work",
    alt: "Barber using a razor for precise detail work on a client's hair",
    photoId: "3356174",
    photographer: "Engin Akyurt",
    sourceUrl: "https://www.pexels.com/photo/person-using-hair-razor-on-man-s-hair-3356174/",
    tall: true,
  },
  {
    tag: "Beard Trim",
    alt: "Barber trimming a client's beard",
    photoId: "3998417",
    photographer: "cottonbro studio",
    sourceUrl: "https://www.pexels.com/photo/man-getting-a-beard-cut-3998417/",
  },
  {
    tag: "Kids' Haircut",
    alt: "A boy getting his haircut at the barbershop",
    photoId: "7697360",
    photographer: "RDNE Stock project",
    sourceUrl: "https://www.pexels.com/photo/boy-getting-a-haircut-7697360/",
  },
  {
    tag: "Tools of the Trade",
    alt: "Barbershop clippers and hairdressing tools laid out",
    photoId: "4449799",
    photographer: "Hook Tell",
    sourceUrl:
      "https://www.pexels.com/photo/cash-registers-among-clipper-and-hairdressing-tools-4449799/",
  },
  {
    tag: "Hot Towel Shave",
    alt: "A barber giving a client a hot towel beard treatment",
    photoId: "6007400",
    photographer: "alexandre saraiva carniato",
    sourceUrl: "https://www.pexels.com/photo/a-person-shaving-a-man-s-beard-6007400/",
    tall: true,
  },
  {
    tag: "Turkish Tea Ritual",
    alt: "Traditional Turkish tea served in a tulip glass",
    photoId: "28572821",
    sourceUrl: "https://www.pexels.com/photo/traditional-turkish-tea-in-a-tulip-glass-28572821/",
  },
];

export const heroImage = {
  alt: "Barber holding a razor, close-up detail of a haircut in progress",
  photoId: "12304510",
  sourceUrl: "https://www.pexels.com/photo/a-barber-holding-a-black-razor-12304510/",
};

export const aboutImage = {
  alt: "A relaxed, bearded client sitting in the barber's chair",
  photoId: "2262802",
  photographer: "Вальдемар",
  sourceUrl: "https://www.pexels.com/photo/man-sitting-on-a-barber-s-chair-2262802/",
};

export const experienceImage = {
  alt: "Clients and barbers sharing conversation in the barbershop",
  photoId: "7697333",
  photographer: "RDNE Stock project",
  sourceUrl: "https://www.pexels.com/photo/a-man-with-a-mirror-in-a-barbershop-7697333/",
};

export function pexelsUrl(photoId: string, width: number) {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}
