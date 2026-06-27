import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import {
  getSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";

const subscriptionRouter = express.Router();

subscriptionRouter.post("/toggle/:channelId", isAuth, toggleSubscription);

subscriptionRouter.get("/subscribers/:channelId", isAuth, getSubscribers);

export default subscriptionRouter;
