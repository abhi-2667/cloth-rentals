const categoryImages = {
  wedding: [
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1594938298596-ecdf91811eb1?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=1000&auto=format&fit=crop'
  ],
  party: [
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495385794356-15371f348c31?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop'
  ],
  casual: [
    'https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1000&auto=format&fit=crop'
  ],
  default: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618932260643-ebaada120ee3?q=80&w=1000&auto=format&fit=crop'
  ]
};

// Generates a simple hash string to pick consistently from the array
const getHash = (str) => {
  str = String(str);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const buildClothFallbackImage = ({ _id, title = 'Rental piece', category = 'default' } = {}) => {
  const c = String(category).toLowerCase();
  const images = categoryImages[c] || categoryImages.default;
  // If we have an ID or title to hash, we pick consistently
  const hashStr = _id || title || 'default';
  const matchIndex = getHash(hashStr) % images.length;
  
  return images[matchIndex];
};

export const getClothImageSrc = (cloth) => {
  const raw = String(cloth?.imageUrl || '').trim();
  if (!raw) return buildClothFallbackImage(cloth);
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:image/')) {
    return raw;
  }
  if (raw.startsWith('/uploads/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${raw}`;
  }
  return buildClothFallbackImage(cloth);
};

export const getEditorialPanelSrc = (title, label) => {
  const c = String(label).toLowerCase();
  const images = categoryImages[c] || categoryImages.default;
  return images[0]; // Just return the first one for the editorial panels
};
