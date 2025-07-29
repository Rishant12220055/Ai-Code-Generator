import express from "express";
import { generateComponent } from "../controllers/componentController.js";
const router = express.Router();

// Route to handle component generation
router.post("/", generateComponent);

export default router;
