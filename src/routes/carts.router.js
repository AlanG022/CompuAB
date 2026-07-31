import { Router } from "express";

import {
  createCart,
  getCartById,
  addProductToCart,
  updateProductQuantity,
  updateCartProducts,
  deleteProductFromCart,
  clearCart
} from "../controllers/carts.controller.js";

const cartsRouter = Router();

cartsRouter.post("/", createCart);
cartsRouter.get("/:cid", getCartById);
cartsRouter.post("/:cid/products/:pid", addProductToCart);
cartsRouter.put("/:cid/products/:pid", updateProductQuantity);
cartsRouter.put("/:cid", updateCartProducts);
cartsRouter.delete("/:cid/products/:pid", deleteProductFromCart);
cartsRouter.delete("/:cid", clearCart);

export default cartsRouter;