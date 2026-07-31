const socket = io();

socket.on("connect", () => {
  console.log("Socket.IO conectado:", socket.id);
});

function formatPrice(price) {
  return Number(price || 0).toLocaleString("es-AR");
}

function getProductsFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.payload)) {
    return data.payload;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.payload?.products)) {
    return data.payload.products;
  }

  if (Array.isArray(data?.docs)) {
    return data.docs;
  }

  return [];
}

function getCreatedProduct(data) {
  return (
    data?.payload ||
    data?.product ||
    data?.result ||
    data
  );
}

function getCreatedCart(data) {
  return (
    data?.payload ||
    data?.cart ||
    data?.result ||
    data
  );
}

function createProductCard(product) {
  const productId = product._id || product.id;

  const thumbnail =
    Array.isArray(product.thumbnails) &&
    product.thumbnails.length > 0
      ? product.thumbnails[0]
      : "";

  const article = document.createElement("article");

  article.className = "realtime-product-card";
  article.dataset.id = productId;

  article.innerHTML = `
    <div class="realtime-product-image">
      ${
        thumbnail
          ? `
            <img
              src="${thumbnail}"
              alt="${product.title || "Producto"}"
            >
          `
          : `
            <div class="product-default-image">
              <span>CompuAB</span>
              <small>Sin imagen</small>
            </div>
          `
      }
    </div>

    <div class="realtime-product-content">

      <span class="realtime-category">
        ${product.category || "Sin categoría"}
      </span>

      <h3>
        ${product.title || "Producto sin nombre"}
      </h3>

      <p class="realtime-description">
        ${product.description || "Sin descripción"}
      </p>

      <div class="realtime-product-info">
        <span>
          Stock: ${product.stock ?? 0}
        </span>

        <strong>
          $${formatPrice(product.price)}
        </strong>
      </div>

      <button
        type="button"
        class="delete-product"
        data-id="${productId}"
      >
        Eliminar producto
      </button>

    </div>
  `;

  return article;
}

const productForm = document.getElementById("productForm");

const productsContainer = document.getElementById(
  "products-container"
);

const formMessage = document.getElementById("form-message");

function renderProducts(products) {
  if (!productsContainer) {
    return;
  }

  productsContainer.innerHTML = "";

  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div class="empty-message">
        <h3>No hay productos cargados</h3>
        <p>Agregá un producto desde el formulario.</p>
      </div>
    `;

    return;
  }

  products.forEach((product) => {
    productsContainer.appendChild(
      createProductCard(product)
    );
  });
}

async function loadProducts() {
  if (!productsContainer) {
    return;
  }

  try {
    const response = await fetch(
      "/api/products?limit=100&page=1"
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
        "No se pudieron cargar los productos"
      );
    }

    const products = getProductsFromResponse(data);

    renderProducts(products);
  } catch (error) {
    console.error(error);
  }
}

if (productForm) {
  productForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = productForm.querySelector(
      'button[type="submit"]'
    );

    const formData = new FormData(productForm);

    const productData = {
      title: formData.get("title")?.trim(),
      description: formData.get("description")?.trim(),
      code: formData.get("code")?.trim(),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      category: formData.get("category"),
      status: true,
      thumbnails: []
    };

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Agregando...";

      formMessage.textContent = "";

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          "No se pudo agregar el producto"
        );
      }

      const createdProduct = getCreatedProduct(data);

      productForm.reset();

      formMessage.textContent =
        "Producto agregado correctamente.";

      if (
        createdProduct &&
        (createdProduct._id || createdProduct.id)
      ) {
        const emptyMessage =
          productsContainer?.querySelector(".empty-message");

        emptyMessage?.remove();

        productsContainer?.prepend(
          createProductCard(createdProduct)
        );
      } else {
        await loadProducts();
      }
    } catch (error) {
      formMessage.textContent = error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Agregar producto";
    }
  });
}

if (productsContainer) {
  productsContainer.addEventListener(
    "click",
    async (event) => {
      const button = event.target.closest(".delete-product");

      if (!button) {
        return;
      }

      const productId = button.dataset.id;

      const confirmed = window.confirm(
        "¿Querés eliminar este producto?"
      );

      if (!confirmed) {
        return;
      }

      try {
        button.disabled = true;
        button.textContent = "Eliminando...";

        const response = await fetch(
          `/api/product/${productId}`,
          {
            method: "DELETE"
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            "No se pudo eliminar el producto"
          );
        }

        button.closest(".realtime-product-card")?.remove();

        const remainingCards =
          productsContainer.querySelectorAll(
            ".realtime-product-card"
          );

        if (remainingCards.length === 0) {
          renderProducts([]);
        }

        if (formMessage) {
          formMessage.textContent =
            "Producto eliminado correctamente.";
        }
      } catch (error) {
        alert(error.message);

        button.disabled = false;
        button.textContent = "Eliminar producto";
      }
    }
  );
}

socket.on("productsUpdated", loadProducts);
socket.on("updateProducts", loadProducts);

/* =====================================================
   CARRITO AUTOMÁTICO
===================================================== */

const addToCartButton =
  document.getElementById("add-to-cart");

const cartMessage =
  document.getElementById("cart-message");

const viewCartLink =
  document.getElementById("view-cart-link");

function saveCartId(cartId) {
  localStorage.setItem("compuabCartId", cartId);
}

function getSavedCartId() {
  return localStorage.getItem("compuabCartId");
}

function updateCartLink(cartId) {
  if (!viewCartLink || !cartId) {
    return;
  }

  viewCartLink.href = `/carts/${cartId}`;
  viewCartLink.hidden = false;
}

async function createCart() {
  const response = await fetch("/api/carts", {
    method: "POST"
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
      "No se pudo crear el carrito"
    );
  }

  const cart = getCreatedCart(data);

  const cartId = cart?._id || cart?.id;

  if (!cartId) {
    throw new Error(
      "El servidor no devolvió el ID del carrito"
    );
  }

  saveCartId(cartId);

  return cartId;
}

async function getOrCreateCartId() {
  const savedCartId = getSavedCartId();

  if (savedCartId) {
    return savedCartId;
  }

  return await createCart();
}

if (addToCartButton) {
  const existingCartId = getSavedCartId();

  if (existingCartId) {
    updateCartLink(existingCartId);
  }

  addToCartButton.addEventListener("click", async () => {
    const productId =
      addToCartButton.dataset.productId;

    try {
      addToCartButton.disabled = true;

      addToCartButton.textContent =
        "Agregando al carrito...";

      cartMessage.textContent = "";

      let cartId = await getOrCreateCartId();

      let response = await fetch(
        `/api/carts/${cartId}/products/${productId}`,
        {
          method: "POST"
        }
      );

      let data = await response
        .json()
        .catch(() => ({}));

      /*
        Si el carrito guardado ya no existe,
        crea uno nuevo y vuelve a intentarlo.
      */
      if (response.status === 404) {
        localStorage.removeItem("compuabCartId");

        cartId = await createCart();

        response = await fetch(
          `/api/carts/${cartId}/products/${productId}`,
          {
            method: "POST"
          }
        );

        data = await response
          .json()
          .catch(() => ({}));
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          "No se pudo agregar el producto"
        );
      }

      cartMessage.textContent =
        "Producto agregado al carrito.";

      updateCartLink(cartId);
    } catch (error) {
      cartMessage.textContent = error.message;
    } finally {
      addToCartButton.disabled = false;

      addToCartButton.textContent =
        "Agregar al carrito";
    }
  });
}
const headerCartLink = document.getElementById(
  "header-cart-link"
);

if (headerCartLink) {
  const savedCartId = localStorage.getItem(
    "compuabCartId"
  );

  if (savedCartId) {
    headerCartLink.href = `/carts/${savedCartId}`;
  } else {
    headerCartLink.addEventListener("click", (event) => {
      event.preventDefault();

      alert(
        "Todavía no tenés un carrito. Agregá un producto primero."
      );
    });
  }
}