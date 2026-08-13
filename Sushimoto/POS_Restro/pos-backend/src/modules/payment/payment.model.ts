import mongoose, { Schema, type Document } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  email: string;
  contact: string;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  paymentId: { type: String },
  orderId: { type: String },
  amount: { type: Number },
  currency: { type: String },
  status: { type: String },
  method: { type: String },
  email: { type: String },
  contact: { type: String },
  createdAt: { type: Date },
});

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
