import express from "express";
import { healthCheckController } from "../controllers/healthCheck.controller.js";

const healthRouter = express.Router();

healthRouter.get("/health", healthCheckController);

export default healthRouter;
