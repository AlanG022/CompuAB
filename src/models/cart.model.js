import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "El producto es obligatorio"]
    },

    quantity: {
      type: Number,
      required: [true, "La cantidad es obligatoria"],
      default: 1,
      min: [1, "La cantidad debe ser como mínimo 1"],
      validate: {
        validator: Number.isInteger,
        message: "La cantidad debe ser un número entero"
      }
    }
  },
  {
    _id: false
  }
);

const cartSchema = new mongoose.Schema(
  {
    products: {
      type: [cartProductSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "carts"
  }
);

const CartModel = mongoose.model("Cart", cartSchema);

export default CartModel;