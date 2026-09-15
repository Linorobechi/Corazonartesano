import { Router } from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/products.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.get("/products", getProducts);
router.post(
  "/products",
  authMiddleware,
  requireRole(["artesano", "admin"]),
  upload.array("image_files", 5),
  createProduct
);
router.put(
  "/products/:id",
  authMiddleware,
  requireRole(["artesano", "admin"]),
  upload.array("image_files", 5),
  updateProduct
);
router.delete(
  "/products/:id",
  authMiddleware,
  requireRole(["artesano", "admin"]),
  deleteProduct
);

export default router;
