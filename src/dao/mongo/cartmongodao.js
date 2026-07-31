import mongoose from "mongoose";
import CartModel from "../../models/cart.model.js";
import ProductModel from "../../models/product.model.js";

class CartMongoDAO {
  async createCart() {
    const cart = await CartModel.create({
      products: []
    });

    return cart.toObject();
  }

  async getCartById(cartId) {
    if (!mongoose.isValidObjectId(cartId)) {
      return null;
    }

    return CartModel.findById(cartId)
      .populate("products.product")
      .lean();
  }

  async addProductToCart(cartId, productId) {
    if (
      !mongoose.isValidObjectId(cartId) ||
      !mongoose.isValidObjectId(productId)
    ) {
      return null;
    }

    const cart = await CartModel.findById(cartId);

    if (!cart) {
      return null;
    }

    const productExists = await ProductModel.findById(productId);

    if (!productExists) {
      return {
        error: "PRODUCT_NOT_FOUND"
      };
    }

    const productInCart = cart.products.find(
      (item) => item.product.toString() === productId
    );

    if (productInCart) {
      productInCart.quantity += 1;
    } else {
      cart.products.push({
        product: productId,
        quantity: 1
      });
    }

    await cart.save();

    return CartModel.findById(cartId)
      .populate("products.product")
      .lean();
  }

  async updateProductQuantity(cartId, productId, quantity) {
    if (
      !mongoose.isValidObjectId(cartId) ||
      !mongoose.isValidObjectId(productId)
    ) {
      return null;
    }

    const cart = await CartModel.findById(cartId);

    if (!cart) {
      return null;
    }

    const productInCart = cart.products.find(
      (item) => item.product.toString() === productId
    );

    if (!productInCart) {
      return {
        error: "PRODUCT_NOT_IN_CART"
      };
    }

    productInCart.quantity = quantity;

    await cart.save();

    return CartModel.findById(cartId)
      .populate("products.product")
      .lean();
  }

  async updateCartProducts(cartId, products) {
    if (!mongoose.isValidObjectId(cartId)) {
      return null;
    }

    return CartModel.findByIdAndUpdate(
      cartId,
      { products },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("products.product")
      .lean();
  }

  async deleteProductFromCart(cartId, productId) {
    if (
      !mongoose.isValidObjectId(cartId) ||
      !mongoose.isValidObjectId(productId)
    ) {
      return null;
    }

    const cart = await CartModel.findByIdAndUpdate(
      cartId,
      {
        $pull: {
          products: {
            product: productId
          }
        }
      },
      {
        new: true
      }
    )
      .populate("products.product")
      .lean();

    return cart;
  }

  async clearCart(cartId) {
    if (!mongoose.isValidObjectId(cartId)) {
      return null;
    }

    return CartModel.findByIdAndUpdate(
      cartId,
      {
        products: []
      },
      {
        new: true
      }
    ).lean();
  }
}

export default new CartMongoDAO();