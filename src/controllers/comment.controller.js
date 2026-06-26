import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";

const addCommentController = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(404, "VideoId is invalid!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video is not found!");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment is created successfully!"));
});

const updateCommentController = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required to update");
  }

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(404, "Comment is not valid!");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment is not found!");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "you can change only own comment!");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "Comment updated successfully!")
    );
});

const deleteCommentController = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(404, "Comment is invalid!");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment is not found!");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "you can only delete own comments!");
  }

  await Like.deleteMany({ comment: commentId });

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, "comment deleted successfully!"));
});

export { addCommentController, updateCommentController , deleteCommentController };
