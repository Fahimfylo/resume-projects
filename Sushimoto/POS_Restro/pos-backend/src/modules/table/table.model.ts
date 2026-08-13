import mongoose, { Schema, type Document } from 'mongoose';

export interface ITable extends Document {
  tableNo: number;
  status: string;
  seats: number;
  currentOrder?: mongoose.Types.ObjectId;
}

const tableSchema = new Schema<ITable>({
  tableNo: { type: Number, required: true, unique: true },
  status: { type: String, default: 'Available' },
  seats: { type: Number, required: true },
  currentOrder: { type: Schema.Types.ObjectId, ref: 'Order' },
});

export const Table = mongoose.model<ITable>('Table', tableSchema);
