import mongoose from "mongoose";
import ProductModel from "../../models/product.model.js";

class ProductMongoDAO {
  async getProducts({
    limit = 10,
    page = 1,
    query,
    sort
  } = {}) {
    const parsedLimit = Number(limit);
    const parsedPage = Number(page);

    const safeLimit =
      Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

    const safePage =
      Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const filter = {};

    if (query) {
      const normalizedQuery = String(query).trim().toLowerCase();

      if (normalizedQuery === "true" || normalizedQuery === "false") {
        filter.status = normalizedQuery === "true";
      } else {
        filter.category = {
          $regex: normalizedQuery,
          $options: "i"
        };
      }
    }

    const sortOption = {};

    if (sort === "asc") {
      sortOption.price = 1;
    }

    if (sort === "desc") {
      sortOption.price = -1;
    }

    const skip = (safePage - 1) * safeLimit;

    const [products, totalDocs] = await Promise.all([
      ProductModel.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      ProductModel.countDocuments(filter)
    ]);

    const totalPages =
      totalDocs === 0 ? 0 : Math.ceil(totalDocs / safeLimit);

    const hasPrevPage = safePage > 1 && totalPages > 0;
    const hasNextPage = safePage < totalPages;

    return {
      products,
      totalDocs,
      totalPages,
      page: safePage,
      limit: safeLimit,
      hasPrevPage,
      hasNextPage,
      prevPage: hasPrevPage ? safePage - 1 : null,
      nextPage: hasNextPage ? safePage + 1 : null
    };
  }

  async getProductById(productId) {
    if (!mongoose.isValidObjectId(productId)) {
      return null;
    }

    return ProductModel.findById(productId).lean();
  }

  async getProductByCode(code) {
    return ProductModel.findOne({
      code: String(code).trim().toUpperCase()
    }).lean();
  }

  async createProduct(productData) {
    const product = await ProductModel.create(productData);

    return product.toObject();
  }

  async updateProduct(productId, updateData) {
    if (!mongoose.isValidObjectId(productId)) {
      return null;
    }

    const safeUpdateData = { ...updateData };

    delete safeUpdateData._id;
    delete safeUpdateData.id;
    delete safeUpdateData.createdAt;
    delete safeUpdateData.updatedAt;

    return ProductModel.findByIdAndUpdate(
      productId,
      safeUpdateData,
      {
        new: true,
        runValidators: true
      }
    ).lean();
  }

  async deleteProduct(productId) {
    if (!mongoose.isValidObjectId(productId)) {
      return null;
    }

    return ProductModel.findByIdAndDelete(productId).lean();
  }
}

export default new ProductMongoDAO();