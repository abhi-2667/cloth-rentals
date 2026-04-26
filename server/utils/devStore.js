const bcrypt = require('bcrypt');
const crypto = require('crypto');

const state = {
  users: [],
  clothes: [],
  bookings: [],
  wishlistItems: [],
  reviews: [],
  notifications: [],
  pendingSignups: [],
};

const createId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 24);

const clone = (value) => JSON.parse(JSON.stringify(value));
const normalizeTitle = (value) => String(value || '').trim().toLowerCase();
const toInrPrice = (value) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 999;
  if (numeric >= 1000) return Math.round(numeric);
  return Math.round(numeric * 20);
};

const normalizeDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const inferGenderFromTitle = (title) => {
  const value = String(title || '').toLowerCase();
  const womenTokens = ['saree', 'lehenga', 'anarkali', 'gown', 'dress', 'sharara', 'gharara', 'salwar', 'jumpsuit'];
  const menTokens = ['sherwani', 'kurta', 'tuxedo', 'bandhgala', 'achkan', 'jodhpuri', 'pathani', 'indo-western suit'];
  if (womenTokens.some((token) => value.includes(token))) return 'women';
  if (menTokens.some((token) => value.includes(token))) return 'men';
  return 'unisex';
};

const buildDemoImage = (title, category, palette) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.bgA}" />
          <stop offset="100%" stop-color="${palette.bgB}" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="28%" r="70%">
          <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.52" />
          <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#bg)" />
      <rect width="800" height="1000" fill="url(#glow)" />
      <circle cx="640" cy="170" r="155" fill="${palette.accent}" fill-opacity="0.12" />
      <circle cx="150" cy="860" r="210" fill="${palette.accent}" fill-opacity="0.10" />
      <path d="M245 810C270 610 330 470 400 405C470 470 530 610 555 810" fill="none" stroke="${palette.accent}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
      <path d="M340 405L400 330L460 405L428 450H372Z" fill="${palette.accent}" fill-opacity="0.95" />
      <path d="M305 540H495" stroke="${palette.line}" stroke-width="12" stroke-linecap="round" stroke-opacity="0.4" />
      <path d="M285 650H515" stroke="${palette.line}" stroke-width="12" stroke-linecap="round" stroke-opacity="0.28" />
      <text x="72" y="100" fill="${palette.text}" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="3">LOOKBOOK</text>
      <rect x="72" y="126" width="150" height="4" fill="${palette.accent}" opacity="0.7" />
      <text x="72" y="905" fill="${palette.text}" font-family="Arial, sans-serif" font-size="48" font-weight="700">${title}</text>
      <text x="72" y="950" fill="${palette.text}" font-family="Arial, sans-serif" font-size="22" font-weight="700" opacity="0.85">${category.toUpperCase()}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const demoClothes = [
  {
    title: 'Ivory Atelier Gown',
    description: 'Elegant drape with a sculpted bodice and refined sweep for weddings and formal events.',
    category: 'wedding',
    size: 'M',
    pricePerDay: 180,
    availability: true,
    imageUrl: buildDemoImage('Ivory Atelier Gown', 'Wedding', { bgA: '#f4efe7', bgB: '#cec3b0', accent: '#c7a037', line: '#0f1625', text: '#0f1625' }),
  },
  {
    title: 'Midnight Velvet Set',
    description: 'A tailored party look with rich texture, dramatic shape, and after-dark energy.',
    category: 'party',
    size: 'L',
    pricePerDay: 145,
    availability: true,
    imageUrl: buildDemoImage('Midnight Velvet Set', 'Party', { bgA: '#101728', bgB: '#0b101b', accent: '#2d8b83', line: '#f7f4ec', text: '#f7f4ec' }),
  },
  {
    title: 'Slate City Blazer',
    description: 'Sharp neutral tailoring for minimal, everyday formalwear and creative work events.',
    category: 'casual',
    size: 'S',
    pricePerDay: 88,
    availability: true,
    imageUrl: buildDemoImage('Slate City Blazer', 'Casual', { bgA: '#e6dfd2', bgB: '#bdb6a7', accent: '#6e7c8f', line: '#0f1625', text: '#0f1625' }),
  },
  {
    title: 'Champagne Mirage Dress',
    description: 'Soft shine and fluid movement, designed for receptions and evening portraits.',
    category: 'wedding',
    size: 'M',
    pricePerDay: 200,
    availability: true,
    imageUrl: buildDemoImage('Champagne Mirage Dress', 'Wedding', { bgA: '#efe7d5', bgB: '#cbbd9b', accent: '#cf9f3a', line: '#102033', text: '#102033' }),
  },
  {
    title: 'Emerald Night Saree',
    description: 'A high-impact drape with jewelry-ready styling for festive and upscale occasions.',
    category: 'party',
    size: 'XS',
    pricePerDay: 160,
    availability: false,
    imageUrl: buildDemoImage('Emerald Night Saree', 'Party', { bgA: '#10231f', bgB: '#08150f', accent: '#2d8b83', line: '#f7f4ec', text: '#f7f4ec' }),
  },
  {
    title: 'Pearl Terrace Kurta',
    description: 'Understated and polished with an easy fit for daytime events and gatherings.',
    category: 'casual',
    size: 'XL',
    pricePerDay: 76,
    availability: true,
    imageUrl: buildDemoImage('Pearl Terrace Kurta', 'Casual', { bgA: '#f5f0e4', bgB: '#d7ccb9', accent: '#7c8797', line: '#102033', text: '#102033' }),
  },
  {
    title: 'Rose Gold Reception Lehenga',
    description: 'Lightweight layered lehenga with shimmer detailing for receptions and evening celebrations.',
    category: 'wedding',
    size: 'M',
    pricePerDay: 210,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?lehenga,wedding,fashion',
  },
  {
    title: 'Sapphire Gala Gown',
    description: 'Structured evening gown with elegant movement and a premium satin finish.',
    category: 'party',
    size: 'L',
    pricePerDay: 190,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?gown,evening,fashion',
  },
  {
    title: 'Noir Tailored Tuxedo Set',
    description: 'Classic black tuxedo styling suitable for formal functions and black-tie events.',
    category: 'party',
    size: 'XL',
    pricePerDay: 175,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?tuxedo,formalwear,style',
  },
  {
    title: 'Ivory Minimal Sherwani',
    description: 'Clean silhouette sherwani designed for ceremonies with understated luxury.',
    category: 'wedding',
    size: 'L',
    pricePerDay: 220,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?sherwani,indian,wedding',
  },
  {
    title: 'Blush Evening Saree',
    description: 'Soft blush saree with subtle shine and fluid drape for festive occasions.',
    category: 'party',
    size: 'S',
    pricePerDay: 155,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?saree,fashion,party',
  },
  {
    title: 'Cocoa Linen Co-ord',
    description: 'Breathable linen co-ord set crafted for casual events and relaxed styling.',
    category: 'casual',
    size: 'M',
    pricePerDay: 95,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?linen,fashion,outfit',
  },
  {
    title: 'Urban Slate Jumpsuit',
    description: 'Modern statement jumpsuit with tailored waistline for social evenings.',
    category: 'casual',
    size: 'M',
    pricePerDay: 105,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?jumpsuit,fashion,woman',
  },
  {
    title: 'Royal Maroon Anarkali',
    description: 'Floor-length anarkali with graceful flare and rich festive tones.',
    category: 'wedding',
    size: 'S',
    pricePerDay: 170,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?anarkali,ethnic,dress',
  },
  {
    title: 'Graphite Street Blazer',
    description: 'Smart-casual blazer for contemporary styling and day-to-night looks.',
    category: 'casual',
    size: 'L',
    pricePerDay: 92,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?blazer,streetstyle,fashion',
  },
  {
    title: 'Moonlight Cocktail Dress',
    description: 'Clean-cut cocktail dress with subtle texture and premium fit.',
    category: 'party',
    size: 'XS',
    pricePerDay: 140,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?cocktail,dress,style',
  },
  {
    title: 'Terracotta Festive Kurta Set',
    description: 'Festive kurta ensemble with comfortable fit and elegant detailing.',
    category: 'casual',
    size: 'XL',
    pricePerDay: 85,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?kurta,ethnic,men',
  },
  {
    title: 'Champagne Bridal Trail Gown',
    description: 'Premium bridal-inspired gown with flowing trail and couture styling.',
    category: 'wedding',
    size: 'M',
    pricePerDay: 245,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?bridal,gown,wedding',
  },
  {
    title: 'Celestial Blue Reception Saree',
    description: 'Festive saree with mirror accents and a polished reception-ready drape.',
    category: 'wedding',
    size: 'M',
    pricePerDay: 182,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?blue,saree,reception',
  },
  {
    title: 'Velvet Noir Evening Blazer',
    description: 'Premium velvet blazer crafted for cocktail events and formal dinners.',
    category: 'party',
    size: 'L',
    pricePerDay: 168,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?velvet,blazer,evening',
  },
  {
    title: 'Ivory Pearl Bridal Lehenga',
    description: 'Bridal lehenga with elegant embroidery and a modern lightweight silhouette.',
    category: 'wedding',
    size: 'S',
    pricePerDay: 255,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?bridal,lehenga,ivory',
  },
  {
    title: 'Mint Garden Party Dress',
    description: 'Flowy garden-party dress with minimal detailing and soft color tone.',
    category: 'party',
    size: 'XS',
    pricePerDay: 132,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?party,dress,mint',
  },
  {
    title: 'Sandstone Casual Kurta',
    description: 'Comfortable everyday kurta set suited for family events and gatherings.',
    category: 'casual',
    size: 'XL',
    pricePerDay: 78,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?casual,kurta,fashion',
  },
  {
    title: 'Ruby Luxe Cocktail Gown',
    description: 'Sleek cocktail gown with rich ruby tones and a clean modern cut.',
    category: 'party',
    size: 'M',
    pricePerDay: 188,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?red,gown,cocktail',
  },
  {
    title: 'Classic Cream Sherwani Set',
    description: 'Traditional sherwani set with subtle detailing for ceremonies and weddings.',
    category: 'wedding',
    size: 'L',
    pricePerDay: 214,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?cream,sherwani,wedding',
  },
  {
    title: 'Steel Grey Indo-Western',
    description: 'Modern Indo-western fusion outfit for evening functions and receptions.',
    category: 'party',
    size: 'M',
    pricePerDay: 164,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?indo-western,men,fashion',
  },
  {
    title: 'Pistachio Daywear Co-ord',
    description: 'Easy daywear co-ord with breathable fit and minimal design language.',
    category: 'casual',
    size: 'S',
    pricePerDay: 90,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?coord,set,fashion',
  },
  {
    title: 'Copper Festive Anarkali',
    description: 'Festive anarkali featuring layered flow and warm copper color accents.',
    category: 'wedding',
    size: 'M',
    pricePerDay: 176,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?anarkali,festive,style',
  },
  {
    title: 'Graphite Signature Suit',
    description: 'Refined signature suit ideal for formal events and celebration nights.',
    category: 'party',
    size: 'XL',
    pricePerDay: 172,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?formal,suit,men',
  },
  {
    title: 'Champagne Minimal Saree',
    description: 'Understated saree styling with satin drape for premium evening wear.',
    category: 'party',
    size: 'S',
    pricePerDay: 148,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?champagne,saree,fashion',
  },
  {
    title: 'Forest Green Kurta Jacket',
    description: 'Kurta and jacket set balancing festive detail with practical comfort.',
    category: 'casual',
    size: 'L',
    pricePerDay: 98,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?kurta,jacket,ethnic',
  },
  {
    title: 'Silver Moon Evening Dress',
    description: 'Elegant evening dress with a subtle metallic sheen and graceful flow.',
    category: 'party',
    size: 'M',
    pricePerDay: 158,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?silver,dress,evening',
  },
  {
    title: 'Marigold Wedding Kurta',
    description: 'Bright celebratory kurta look designed for daytime wedding ceremonies.',
    category: 'wedding',
    size: 'XL',
    pricePerDay: 120,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?marigold,kurta,wedding',
  },
  {
    title: 'Charcoal Smart Casual Set',
    description: 'Contemporary smart-casual set suitable for events and social meetups.',
    category: 'casual',
    size: 'M',
    pricePerDay: 88,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?smart,casual,outfit',
  },
  {
    title: 'Pearl White Ceremony Gown',
    description: 'Statement ceremony gown with elegant structure and soft pearl finish.',
    category: 'wedding',
    size: 'S',
    pricePerDay: 236,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?white,gown,ceremony',
  },
  {
    title: 'Midnight Navy Party Jumpsuit',
    description: 'High-impact navy jumpsuit for party nights with a sharp tailored fit.',
    category: 'party',
    size: 'L',
    pricePerDay: 146,
    availability: true,
    imageUrl: 'https://source.unsplash.com/1600x1000/?navy,jumpsuit,party',
  },
];

const seedInventory = async () => {
  if (state.clothes.length > 0) {
    return;
  }

  const seenTitles = new Set();
  state.clothes = demoClothes
    .filter((cloth) => {
      const key = normalizeTitle(cloth.title);
      if (!key || seenTitles.has(key)) {
        return false;
      }
      seenTitles.add(key);
      return true;
    })
    .map((cloth) => ({
      _id: createId(),
      ...cloth,
      occasion: cloth.category,
      gender: inferGenderFromTitle(cloth.title),
      pricePerDay: toInrPrice(cloth.pricePerDay),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  if (state.users.length === 0) {
    const [adminPassword, userPassword] = await Promise.all([
      bcrypt.hash('Admin1234!', 10),
      bcrypt.hash('User1234!', 10),
    ]);

    const now = new Date().toISOString();
    state.users.push(
      {
        _id: createId(),
        name: 'Studio Admin',
        email: 'admin@cloth-rental.local',
        password: adminPassword,
        role: 'admin',
        approvalStatus: 'approved',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: createId(),
        name: 'Studio User',
        email: 'user@cloth-rental.local',
        password: userPassword,
        role: 'user',
        approvalStatus: 'approved',
        createdAt: now,
        updatedAt: now,
      }
    );
  }
};

const getClothById = (clothId) => state.clothes.find((cloth) => cloth._id === String(clothId)) || null;

const matchesSize = (clothSize, querySize) => {
  if (!querySize) return true;
  if (typeof querySize === 'string') {
    return clothSize.toLowerCase().includes(querySize.toLowerCase());
  }
  if (querySize.$regex) {
    const flags = querySize.$options || '';
    return new RegExp(querySize.$regex, flags).test(clothSize);
  }
  return true;
};

const getUnavailableClothIdsForRange = (startDate, endDate) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  return state.bookings
    .filter((booking) => booking.status === 'booked')
    .filter((booking) => normalizeDate(booking.startDate) <= end && normalizeDate(booking.endDate) >= start)
    .map((booking) => booking.clothId);
};

const listClothes = ({ category, occasion, gender, availability, size, minPrice, maxPrice, startDate, endDate, search } = {}) => {
  const unavailableIds = startDate && endDate ? new Set(getUnavailableClothIdsForRange(startDate, endDate)) : null;
  const normalizedOccasion = String(occasion || category || '').toLowerCase();
  const normalizedGender = String(gender || '').toLowerCase();
  const normalizedAvailability = availability === 'true' ? true : availability === 'false' ? false : null;
  const normalizedSearch = String(search || '').trim().toLowerCase();

  return state.clothes.filter((cloth) => {
    if (normalizedOccasion && String(cloth.occasion || cloth.category).toLowerCase() !== normalizedOccasion) return false;
    if (normalizedGender && String(cloth.gender || 'unisex').toLowerCase() !== normalizedGender) return false;
    if (normalizedAvailability !== null && Boolean(cloth.availability) !== normalizedAvailability) return false;
    if (!matchesSize(cloth.size, size)) return false;
    if (minPrice !== undefined && minPrice !== '' && cloth.pricePerDay < Number(minPrice)) return false;
    if (maxPrice !== undefined && maxPrice !== '' && cloth.pricePerDay > Number(maxPrice)) return false;
    if (unavailableIds && unavailableIds.has(cloth._id)) return false;
    if (normalizedSearch) {
      const haystack = [cloth.title, cloth.description, cloth.category]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      if (!haystack.includes(normalizedSearch)) return false;
    }
    return true;
  }).map(clone);
};

const addCloth = (data) => {
  const cloth = {
    _id: createId(),
    title: data.title,
    description: data.description,
    category: data.category,
    occasion: data.occasion || data.category,
    gender: data.gender || 'unisex',
    size: data.size,
    pricePerDay: Number(data.pricePerDay),
    availability: data.availability !== undefined ? Boolean(data.availability) : true,
    imageUrl: data.imageUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.clothes.push(cloth);
  return clone(cloth);
};

const updateCloth = (clothId, fields) => {
  const cloth = state.clothes.find((item) => item._id === String(clothId));
  if (!cloth) return null;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      if (key === 'occasion' || key === 'category') {
        cloth[key] = value;
        if (key === 'category' && fields.occasion === undefined) {
          cloth.occasion = value;
        }
      } else {
        cloth[key] = key === 'pricePerDay' ? Number(value) : value;
      }
    }
  }

  cloth.updatedAt = new Date().toISOString();
  return clone(cloth);
};

const deleteCloth = (clothId) => {
  const index = state.clothes.findIndex((item) => item._id === String(clothId));
  if (index === -1) return null;
  const [removed] = state.clothes.splice(index, 1);
  return clone(removed);
};

const findUserByEmail = (email) => {
  const normalizedEmail = String(email || '').toLowerCase();
  return state.users.find((user) => String(user.email).toLowerCase() === normalizedEmail) || null;
};
const getUserById = (userId) => state.users.find((user) => user._id === String(userId)) || null;

const listUsers = () => state.users
  .slice()
  .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
  .map((user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus || 'approved',
    createdAt: user.createdAt,
  }));

const countAdmins = () => state.users.filter((user) => user.role === 'admin' && (user.approvalStatus || 'approved') === 'approved').length;

const addUser = (data) => {
  const user = {
    _id: createId(),
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || 'user',
    approvalStatus: data.approvalStatus || 'pending',
    address: data.address || '',
    phone: data.phone || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.users.push(user);
  return clone(user);
};

const updateUser = (userId, fields) => {
  const user = state.users.find((item) => item._id === String(userId));
  if (!user) return null;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      user[key] = value;
    }
  }

  user.updatedAt = new Date().toISOString();
  return clone(user);
};

const deleteUserAccount = (userId) => {
  const normalizedUserId = String(userId);
  const userIndex = state.users.findIndex((item) => item._id === normalizedUserId);
  if (userIndex === -1) {
    return { ok: false, reason: 'not_found' };
  }

  const user = state.users[userIndex];
  const approvalStatus = user.approvalStatus || 'approved';
  if (user.role === 'admin' && approvalStatus === 'approved' && countAdmins() <= 1) {
    return { ok: false, reason: 'last_admin' };
  }

  state.notifications = state.notifications.filter((notification) => notification.userId !== normalizedUserId);
  state.wishlistItems = state.wishlistItems.filter((item) => item.userId !== normalizedUserId);
  state.reviews = state.reviews.filter((review) => review.userId !== normalizedUserId);

  const normalizedEmail = String(user.email || '').toLowerCase();
  state.pendingSignups = state.pendingSignups.filter((item) => item.email.toLowerCase() !== normalizedEmail);

  const [removedUser] = state.users.splice(userIndex, 1);
  return { ok: true, user: clone(removedUser) };
};

const countApprovedUsers = () => state.users.filter((user) => (user.approvalStatus || 'approved') === 'approved').length;

const createBooking = (data) => {
  const booking = {
    _id: createId(),
    userId: String(data.userId),
    clothId: String(data.clothId),
    startDate: new Date(data.startDate).toISOString(),
    endDate: new Date(data.endDate).toISOString(),
    totalPrice: Number(data.totalPrice),
    status: data.status || 'booked',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.bookings.push(booking);
  return clone(booking);
};

const getBookingById = (bookingId) => state.bookings.find((booking) => booking._id === String(bookingId)) || null;

const updateBooking = (bookingId, fields) => {
  const booking = state.bookings.find((item) => item._id === String(bookingId));
  if (!booking) return null;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      booking[key] = value;
    }
  }

  booking.updatedAt = new Date().toISOString();
  return clone(booking);
};

const findOverlappingBookings = (clothId, startDate, endDate) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  return state.bookings.filter((booking) => {
    if (booking.clothId !== String(clothId) || booking.status !== 'booked') {
      return false;
    }

    const bookingStart = normalizeDate(booking.startDate);
    const bookingEnd = normalizeDate(booking.endDate);
    return bookingStart <= end && bookingEnd >= start;
  }).map(clone);
};

const getBlockedRangesForCloth = (clothId) => state.bookings
  .filter((booking) => booking.clothId === String(clothId) && booking.status === 'booked')
  .sort((left, right) => new Date(left.startDate) - new Date(right.startDate))
  .map((booking) => ({
    startDate: booking.startDate,
    endDate: booking.endDate,
  }));

const enrichBooking = (booking, { includeCloth = false, includeUser = false } = {}) => {
  const cloth = includeCloth ? getClothById(booking.clothId) : null;
  const user = includeUser ? getUserById(booking.userId) : null;

  return {
    ...clone(booking),
    ...(includeCloth ? { clothId: cloth } : {}),
    ...(includeUser ? { userId: user ? { _id: user._id, name: user.name, email: user.email } : null } : {}),
  };
};

const listBookings = ({ userId, clothId, status, includeCloth = false, includeUser = false } = {}) => {
  return state.bookings
    .filter((booking) => (userId ? booking.userId === String(userId) : true))
    .filter((booking) => (clothId ? booking.clothId === String(clothId) : true))
    .filter((booking) => (status ? booking.status === status : true))
    .map((booking) => enrichBooking(booking, { includeCloth, includeUser }));
};

const getAllBookings = () => listBookings({ includeCloth: true, includeUser: true });

const listWishlistItems = (userId) => {
  return state.wishlistItems
    .filter((item) => item.userId === String(userId))
    .map((item) => ({
      ...clone(item),
      clothId: getClothById(item.clothId),
    }))
    .filter((item) => Boolean(item.clothId));
};

const getWishlistItem = ({ userId, clothId }) => {
  const record = state.wishlistItems.find(
    (item) => item.userId === String(userId) && item.clothId === String(clothId)
  );

  return record ? clone(record) : null;
};

const addWishlistItem = ({ userId, clothId }) => {
  const existing = getWishlistItem({ userId, clothId });
  if (existing) return existing;

  const wishlistItem = {
    _id: createId(),
    userId: String(userId),
    clothId: String(clothId),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.wishlistItems.push(wishlistItem);
  return clone(wishlistItem);
};

const removeWishlistItem = ({ userId, clothId }) => {
  const index = state.wishlistItems.findIndex(
    (item) => item.userId === String(userId) && item.clothId === String(clothId)
  );

  if (index === -1) return null;
  const [removed] = state.wishlistItems.splice(index, 1);
  return clone(removed);
};

const addReview = ({ userId, clothId, rating, comment }) => {
  const review = {
    _id: createId(),
    userId: String(userId),
    clothId: String(clothId),
    rating: Number(rating),
    comment: String(comment || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.reviews.push(review);
  return clone(review);
};

const listReviewsForCloth = (clothId) => {
  return state.reviews
    .filter((review) => review.clothId === String(clothId))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((review) => {
      const user = getUserById(review.userId);
      return {
        ...clone(review),
        userId: user ? { _id: user._id, name: user.name, email: user.email } : review.userId,
      };
    });
};

const deleteReview = ({ reviewId, userId }) => {
  const index = state.reviews.findIndex(
    (review) => review._id === String(reviewId) && review.userId === String(userId)
  );

  if (index === -1) return null;
  const [removed] = state.reviews.splice(index, 1);
  return clone(removed);
};

const upsertPendingSignup = ({ name, email, password, linkExpiresAt }) => {
  const normalizedEmail = String(email).toLowerCase();
  const existingIndex = state.pendingSignups.findIndex((item) => item.email.toLowerCase() === normalizedEmail);
  const record = {
    _id: existingIndex >= 0 ? state.pendingSignups[existingIndex]._id : createId(),
    name,
    email,
    password,
    linkExpiresAt: new Date(linkExpiresAt).toISOString(),
    updatedAt: new Date().toISOString(),
    createdAt: existingIndex >= 0 ? state.pendingSignups[existingIndex].createdAt : new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    state.pendingSignups[existingIndex] = record;
  } else {
    state.pendingSignups.push(record);
  }

  return clone(record);
};

const getPendingSignupByEmail = (email) => {
  const normalizedEmail = String(email).toLowerCase();
  const record = state.pendingSignups.find((item) => item.email.toLowerCase() === normalizedEmail);
  return record ? clone(record) : null;
};

const deletePendingSignup = (email) => {
  const normalizedEmail = String(email).toLowerCase();
  const index = state.pendingSignups.findIndex((item) => item.email.toLowerCase() === normalizedEmail);
  if (index === -1) return null;
  const [removed] = state.pendingSignups.splice(index, 1);
  return clone(removed);
};



const addNotification = ({ userId, type, title, message, metadata }) => {
  const notification = {
    _id: createId(),
    userId: String(userId),
    type: type || 'account',
    title,
    message,
    metadata: metadata || {},
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.notifications.push(notification);
  return clone(notification);
};

const listNotificationsForUser = (userId) => {
  return state.notifications
    .filter((notification) => notification.userId === String(userId))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map(clone);
};

const markNotificationAsRead = (notificationId, userId) => {
  const notification = state.notifications.find(
    (item) => item._id === String(notificationId) && item.userId === String(userId)
  );

  if (!notification) return null;
  notification.isRead = true;
  notification.updatedAt = new Date().toISOString();
  return clone(notification);
};

module.exports = {
  seedInventory,
  listClothes,
  getClothById,
  addCloth,
  updateCloth,
  deleteCloth,
  findUserByEmail,
  getUserById,
  listUsers,
  countAdmins,
  addUser,
  updateUser,
  deleteUserAccount,
  createBooking,
  getBookingById,
  updateBooking,
  findOverlappingBookings,
  getBlockedRangesForCloth,
  listBookings,
  getAllBookings,
  getUnavailableClothIdsForRange,
  listWishlistItems,
  getWishlistItem,
  addWishlistItem,
  removeWishlistItem,
  addReview,
  listReviewsForCloth,
  deleteReview,
  upsertPendingSignup,
  getPendingSignupByEmail,
  deletePendingSignup,
  addNotification,
  listNotificationsForUser,
  markNotificationAsRead,
};
