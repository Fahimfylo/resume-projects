import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
