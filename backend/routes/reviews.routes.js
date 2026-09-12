import { Router } from "express";
import {
  getProductReviews,
  addProductReview,
  getRecentReviews,
} from "../controllers/reviews.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/products/:productId/reviews", getProductReviews);
router.post("/products/:productId/reviews", authMiddleware, addProductReview);
router.get("/reviews/recent", getRecentReviews);

export default router;
