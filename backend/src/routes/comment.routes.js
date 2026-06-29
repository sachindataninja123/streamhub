import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import {
  addCommentController,
  deleteCommentController,
  getVideoComments,
  updateCommentController,
} from "../controllers/comment.controller.js";

const commentRouter = express.Router();

commentRouter.post("/add/:videoId", isAuth, addCommentController);
commentRouter.patch("/update/:commentId", isAuth, updateCommentController);
commentRouter.delete("/delete/:commentId", isAuth, deleteCommentController);
commentRouter.get("/:videoId", isAuth, getVideoComments);

export default commentRouter;
