import { pool, isUsingMemoryDb, memoryDb } from "../config/db.js";
import { formatCurrency } from "../utils/formatters.js";
import { uploadFileToStorage } from "../utils/storage.js";

const parseColors = (value) => {
  if (!value) return [];
  const colors = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(colors)) throw new Error("Las variantes de color no son válidas");
  return [...new Set(colors.filter((color) => typeof color === "string").map((color) => color.trim()).filter(Boolean))];
};

/**
 * Valida si el usuario tiene permiso para editar o eliminar un producto
 */
export const canUserManageProduct = (user, product) => {
  if (!user || !product) return false;
  if (user.rol === "admin") return true;
  if (user.rol === "artesano") {
    if (product.author_user_id && Number(product.author_user_id) === Number(user.id)) {
      return true;
    }
    if (
      user.nombre &&
      product.autor &&
      user.nombre.toLowerCase().trim() === product.autor.toLowerCase().trim()
    ) {
      return true;
    }
  }
  return false;
};

/**
 * Obtener todos los productos (ordenados por destacado y fecha)
 */
export const getProducts = async (_req, res) => {
  try {
    if (isUsingMemoryDb) {
      const sorted = [...memoryDb.products].sort((a, b) => {
        const destA = a.destacado ? 1 : 0;
        const destB = b.destacado ? 1 : 0;
        if (destB !== destA) return destB - destA;
        return b.id - a.id;
      });
      const formatted = sorted.map((p) => ({
        ...p,
        precio: formatCurrency(Number(p.precio)),
        rawPrecio: Number(p.precio),
        destacado: Boolean(p.destacado),
      }));
      return res.json({ products: formatted });
    }

    const rows = await pool.query(
      `SELECT
         p.id,
         p.nombre,
         COALESCE(u.nombre, p.autor) AS autor,
         p.author_user_id,
         p.descripcion,
         p.precio,
         p.imagen_key,
         p.image_data,
         p.image_gallery,
         p.colores,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS rating,
        COUNT(r.id)::int AS review_count,
        COALESCE(p.destacado, false) AS destacado
       FROM products p
       LEFT JOIN users u ON u.id = p.author_user_id
       LEFT JOIN reviews r ON r.product_id = p.id
       GROUP BY p.id, u.nombre
       ORDER BY p.destacado DESC, p.id DESC`
    );

    return res.json({
      products: rows.rows.map((product) => ({
        ...product,
        precio: formatCurrency(Number(product.precio)),
        rawPrecio: Number(product.precio),
        destacado: Boolean(product.destacado),
        rating: Number(product.rating || 0),
        review_count: Number(product.review_count || 0),
      })),
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return res.status(500).json({ message: "No se pudieron cargar los productos" });
  }
};

/**
 * Crear un nuevo producto (Rol artesano o admin)
 */
export const createProduct = async (req, res) => {
  try {
    const { nombre, descripcion, precio, image_url } = req.body;
    const colores = parseColors(req.body.colores);
    const imageFiles = req.files || [];

    if (!nombre || !descripcion || !precio) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const parsedPrice = Number(precio);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "El precio debe ser un número mayor a cero" });
    }

    const autorNombre = req.user.nombre || "Artesano";
    const author_user_id = req.user.id;

    // Subir imagen a Supabase Storage Bucket 'productos' o usar image_url provista
    let image_data = null;
    let image_gallery = [];
    if (imageFiles.length > 0) {
      const uploadedImages = await Promise.all(
        imageFiles.map((file) => uploadFileToStorage(file, "productos"))
      );
      image_data = uploadedImages[0];
      image_gallery = uploadedImages.slice(1);
    } else if (image_url) {
      image_data = image_url.trim();
    }

    const imagen_key = imageFiles[0]
      ? imageFiles[0].originalname
      : (image_data ? "supabase-storage" : "1.jpeg");

    if (isUsingMemoryDb) {
      const newProd = {
        id: memoryDb.nextProductId++,
        nombre: nombre.trim(),
        autor: autorNombre,
        author_user_id,
        descripcion: descripcion.trim(),
        precio: parsedPrice,
        imagen_key,
        image_data,
        image_gallery,
        colores,
        destacado: false,
      };
      memoryDb.products.unshift(newProd);
      return res.status(201).json({
        message: "Producto creado correctamente",
        product: { ...newProd, precio: formatCurrency(parsedPrice), rawPrecio: parsedPrice },
      });
    }

    const result = await pool.query(
      `INSERT INTO products (nombre, autor, author_user_id, descripcion, precio, imagen_key, image_data, image_gallery, colores, destacado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [nombre.trim(), autorNombre, author_user_id, descripcion.trim(), parsedPrice, imagen_key, image_data, image_gallery, colores, false]
    );

    const created = result.rows[0];

    return res.status(201).json({
      message: "Producto creado correctamente",
      product: {
        id: created.id,
        nombre: created.nombre,
        autor: created.autor,
        author_user_id: created.author_user_id,
        descripcion: created.descripcion,
        precio: formatCurrency(parsedPrice),
        rawPrecio: parsedPrice,
        image_data,
        image_gallery,
        colores,
        destacado: false,
      },
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return res.status(500).json({ message: "No se pudo crear el producto" });
  }
};

/**
 * Actualizar producto existente (propietario o admin)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, image_url } = req.body;
    const colores = req.body.colores === undefined ? null : parseColors(req.body.colores);
    const imageFiles = req.files || [];

    if (isUsingMemoryDb) {
      const prodIndex = memoryDb.products.findIndex((p) => p.id === Number(id));
      if (prodIndex === -1) return res.status(404).json({ message: "Producto no encontrado" });

      const prod = memoryDb.products[prodIndex];
      if (!canUserManageProduct(req.user, prod)) {
        return res.status(403).json({ message: "No tienes permiso para modificar este producto porque fue publicado por otro artesano." });
      }

      if (nombre) prod.nombre = nombre.trim();
      if (descripcion) prod.descripcion = descripcion.trim();
      if (precio) prod.precio = Number(precio);
      if (imageFiles.length > 0) {
        const uploadedImages = await Promise.all(
          imageFiles.map((file) => uploadFileToStorage(file, "productos"))
        );
        prod.image_data = uploadedImages[0];
        prod.image_gallery = uploadedImages.slice(1);
      } else if (image_url) {
        prod.image_data = image_url.trim();
      }
      if (colores) prod.colores = colores;

      return res.json({ message: "Producto actualizado correctamente", product: prod });
    }

    const rows = await pool.query("SELECT * FROM products WHERE id = $1 LIMIT 1", [id]);
    if (!rows.rows || rows.rows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    const prod = rows.rows[0];

    if (!canUserManageProduct(req.user, prod)) {
      return res.status(403).json({ message: "No tienes permiso para modificar este producto porque fue publicado por otro artesano." });
    }

    const newName = nombre ? nombre.trim() : prod.nombre;
    const newDesc = descripcion ? descripcion.trim() : prod.descripcion;
    const newPrice = precio ? Number(precio) : prod.precio;

    let newImageData = prod.image_data;
    let newImageGallery = prod.image_gallery || [];
    if (imageFiles.length > 0) {
      const uploadedImages = await Promise.all(
        imageFiles.map((file) => uploadFileToStorage(file, "productos"))
      );
      newImageData = uploadedImages[0];
      newImageGallery = uploadedImages.slice(1);
    } else if (image_url) {
      newImageData = image_url.trim();
    }

    await pool.query(
      `UPDATE products SET nombre = $1, descripcion = $2, precio = $3, image_data = $4, image_gallery = $5, colores = COALESCE($6, colores) WHERE id = $7`,
      [newName, newDesc, newPrice, newImageData, newImageGallery, colores, id]
    );

    return res.json({
      message: "Producto actualizado correctamente",
      image_data: newImageData,
      image_gallery: newImageGallery,
      colores: colores || prod.colores || [],
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return res.status(500).json({ message: "Error al actualizar producto" });
  }
};

/**
 * Eliminar producto existente (propietario o admin)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (isUsingMemoryDb) {
      const prodIndex = memoryDb.products.findIndex((p) => p.id === Number(id));
      if (prodIndex === -1) return res.status(404).json({ message: "Producto no encontrado" });

      const prod = memoryDb.products[prodIndex];
      if (!canUserManageProduct(req.user, prod)) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este producto porque fue publicado por otro artesano." });
      }

      memoryDb.products.splice(prodIndex, 1);
      return res.json({ message: "Producto eliminado correctamente" });
    }

    const rows = await pool.query("SELECT * FROM products WHERE id = $1 LIMIT 1", [id]);
    if (!rows.rows || rows.rows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    const prod = rows.rows[0];

    if (!canUserManageProduct(req.user, prod)) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este producto porque fue publicado por otro artesano." });
    }

    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    return res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return res.status(500).json({ message: "Error al eliminar producto" });
  }
};

/**
 * Marcar o desmarcar producto como destacado primordial (Solo Admin)
 */
export const toggleDestacado = async (req, res) => {
  try {
    const { id } = req.params;
    const { destacado } = req.body;

    if (isUsingMemoryDb) {
      const prod = memoryDb.products.find((p) => p.id === Number(id));
      if (!prod) return res.status(404).json({ message: "Producto no encontrado" });
      const newStatus = destacado !== undefined ? Boolean(destacado) : !prod.destacado;
      prod.destacado = newStatus;
      return res.json({
        message: newStatus
          ? `"${prod.nombre}" es ahora un producto primordial (saldrá de primero en el catálogo).`
          : `"${prod.nombre}" quitado de productos primordiales.`,
        destacado: newStatus,
        product: prod,
      });
    }

    const rows = await pool.query("SELECT * FROM products WHERE id = $1 LIMIT 1", [id]);
    if (!rows.rows || rows.rows.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    const prod = rows.rows[0];

    const newStatus = destacado !== undefined ? Boolean(destacado) : !prod.destacado;
    await pool.query("UPDATE products SET destacado = $1 WHERE id = $2", [newStatus, id]);

    return res.json({
      message: newStatus
        ? `"${prod.nombre}" es ahora un producto primordial (saldrá de primero en el catálogo).`
        : `"${prod.nombre}" quitado de productos primordiales.`,
      destacado: newStatus,
    });
  } catch (error) {
    console.error("Error al cambiar estado primordial de producto:", error);
    return res.status(500).json({ message: "Error al actualizar estado primordial del producto" });
  }
};
