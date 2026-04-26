require('dotenv').config();
const mongoose = require('mongoose');
const Cloth = require('../models/Cloth');

const womenOutfits = [
  { title: 'Banarasi Bridal Lehenga', description: 'Women bridal lehenga in rich Banarasi weave with zardozi finish.', category: 'wedding', size: 'S,M,L', pricePerDay: 4499, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?lehenga,indian,woman' },
  { title: 'Ivory Temple Saree', description: 'Women silk saree with temple border for wedding rituals.', category: 'wedding', size: 'Free', pricePerDay: 3199, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?saree,indian,woman' },
  { title: 'Royal Anarkali Set', description: 'Women floor-length anarkali with embroidered yoke.', category: 'wedding', size: 'M,L,XL', pricePerDay: 2799, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?anarkali,indian,woman' },
  { title: 'Rani Pink Sharara', description: 'Women festive sharara set with mirror and gota accents.', category: 'party', size: 'S,M,L', pricePerDay: 2499, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?sharara,indian,woman' },
  { title: 'Mehendi Green Gharara', description: 'Women gharara with short kurti and dupatta for celebrations.', category: 'party', size: 'M,L', pricePerDay: 2299, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?gharara,indian,fashion' },
  { title: 'Indo-Western Cape Gown', description: 'Women indo-western drape gown for reception evenings.', category: 'party', size: 'S,M', pricePerDay: 2899, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?indo-western,gown,woman' },
  { title: 'Pastel Chikankari Kurta Set', description: 'Women chikankari kurta set for daytime family events.', category: 'casual', size: 'S,M,L,XL', pricePerDay: 1599, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?chikankari,kurta,woman' },
  { title: 'Printed Cotton Co-ord', description: 'Women breathable cotton co-ord for casual outings.', category: 'casual', size: 'S,M,L', pricePerDay: 1299, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?indian,coord,woman' },
  { title: 'Mirror Work Navratri Lehenga', description: 'Women mirror-work lehenga ideal for Navratri and garba nights.', category: 'party', size: 'S,M,L', pricePerDay: 2699, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?navratri,lehenga,woman' },
  { title: 'Kanchipuram Silk Saree', description: 'Women Kanchipuram silk saree with contrast pallu.', category: 'wedding', size: 'Free', pricePerDay: 3599, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?silk,saree,indian' },
  { title: 'Haldi Yellow Leheriya Set', description: 'Women leheriya lehenga set for haldi and pre-wedding functions.', category: 'wedding', size: 'S,M,L', pricePerDay: 2199, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?haldi,lehenga,woman' },
  { title: 'Sequin Cocktail Saree', description: 'Women sequin saree for receptions and cocktail events.', category: 'party', size: 'Free', pricePerDay: 3099, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?cocktail,saree,woman' },
  { title: 'Floral Organza Saree', description: 'Women floral organza drape for elegant evening styling.', category: 'party', size: 'Free', pricePerDay: 1999, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?organza,saree,woman' },
  { title: 'Velvet Bridal Lehenga', description: 'Women velvet lehenga for winter wedding functions.', category: 'wedding', size: 'M,L', pricePerDay: 4299, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?velvet,lehenga,bridal' },
  { title: 'Peplum Dhoti Set', description: 'Women peplum top with dhoti pants for modern festive looks.', category: 'party', size: 'S,M,L', pricePerDay: 1899, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?dhoti,set,woman' },
  { title: 'Classic Salwar Suit Set', description: 'Women classic salwar suit with dupatta for traditional events.', category: 'casual', size: 'M,L,XL', pricePerDay: 1499, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?salwar,suit,woman' },
  { title: 'Handloom Linen Saree', description: 'Women handloom linen saree with minimalist styling.', category: 'casual', size: 'Free', pricePerDay: 1699, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?linen,saree,indian' },
  { title: 'Festive Patiala Suit', description: 'Women Patiala suit in vibrant festive colors.', category: 'party', size: 'S,M,L', pricePerDay: 1799, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?patiala,suit,woman' },
  { title: 'Banarasi Tissue Saree', description: 'Women Banarasi tissue saree with lightweight shimmer.', category: 'wedding', size: 'Free', pricePerDay: 3399, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?banarasi,saree,wedding' },
  { title: 'Bridesmaid Lehenga Set', description: 'Women coordinated lehenga set for bridesmaid functions.', category: 'wedding', size: 'S,M,L', pricePerDay: 2599, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?bridesmaid,lehenga,indian' },
];

const menOutfits = [
  { title: 'Royal Embroidered Sherwani', description: 'Men embroidered sherwani for wedding ceremonies.', category: 'wedding', size: 'M,L,XL', pricePerDay: 3899, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?sherwani,indian,man' },
  { title: 'Ivory Wedding Sherwani', description: 'Men ivory sherwani with stole for reception entry.', category: 'wedding', size: 'L,XL', pricePerDay: 3599, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?wedding,sherwani,men' },
  { title: 'Classic Kurta Pajama Set', description: 'Men kurta pajama for puja and daytime ceremonies.', category: 'casual', size: 'M,L,XL,XXL', pricePerDay: 1499, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?kurta,pajama,men' },
  { title: 'Nehru Jacket Kurta Combo', description: 'Men kurta with Nehru jacket for festive functions.', category: 'party', size: 'M,L,XL', pricePerDay: 1899, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?nehru,jacket,men' },
  { title: 'Bandhgala Jodhpuri Suit', description: 'Men bandhgala suit for formal receptions.', category: 'party', size: 'L,XL', pricePerDay: 2799, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?bandhgala,jodhpuri,suit' },
  { title: 'Silk Pathani Set', description: 'Men Pathani set for festive and evening wear.', category: 'party', size: 'M,L,XL', pricePerDay: 1999, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?pathani,kurta,men' },
  { title: 'Printed Short Kurta Set', description: 'Men short kurta style for casual gatherings.', category: 'casual', size: 'M,L,XL', pricePerDay: 1199, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?short,kurta,men' },
  { title: 'Linen Kurta Trouser Set', description: 'Men linen kurta set for summer events.', category: 'casual', size: 'M,L,XL,XXL', pricePerDay: 1399, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?linen,kurta,man' },
  { title: 'Wedding Indo-Western Set', description: 'Men indo-western attire with layered jacket styling.', category: 'wedding', size: 'L,XL', pricePerDay: 2999, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?indo-western,men,wedding' },
  { title: 'Black Velvet Bandhgala', description: 'Men velvet bandhgala for cocktail and sangeet nights.', category: 'party', size: 'M,L', pricePerDay: 2599, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?velvet,bandhgala,men' },
  { title: 'Pastel Kurta with Dupatta', description: 'Men pastel kurta with draped dupatta for haldi.', category: 'wedding', size: 'M,L,XL', pricePerDay: 1799, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?haldi,kurta,men' },
  { title: 'Designer Achkan Set', description: 'Men designer achkan with tapered trouser fit.', category: 'wedding', size: 'L,XL', pricePerDay: 3299, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?achkan,indian,men' },
  { title: 'Festive Mirror Kurta Jacket', description: 'Men festive kurta jacket with mirror details.', category: 'party', size: 'M,L,XL', pricePerDay: 2099, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?kurta,jacket,men,festive' },
  { title: 'Cotton Everyday Kurta', description: 'Men cotton kurta for regular wear and functions.', category: 'casual', size: 'M,L,XL,XXL', pricePerDay: 999, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?cotton,kurta,men' },
  { title: 'Maroon Reception Sherwani', description: 'Men maroon sherwani tailored for receptions.', category: 'wedding', size: 'L,XL', pricePerDay: 3699, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?maroon,sherwani,men' },
  { title: 'Navy Jodhpuri Set', description: 'Men navy Jodhpuri set with structured silhouette.', category: 'party', size: 'M,L', pricePerDay: 2699, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?navy,jodhpuri,men' },
  { title: 'Beige Silk Kurta Set', description: 'Men beige silk kurta for engagement and roka.', category: 'wedding', size: 'M,L,XL', pricePerDay: 1899, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?silk,kurta,men' },
  { title: 'Olive Casual Kurta', description: 'Men olive kurta for smart casual traditional look.', category: 'casual', size: 'M,L,XL', pricePerDay: 1099, availability: true, imageUrl: 'https://source.unsplash.com/1600x1000/?olive,kurta,men' },
];

const inferGenderFromTitle = (title) => {
  const value = String(title || '').toLowerCase();
  const womenTokens = ['saree', 'lehenga', 'anarkali', 'gown', 'dress', 'sharara', 'gharara', 'salwar', 'jumpsuit'];
  const menTokens = ['sherwani', 'kurta', 'tuxedo', 'bandhgala', 'achkan', 'jodhpuri', 'pathani'];
  if (womenTokens.some((token) => value.includes(token))) return 'women';
  if (menTokens.some((token) => value.includes(token))) return 'men';
  return 'unisex';
};

const additionalOutfits = [
  ...womenOutfits.map((item) => ({ ...item, gender: 'women', occasion: item.category })),
  ...menOutfits.map((item) => ({ ...item, gender: 'men', occasion: item.category })),
];

const normalizeTitle = (title) => String(title || '').trim().toLowerCase();

const removeDuplicateTitles = async () => {
  const docs = await Cloth.find({}, { _id: 1, title: 1, createdAt: 1 }).sort({ createdAt: 1, _id: 1 }).lean();
  const seen = new Map();
  const duplicateIds = [];

  for (const doc of docs) {
    const key = normalizeTitle(doc.title);
    if (!key) continue;

    if (seen.has(key)) {
      duplicateIds.push(doc._id);
    } else {
      seen.set(key, doc._id);
    }
  }

  if (duplicateIds.length === 0) {
    return 0;
  }

  const result = await Cloth.deleteMany({ _id: { $in: duplicateIds } });
  return result.deletedCount || 0;
};

const backfillGenderAndOccasion = async () => {
  const docs = await Cloth.find({}, { _id: 1, title: 1, category: 1, occasion: 1, gender: 1 }).lean();
  let updatedCount = 0;

  for (const doc of docs) {
    const nextOccasion = doc.occasion || doc.category || 'casual';
    const nextGender = doc.gender || inferGenderFromTitle(doc.title);
    if (doc.occasion === nextOccasion && doc.gender === nextGender) {
      continue;
    }

    await Cloth.updateOne(
      { _id: doc._id },
      { $set: { occasion: nextOccasion, gender: nextGender } }
    );
    updatedCount += 1;
  }

  return updatedCount;
};

(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set. Cannot seed MongoDB outfits.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const deletedDuplicates = await removeDuplicateTitles();
  const backfilled = await backfillGenderAndOccasion();

  let inserted = 0;
  let updated = 0;

  for (const outfit of additionalOutfits) {
    const result = await Cloth.updateOne(
      { title: outfit.title },
      { $set: outfit },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      inserted += 1;
    } else if (result.modifiedCount > 0) {
      updated += 1;
    }
  }

  const total = await Cloth.countDocuments();
  console.log(JSON.stringify({
    womenOutfits: womenOutfits.length,
    menOutfits: menOutfits.length,
    inserted,
    updated,
    deletedDuplicates,
    backfilled,
    total,
    currency: 'INR',
  }, null, 2));

  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
