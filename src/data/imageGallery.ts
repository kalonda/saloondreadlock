export interface GalleryImage {
  id: string;
  title: string;
  category: 'braids' | 'hair' | 'makeup' | 'dreads' | 'treatments' | 'styling' | 'barber';
  url: string;
  tag: string;
}

export const INITIAL_GALLERY_IMAGES: GalleryImage[] = [
  // Braids
  {
    id: 'img-br-1',
    title: 'Knotless Braids Medium Waist',
    category: 'braids',
    url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80',
    tag: 'Knotless'
  },
  {
    id: 'img-br-2',
    title: 'Clean Stitch Lines Cornrows',
    category: 'braids',
    url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
    tag: 'Stitch'
  },
  {
    id: 'img-br-3',
    title: 'Yeboyebo Geometric Cornrows',
    category: 'braids',
    url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
    tag: 'Yeboyebo'
  },
  {
    id: 'img-br-4',
    title: 'Butterfly Distressed Locs',
    category: 'braids',
    url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80',
    tag: 'Butterfly'
  },
  {
    id: 'img-br-5',
    title: 'Passion & Koko Curly Twists',
    category: 'braids',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    tag: 'Kokotwist'
  },
  {
    id: 'img-br-6',
    title: 'Two Strand Natural Twists',
    category: 'braids',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    tag: 'Njia Mbili'
  },

  // Dreadlocks
  {
    id: 'img-dr-1',
    title: 'Fresh Starter Dreadlocks Twist',
    category: 'dreads',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    tag: 'Dreadlocks'
  },
  {
    id: 'img-dr-2',
    title: 'Crochet Loc Maintenance & Repair',
    category: 'dreads',
    url: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=800&q=80',
    tag: 'Repairing'
  },
  {
    id: 'img-dr-3',
    title: 'Textured Semi-Freeform Dreads',
    category: 'dreads',
    url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    tag: 'Rafu Dread'
  },

  // Hair & Weaves
  {
    id: 'img-hr-1',
    title: 'HD Frontal Weave Sew-in',
    category: 'hair',
    url: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=800&q=80',
    tag: 'Weaving'
  },
  {
    id: 'img-hr-2',
    title: 'Protective Net Wave Installation',
    category: 'hair',
    url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
    tag: 'Net Wave'
  },
  {
    id: 'img-hr-3',
    title: 'Quick Weave Glued Bonding',
    category: 'hair',
    url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
    tag: 'Kubondi'
  },
  {
    id: 'img-hr-4',
    title: 'Professional Wash & Blowdry',
    category: 'hair',
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
    tag: 'Kuosha'
  },

  // Treatments & Chemical
  {
    id: 'img-tr-1',
    title: 'Chemical Relaxer Treatment',
    category: 'treatments',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    tag: 'Kupaka Dawa'
  },
  {
    id: 'img-tr-2',
    title: 'Organic Scalp Steaming',
    category: 'treatments',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    tag: 'Steaming'
  },
  {
    id: 'img-tr-3',
    title: 'Hair Lightening & Bleach',
    category: 'treatments',
    url: 'https://images.unsplash.com/photo-1597225244660-1cd128c64284?auto=format&fit=crop&w=800&q=80',
    tag: 'Bleach'
  },

  // Styling & Updos
  {
    id: 'img-st-1',
    title: 'Sleek Bridal Bun Updo',
    category: 'styling',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    tag: 'Kubana Styles'
  },
  {
    id: 'img-st-2',
    title: 'Silk Press Straightening',
    category: 'styling',
    url: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&w=800&q=80',
    tag: 'Kupasi'
  },
  {
    id: 'img-st-3',
    title: 'Hand Defined Finger Coils',
    category: 'styling',
    url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
    tag: 'Finger Coils'
  },
  {
    id: 'img-st-4',
    title: 'Roller Setting & Big Waves',
    category: 'styling',
    url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    tag: 'Kuset'
  },

  // Makeup
  {
    id: 'img-mk-1',
    title: 'Full Glam Wedding & Event Makeup',
    category: 'makeup',
    url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    tag: 'Full Makeup'
  },
  {
    id: 'img-mk-2',
    title: 'Natural Soft Everyday Glow',
    category: 'makeup',
    url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
    tag: 'Simple Makeup'
  }
];
