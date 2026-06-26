import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import {
  addCommentController,
  deleteCommentController,
  updateCommentController,
} from "../controllers/comment.controller.js";

const commentRouter = express.Router();

commentRouter.post("/add/:videoId", isAuth, addCommentController);
commentRouter.patch("/update/:commentId", isAuth, updateCommentController);
commentRouter.delete("/delete/:commentId", isAuth, deleteCommentController);

export default commentRouter;
