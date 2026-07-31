import CartMongoDAO from "../dao/mongo/CartMongoDAO.js";

export const createCart = async (req, res, next) => {
  try {
    const cart = await CartMongoDAO.createCart();

    return res.status(201).json({
      status: "success",
      message: "Carrito creado correctamente",
      payload: cart
    });
  } catch (error) {
    next(error);
  }
};

export const getCartById = async (req, res, next) => {
  try {
    const { cid } = req.params;

    const cart = await CartMongoDAO.getCartById(cid);

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });
    }

    return res.status(200).json({
      status: "success",
      payload: cart
    });
  } catch (error) {
    next(error);
  }
};

export const addProductToCart = async (req, res, next) => {
  try {
    const { cid, pid } = req.params;

    const cart = await CartMongoDAO.addProductToCart(cid, pid);

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado o ID inválido"
      });
    }

    if (cart.error === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        status: "error",
        message: "Producto no encontrado"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Producto agregado al carrito",
      payload: cart
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductQuantity = async (req, res, next) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      return res.status(400).json({
        status: "error",
        message: "La cantidad debe ser un número entero mayor a 0"
      });
    }

    const cart = await CartMongoDAO.updateProductQuantity(
      cid,
      pid,
      parsedQuantity
    );

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado o ID inválido"
      });
    }

    if (cart.error === "PRODUCT_NOT_IN_CART") {
      return res.status(404).json({
        status: "error",
        message: "El producto no está dentro del carrito"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Cantidad actualizada correctamente",
      payload: cart
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartProducts = async (req, res, next) => {
  try {
    const { cid } = req.params;
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({
        status: "error",
        message: "products debe ser un arreglo"
      });
    }

    const invalidProduct = products.some(
      (item) =>
        !item.product ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
    );

    if (invalidProduct) {
      return res.status(400).json({
        status: "error",
        message: "Cada producto debe tener product y quantity mayor a 0"
      });
    }

    const normalizedProducts = products.map((item) => ({
      product: item.product,
      quantity: Number(item.quantity)
    }));

    const cart = await CartMongoDAO.updateCartProducts(
      cid,
      normalizedProducts
    );

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Carrito actualizado correctamente",
      payload: cart
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductFromCart = async (req, res, next) => {
  try {
    const { cid, pid } = req.params;

    const cart = await CartMongoDAO.deleteProductFromCart(
      cid,
      pid
    );

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Producto eliminado del carrito",
      payload: cart
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const { cid } = req.params;

    const cart = await CartMongoDAO.clearCart(cid);

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "Carrito no encontrado"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Carrito vaciado correctamente",
      payload: cart
    });
  } catch (error) {
    next(error);
  }
};