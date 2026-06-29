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

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "VideoId is invalid!"); 
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video is not found!");
  }

  const pipeline = [
    // get all comments of this video
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
    },

    //  get owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: { username: 1, avatar: 1 },
          },
        ],
      },
    },

    //  get likes on each comment
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },

    //  add extra fields
    {
      $addFields: {
        owner: { $first: "$owner" },
        likesCount: { $size: "$likes" },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },

    //  remove likes array from response
    {
      $project: {
        likes: 0,
      },
    },

    // newest comments first
    {
      $sort: { createdAt: -1 },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const comments = await Comment.aggregatePaginate(
    Comment.aggregate(pipeline),
    options
  );

  if (!comments.docs.length) {
    throw new ApiError(404, "No comments found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

export {
  addCommentController,
  updateCommentController,
  deleteCommentController,
  getVideoComments
};
