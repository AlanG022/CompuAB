import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
      minlength: [2, "El título debe tener al menos 2 caracteres"],
      maxlength: [120, "El título no puede superar los 120 caracteres"]
    },

    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
      minlength: [5, "La descripción debe tener al menos 5 caracteres"],
      maxlength: [1000, "La descripción no puede superar los 1000 caracteres"]
    },

    code: {
      type: String,
      required: [true, "El código es obligatorio"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, "El código debe tener al menos 2 caracteres"]
    },

    price: {
      type: Number,
      required: [true, "El precio es obligatorio"],
      min: [0, "El precio no puede ser negativo"]
    },

    status: {
      type: Boolean,
      default: true
    },

    stock: {
      type: Number,
      required: [true, "El stock es obligatorio"],
      min: [0, "El stock no puede ser negativo"],
      validate: {
        validator: Number.isInteger,
        message: "El stock debe ser un número entero"
      }
    },

    category: {
      type: String,
      required: [true, "La categoría es obligatoria"],
      trim: true,
      lowercase: true
    },

    thumbnails: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "products"
  }
);

productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });

const ProductModel = mongoose.model("Product", productSchema);

export default ProductModel;
ref: "Product"