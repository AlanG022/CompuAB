import { Router } from "express";

import ProductMongoDAO from "../dao/mongo/ProductMongoDAO.js";
import CartMongoDAO from "../dao/mongo/CartMongoDAO.js";

const viewsRouter = Router();

// Redirige la raíz a la tienda
viewsRouter.get("/", (req, res) => {
  res.redirect("/products");
});

// Vista de productos
viewsRouter.get("/products", async (req, res, next) => {
  try {
    const { limit = 10, page = 1, query, sort } = req.query;

    const result = await ProductMongoDAO.getProducts({
      limit,
      page,
      query,
      sort
    });

    res.render("products", {
      title: "Productos | CompuAB",
      products: result.products,
      page: result.page,
      totalPages: result.totalPages,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      query: query || "",
      sort: sort || ""
    });
  } catch (error) {
    next(error);
  }
});

// Vista de productos en tiempo real
viewsRouter.get("/realtimeproducts", async (req, res, next) => {
  try {
    const result = await ProductMongoDAO.getProducts({
      limit: 100,
      page: 1
    });

    res.render("realTimeProducts", {
      title: "Productos en tiempo real | CompuAB",
      products: result.products
    });
  } catch (error) {
    next(error);
  }
});

// Detalle de un producto
viewsRouter.get("/products/:pid", async (req, res, next) => {
  try {
    const product = await ProductMongoDAO.getProductById(req.params.pid);

    if (!product) {
      return res.status(404).render("error", {
        title: "Producto no encontrado",
        message: "El producto solicitado no existe"
      });
    }

    res.render("productDetail", {
      title: `${product.title} | CompuAB`,
      product
    });
  } catch (error) {
    next(error);
  }
});

// Vista de un carrito
viewsRouter.get("/carts/:cid", async (req, res, next) => {
  try {
    const cart = await CartMongoDAO.getCartById(req.params.cid);

    if (!cart) {
      return res.status(404).render("error", {
        title: "Carrito no encontrado",
        message: "El carrito solicitado no existe"
      });
    }

    const total = cart.products.reduce((accumulator, item) => {
      if (!item.product) {
        return accumulator;
      }

      return accumulator + item.product.price * item.quantity;
    }, 0);

    res.render("cart", {
      title: "Mi carrito | CompuAB",
      cart,
      total
    });
  } catch (error) {
    next(error);
  }
});

export default viewsRouter;