import fs from "fs/promises";

export default class CartManager {
  constructor(path = "./data/carts.json") {
    this.path = path;
  }

  async getCarts() {
    try {
      const data = await fs.readFile(this.path, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async createCart() {
    const carts = await this.getCarts();

    const cart = {
      id:
        carts.length > 0
          ? carts[carts.length - 1].id + 1
          : 1,
      products: [],
    };

    carts.push(cart);

    await fs.writeFile(
      this.path,
      JSON.stringify(carts, null, 2)
    );

    return cart;
  }

  async getCartById(id) {
    const carts = await this.getCarts();

    return carts.find((c) => c.id === id);
  }

  async addProduct(cartId, productId) {
    const carts = await this.getCarts();

    const cart = carts.find((c) => c.id === cartId);

    if (!cart) return null;

    const product = cart.products.find(
      (p) => p.product === productId
    );

    if (product) {
      product.quantity++;
    } else {
      cart.products.push({
        product: productId,
        quantity: 1,
      });
    }

    await fs.writeFile(
      this.path,
      JSON.stringify(carts, null, 2)
    );

    return cart;
  }
}