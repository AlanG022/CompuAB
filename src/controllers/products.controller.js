import ProductMongoDAO from "../dao/mongo/ProductMongoDAO.js";

const buildPaginationLink = ({
  req,
  targetPage,
  limit,
  query,
  sort
}) => {
  if (!targetPage) {
    return null;
  }

  const params = new URLSearchParams();

  params.set("limit", limit);
  params.set("page", targetPage);

  if (query) {
    params.set("query", query);
  }

  if (sort === "asc" || sort === "desc") {
    params.set("sort", sort);
  }

  return `${req.protocol}://${req.get("host")}${req.baseUrl}?${params.toString()}`;
};

export const getProducts = async (req, res, next) => {
  try {
    const { limit = 10, page = 1, query, sort } = req.query;

    if (sort && !["asc", "desc"].includes(sort)) {
      return res.status(400).json({
        status: "error",
        message: "El parámetro sort debe ser asc o desc"
      });
    }

    const result = await ProductMongoDAO.getProducts({
      limit,
      page,
      query,
      sort
    });

    const prevLink = buildPaginationLink({
      req,
      targetPage: result.prevPage,
      limit: result.limit,
      query,
      sort
    });

    const nextLink = buildPaginationLink({
      req,
      targetPage: result.nextPage,
      limit: result.limit,
      query,
      sort
    });

    return res.status(200).json({
      status: "success",
      payload: result.products,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink,
      nextLink
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { pid } = req.params;

    const product = await ProductMongoDAO.getProductById(pid);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Producto no encontrado"
      });
    }

    return res.status(200).json({
      status: "success",
      payload: product
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      code,
      price,
      status = true,
      stock,
      category,
      thumbnails = []
    } = req.body;

    const requiredFields = {
      title,
      description,
      code,
      price,
      stock,
      category
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => value === undefined || value === null || value === "")
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Faltan campos obligatorios: ${missingFields.join(", ")}`
      });
    }

    const existingProduct = await ProductMongoDAO.getProductByCode(code);

    if (existingProduct) {
      return res.status(409).json({
        status: "error",
        message: "Ya existe un producto con ese código"
      });
    }

    const product = await ProductMongoDAO.createProduct({
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails: Array.isArray(thumbnails)
        ? thumbnails
        : [thumbnails]
    });

    const io = req.app.get("io");

    if (io) {
      io.emit("productsUpdated", {
        action: "created",
        product
      });
    }

    return res.status(201).json({
      status: "success",
      message: "Producto creado correctamente",
      payload: product
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Ya existe un producto con ese código"
      });
    }

    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { pid } = req.params;

    if (
      Object.prototype.hasOwnProperty.call(req.body, "_id") ||
      Object.prototype.hasOwnProperty.call(req.body, "id")
    ) {
      return res.status(400).json({
        status: "error",
        message: "El ID del producto no se puede modificar"
      });
    }

    if (req.body.code) {
      const productWithCode =
        await ProductMongoDAO.getProductByCode(req.body.code);

      if (
        productWithCode &&
        productWithCode._id.toString() !== pid
      ) {
        return res.status(409).json({
          status: "error",
          message: "Ya existe otro producto con ese código"
        });
      }
    }

    const updatedProduct =
      await ProductMongoDAO.updateProduct(pid, req.body);

    if (!updatedProduct) {
      return res.status(404).json({
        status: "error",
        message: "Producto no encontrado"
      });
    }

    const io = req.app.get("io");

    if (io) {
      io.emit("productsUpdated", {
        action: "updated",
        product: updatedProduct
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Producto actualizado correctamente",
      payload: updatedProduct
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Ya existe otro producto con ese código"
      });
    }

    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { pid } = req.params;

    const deletedProduct =
      await ProductMongoDAO.deleteProduct(pid);

    if (!deletedProduct) {
      return res.status(404).json({
        status: "error",
        message: "Producto no encontrado"
      });
    }

    const io = req.app.get("io");

    if (io) {
      io.emit("productsUpdated", {
        action: "deleted",
        product: deletedProduct
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Producto eliminado correctamente",
      payload: deletedProduct
    });

  } catch (error) {
    next(error);
  }
};