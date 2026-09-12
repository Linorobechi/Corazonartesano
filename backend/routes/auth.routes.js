import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/user/profile", authMiddleware, getProfile);
router.put("/user/profile", authMiddleware, upload.single("foto"), updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
