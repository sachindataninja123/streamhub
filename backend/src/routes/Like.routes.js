import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/Like.controller.js";

const likeRouter = express.Router();

likeRouter.post("/video/:videoId", isAuth, toggleVideoLike);
likeRouter.post("/comment/:commentId", isAuth, toggleCommentLike);
likeRouter.post("/tweet/:tweetId", isAuth, toggleTweetLike);
likeRouter.get("/videos", isAuth, getLikedVideos);

export default likeRouter;
