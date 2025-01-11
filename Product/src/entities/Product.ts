import mongoose, { Schema, Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface IProduct extends Document {
  uid: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  softDelete: () => void;
}

const productSchema: Schema<IProduct> = new Schema(
  {
    uid: {
      type: String,
      default: uuidv4,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.methods.softDelete = function (): void {
  this.deletedAt = new Date();
  this.updatedAt = new Date();
  this.save();
};

const Product = mongoose.model<IProduct>('Product', productSchema);

export { Product, IProduct };