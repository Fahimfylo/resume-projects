import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { logger } from '../src/config/logger';
import { User } from '../src/modules/user/user.model';
import { Roles } from '../src/modules/user/user.constants';
import { MenuCategory, FoodItem } from '../src/modules/menu/menu.model';

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB');

  // ---- Users ----
  const existingAdmin = await User.findOne({ email: 'superadmin@gmail.com' });
  if (!existingAdmin) {
    await User.create({
      name: 'Sushimoto Super Admin',
      email: 'superadmin@gmail.com',
      password: 'Fahim007#',
      phone: '0000000000',
      role: Roles.SUPERADMIN,
      emailVerified: true,
      isActive: true,
    });
    logger.info('Superadmin created: superadmin@gmail.com / Fahim007#');
  } else {
    logger.info('Superadmin already exists, updating password and role...');
    existingAdmin.password = 'Fahim007#';
    existingAdmin.role = Roles.SUPERADMIN;
    existingAdmin.isActive = true;
    existingAdmin.emailVerified = true;
    await existingAdmin.save();
    logger.info('Superadmin updated: superadmin@gmail.com / Fahim007#');
  }

  // ---- Menu Categories & Items ----
  const existingCategories = await MenuCategory.countDocuments();
  if (existingCategories > 0) {
    await MenuCategory.deleteMany({});
    await FoodItem.deleteMany({});
    logger.info('Cleared existing menu data');
  }

  const categories = [
    {
      name: 'Signature Specials', icon: '\u{1F372}', bgColor: '#b1454a', image: '/assets/sushi-1.png', description: "Chef's exclusive creations", sortOrder: 1,
      items: [
        { name: 'Dragon Roll Supreme', price: 450, category: 'Signature' },
        { name: 'Volcano Roll', price: 480, category: 'Signature' },
        { name: 'Sashimi Platter Deluxe', price: 650, category: 'Signature' },
        { name: 'Chef\'s Omakase', price: 999, category: 'Signature' },
      ],
    },
    {
      name: 'Sushi', icon: '\u{1F363}', bgColor: '#e85d3a', image: '/assets/sushi-9.png', description: 'Traditional and modern sushi rolls', sortOrder: 2,
      items: [
        { name: 'California Roll', price: 320, category: 'Roll' },
        { name: 'Spicy Tuna Roll', price: 350, category: 'Roll' },
        { name: 'Salmon Nigiri', price: 280, category: 'Nigiri' },
        { name: 'Shrimp Tempura Roll', price: 380, category: 'Roll' },
        { name: 'Rainbow Roll', price: 420, category: 'Roll' },
        { name: 'Ebi Nigiri', price: 260, category: 'Nigiri' },
      ],
    },
    {
      name: 'Sashimi', icon: '\u{1F96F}', bgColor: '#d4443b', image: '/assets/sushi-2.png', description: 'Fresh sliced raw fish', sortOrder: 3,
      items: [
        { name: 'Salmon Sashimi', price: 380, category: 'Non-Vegetarian' },
        { name: 'Tuna Sashimi', price: 420, category: 'Non-Vegetarian' },
        { name: 'Yellowtail Sashimi', price: 450, category: 'Non-Vegetarian' },
        { name: 'Octopus Sashimi', price: 400, category: 'Non-Vegetarian' },
      ],
    },
    {
      name: 'Ramen', icon: '\u{1F35C}', bgColor: '#c94a38', image: '/assets/sushi-8.png', description: 'Rich and flavorful noodle soups', sortOrder: 4,
      items: [
        { name: 'Tonkotsu Ramen', price: 350, category: 'Non-Vegetarian' },
        { name: 'Miso Ramen', price: 320, category: 'Vegetarian' },
        { name: 'Shoyu Ramen', price: 300, category: 'Non-Vegetarian' },
        { name: 'Spicy Tantanmen', price: 370, category: 'Non-Vegetarian' },
        { name: 'Vegetable Ramen', price: 280, category: 'Vegetarian' },
      ],
    },
    {
      name: 'Udon & Soba', icon: '\u{1F35C}', bgColor: '#a85535', image: '/assets/sushi-7.png', description: 'Thick wheat and buckwheat noodle dishes', sortOrder: 5,
      items: [
        { name: 'Tempura Udon', price: 300, category: 'Vegetarian' },
        { name: 'Kitsune Udon', price: 280, category: 'Vegetarian' },
        { name: 'Zaru Soba', price: 260, category: 'Vegetarian' },
        { name: 'Nabeyaki Udon', price: 350, category: 'Non-Vegetarian' },
      ],
    },
    {
      name: 'Rice Bowls (Donburi)', icon: '\u{1F35A}', bgColor: '#8b6b45', image: '/assets/sushi-3.png', description: 'Hearty rice bowl specialties', sortOrder: 6,
      items: [
        { name: 'Chicken Katsu Don', price: 350, category: 'Non-Vegetarian' },
        { name: 'Gyudon (Beef Bowl)', price: 400, category: 'Non-Vegetarian' },
        { name: 'Oyakodon', price: 320, category: 'Non-Vegetarian' },
        { name: 'Teriyaki Salmon Don', price: 420, category: 'Non-Vegetarian' },
      ],
    },
    {
      name: 'Bento Boxes', icon: '\u{1F96A}', bgColor: '#6b5b45', image: '/assets/sushi-5.png', description: 'Complete Japanese meal sets', sortOrder: 7,
      items: [
        { name: 'Sushi Bento', price: 550, category: 'Non-Vegetarian' },
        { name: 'Teriyaki Bento', price: 480, category: 'Non-Vegetarian' },
        { name: 'Vegetable Bento', price: 400, category: 'Vegetarian' },
      ],
    },
    {
      name: 'Main Course', icon: '\u{1F356}', bgColor: '#5a4a3a', image: '/assets/sushi-4.png', description: 'Premium entrée selections', sortOrder: 8,
      items: [
        { name: 'Teriyaki Chicken', price: 420, category: 'Non-Vegetarian' },
        { name: 'Salmon Teriyaki', price: 480, category: 'Non-Vegetarian' },
        { name: 'Chicken Katsu', price: 380, category: 'Non-Vegetarian' },
        { name: 'Tofu Steak', price: 320, category: 'Vegetarian' },
      ],
    },
    {
      name: 'Teppanyaki', icon: '\u{1F525}', bgColor: '#c4563a', image: '/assets/sushi-6.png', description: 'Iron griddle grilled specialties', sortOrder: 9,
      items: [
        { name: 'Teppanyaki Chicken', price: 450, category: 'Non-Vegetarian' },
        { name: 'Teppanyaki Beef', price: 650, category: 'Non-Vegetarian' },
        { name: 'Teppanyaki Prawns', price: 550, category: 'Non-Vegetarian' },
      ],
    },
    {
      name: 'Grilled & Yakitori', icon: '\u{1F356}', bgColor: '#a84535', image: '/assets/sushi-10.png', description: 'Charcoal grilled skewers and more', sortOrder: 10,
      items: [
        { name: 'Chicken Yakitori (3pc)', price: 220, category: 'Non-Vegetarian' },
        { name: 'Pork Belly Yakitori', price: 250, category: 'Non-Vegetarian' },
        { name: 'Grilled Mackerel', price: 380, category: 'Non-Vegetarian' },
        { name: 'Vegetable Yakitori', price: 180, category: 'Vegetarian' },
      ],
    },
    {
      name: 'Tempura', icon: '\u{1F9C6}', bgColor: '#d4a44a', image: '/assets/sushi-11.png', description: 'Lightly battered and fried delicacies', sortOrder: 11,
      items: [
        { name: 'Shrimp Tempura (5pc)', price: 350, category: 'Non-Vegetarian' },
        { name: 'Vegetable Tempura', price: 280, category: 'Vegetarian' },
        { name: 'Sweet Potato Tempura', price: 250, category: 'Vegetarian' },
      ],
    },
    {
      name: 'Appetizers', icon: '\u{1F958}', bgColor: '#6b8b4a', image: '/assets/sushi-3.png', description: 'Start your meal right', sortOrder: 12,
      items: [
        { name: 'Edamame', price: 120, category: 'Vegetarian' },
        { name: 'Gyoza (6pc)', price: 220, category: 'Non-Vegetarian' },
        { name: 'Miso Soup', price: 100, category: 'Vegetarian' },
        { name: 'Spring Rolls (4pc)', price: 180, category: 'Vegetarian' },
        { name: 'Chicken Karaage', price: 280, category: 'Non-Vegetarian' },
      ],
    },
    {
      name: 'Salads', icon: '\u{1F957}', bgColor: '#5a9b4a', image: '/assets/sushi-2.png', description: 'Fresh and crisp Japanese salads', sortOrder: 13,
      items: [
        { name: 'Seaweed Salad', price: 180, category: 'Vegetarian' },
        { name: 'Garden Salad', price: 160, category: 'Vegetarian' },
        { name: 'Sunomono', price: 200, category: 'Vegetarian' },
      ],
    },
    {
      name: 'Hot Pot (Nabe)', icon: '\u{1F372}', bgColor: '#c45635', image: '/assets/sushi-8.png', description: 'Warming communal pot dishes', sortOrder: 14,
      items: [
        { name: 'Chanko Nabe', price: 550, category: 'Non-Vegetarian' },
        { name: 'Yosenabe', price: 500, category: 'Non-Vegetarian' },
        { name: 'Tofu Nabe', price: 400, category: 'Vegetarian' },
      ],
    },
    {
      name: 'Seafood', icon: '\u{1F99E}', bgColor: '#3a7b9b', image: '/assets/sushi-9.png', description: 'Ocean-fresh catches', sortOrder: 15,
      items: [
        { name: 'Grilled Salmon', price: 480, category: 'Non-Vegetarian' },
        { name: 'Garlic Butter Prawns', price: 520, category: 'Non-Vegetarian' },
        { name: 'Steamed Clams', price: 380, category: 'Non-Vegetarian' },
      ],
    },
    {
      name: 'Seafood Boil', icon: '\u{1F990}', bgColor: '#2a6b8b', image: '/assets/sushi-10.png', description: 'Flavorful shellfish boils', sortOrder: 16,
      items: [
        { name: 'Classic Seafood Boil', price: 850, category: 'Non-Vegetarian' },
        { name: 'Spicy Garlic Boil', price: 900, category: 'Non-Vegetarian' },
      ],
    },
    {
      name: 'Japanese Curry', icon: '\u{1F35B}', bgColor: '#c49a3a', image: '/assets/sushi-11.png', description: 'Rich and comforting curry dishes', sortOrder: 17,
      items: [
        { name: 'Chicken Katsu Curry', price: 380, category: 'Non-Vegetarian' },
        { name: 'Vegetable Curry', price: 300, category: 'Vegetarian' },
        { name: 'Pork Curry', price: 350, category: 'Non-Vegetarian' },
      ],
    },
    {
      name: 'Breakfast', icon: '\u{1F373}', bgColor: '#e8a44a', image: '/assets/sushi-2.png', description: 'Morning Japanese classics', sortOrder: 18,
      items: [
        { name: 'Tamago Sando', price: 200, category: 'Vegetarian' },
        { name: 'Japanese Pancake', price: 250, category: 'Vegetarian' },
        { name: 'Grilled Fish Set', price: 350, category: 'Non-Vegetarian' },
      ],
    },
    {
      name: 'Dango & Sweets', icon: '\u{1F361}', bgColor: '#d47ab4', image: '/assets/sushi-6.png', description: 'Sweet and savory dumplings', sortOrder: 19,
      items: [
        { name: 'Mitarashi Dango (3pc)', price: 120, category: 'Vegetarian' },
        { name: 'Red Bean Dango', price: 130, category: 'Vegetarian' },
        { name: 'Matcha Dango', price: 140, category: 'Vegetarian' },
      ],
    },
    {
      name: 'Desserts', icon: '\u{1F370}', bgColor: '#c46a9a', image: '/assets/sushi-12.png', description: 'Sweet Japanese treats', sortOrder: 20,
      items: [
        { name: 'Mochi Ice Cream (3pc)', price: 200, category: 'Vegetarian' },
        { name: 'Matcha Cheesecake', price: 280, category: 'Vegetarian' },
        { name: 'Black Sesame Pudding', price: 220, category: 'Vegetarian' },
        { name: 'Green Tea Ice Cream', price: 150, category: 'Vegetarian' },
      ],
    },
    {
      name: 'Drinks', icon: '\u{1F379}', bgColor: '#4a9bb5', image: '/assets/sushi-4.png', description: 'Refreshing beverages', sortOrder: 21,
      items: [
        { name: 'Green Tea', price: 100, category: 'Hot' },
        { name: 'Sake', price: 350, category: 'Alcoholic' },
        { name: 'Japanese Beer', price: 250, category: 'Alcoholic' },
        { name: 'Ramune Soda', price: 120, category: 'Cold' },
        { name: 'Matcha Latte', price: 180, category: 'Cold' },
      ],
    },
  ];

  for (const cat of categories) {
    const created = await MenuCategory.create({
      name: cat.name,
      icon: cat.icon,
      bgColor: cat.bgColor,
      image: cat.image,
      description: cat.description,
      sortOrder: cat.sortOrder,
    });
    const items = cat.items.map((item) => ({
      name: item.name,
      slug: item.name.toLowerCase().replace(/\s+/g, '-'),
      price: item.price,
      category: item.category,
      menuCategory: created._id,
      isAvailable: true,
    }));
    await FoodItem.insertMany(items);
    logger.info(`Seeded category: ${cat.name} (${items.length} items)`);
  }

  logger.info('Menu seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
