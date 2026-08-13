import mongoose, { Schema, type Document } from 'mongoose';

export interface IOrder extends Document {
  user?: mongoose.Types.ObjectId;
  customerDetails: {
    name: string;
    phone: string;
    guests: number;
  };
  orderStatus: string;
  orderDate: Date;
  bills: {
    total: number;
    tax: number;
    totalWithTax: number;
  };
  items: Array<Record<string, unknown>>;
  table: mongoose.Types.ObjectId;
  paymentMethod?: string;
  paymentData?: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
  };
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    customerDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      guests: { type: Number, required: true },
    },
    orderStatus: { type: String, required: true },
    orderDate: { type: Date, default: Date.now },
    bills: {
      total: { type: Number, required: true },
      tax: { type: Number, required: true },
      totalWithTax: { type: Number, required: true },
    },
    items: [{ type: Schema.Types.Mixed }],
    table: { type: Schema.Types.ObjectId, ref: 'Table' },
    paymentMethod: { type: String },
    paymentData: {
      razorpay_order_id: { type: String },
      razorpay_payment_id: { type: String },
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
