import mongoose, { Schema, type Document } from 'mongoose';

export interface IMenuCategory extends Document {
  name: string;
  slug: string;
  icon: string;
  bgColor: string;
  image: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface IFoodItem extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  menuCategory: mongoose.Types.ObjectId;
  category?: string;
  image?: string;
  images: string[];
  rating: number;
  reviews: number;
  cookingTime?: string;
  spiceLevel: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  ingredients: string[];
  preparationNotes?: string;
  isAvailable: boolean;
  isChefRecommendation: boolean;
  isActive: boolean;
}

const menuCategorySchema = new Schema<IMenuCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true },
    icon: { type: String, default: '' },
    bgColor: { type: String, default: '#b1454a' },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

menuCategorySchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

const foodItemSchema = new Schema<IFoodItem>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String },
    price: { type: Number, required: true },
    menuCategory: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    category: { type: String },
    image: { type: String },
    images: [{ type: String }],
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    cookingTime: { type: String },
    spiceLevel: { type: Number, default: 1, min: 0, max: 5 },
    calories: { type: Number },
    protein: { type: Number },
    fat: { type: Number },
    carbs: { type: Number },
    ingredients: [{ type: String }],
    preparationNotes: { type: String },
    isAvailable: { type: Boolean, default: true },
    isChefRecommendation: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

foodItemSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

foodItemSchema.index({ menuCategory: 1, isActive: 1 });
foodItemSchema.index({ name: 'text', description: 'text' });

export const MenuCategory = mongoose.model<IMenuCategory>('MenuCategory', menuCategorySchema);
export const FoodItem = mongoose.model<IFoodItem>('FoodItem', foodItemSchema);
