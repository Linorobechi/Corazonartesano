import { Router } from "express";
import {
  getStats,
  getUsers,
  updateUserRole,
  deleteUserAccount,
} from "../controllers/admin.controller.js";
import { toggleDestacado } from "../controllers/products.controller.js";

const router = Router();

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUserAccount);
router.put("/products/:id/destacado", toggleDestacado);

export default router;
