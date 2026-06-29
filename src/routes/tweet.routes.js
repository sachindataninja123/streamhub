import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";

const tweetRouter = express.Router();

tweetRouter.post("/create", isAuth, createTweet);
tweetRouter.get("/user/:userId", isAuth, getUserTweets);
tweetRouter.patch("/update/:tweetId", isAuth, updateTweet);
tweetRouter.delete("/delete/:tweetId", isAuth, deleteTweet);

export default tweetRouter;
