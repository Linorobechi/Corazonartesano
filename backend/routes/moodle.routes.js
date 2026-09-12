import { Router } from "express";
import { getMoodleCourses, enrollCourse } from "../controllers/moodle.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/cursos", getMoodleCourses);
router.get("/moodle/courses", getMoodleCourses);
router.post("/moodle/enroll", authMiddleware, requireRole(["artesano", "admin"]), enrollCourse);

export default router;
