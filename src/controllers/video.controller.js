import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import mongoose from "mongoose";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";

const uploadVideoController = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "title and description are required!");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailPath) {
    throw new ApiError(400, "Video and thumbnail are missing!");
  }

  const videofile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!videofile || !thumbnail) {
    throw new ApiError(400, "Video and thumbnail are required!");
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const video = await Video.create({
    title,
    description,
    videoFile: { url: videofile.url, public_id: videofile.public_id },
    duration: formatDuration(videofile.duration),
    thumbnail: { url: thumbnail.url, public_id: thumbnail.public_id },
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video Uploaded successfully"));
});

const getVideoByIdController = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid video ID" });
    }

    const video = await Video.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(videoId) },
      },

      // get owner details
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },

      // get likes count
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },

      // get comments count
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comments",
        },
      },

      {
        $addFields: {
          owner: { $first: "$owner" },
          likesCount: { $size: "$likes" },
          commentsCount: { $size: "$comments" },
          isLiked: {
            $cond: {
              if: { $in: [req.user?._id, "$likes.likedBy"] },
              then: true,
              else: false,
            },
          },
        },
      },

      {
        $project: {
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          owner: 1,
          likesCount: 1,
          commentsCount: 1,
          isLiked: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!video.length) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    // increment views
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    return res.status(200).json({ success: true, video: video[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllVideosController = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const pipeline = [];

 
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }
    pipeline.push({
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    });
  }

  // search by title or description
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }

  // get owner details
  pipeline.push({
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
  });

  // get likes count
  pipeline.push({
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "video",
      as: "likes",
    },
  });

  // add extra fields
  pipeline.push({
    $addFields: {
      owner: { $first: "$owner" },
      likesCount: { $size: "$likes" },
    },
  });

  // remove likes array (not needed in response)
  pipeline.push({
    $project: {
      likes: 0,
    },
  });

  // sort
  pipeline.push({
    $sort: { [sortBy]: sortType === "desc" ? -1 : 1 },
  });

  // pagination
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const videos = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  if (!videos.docs.length) {
    throw new ApiError(404, "No videos found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "All videos fetched successfully"));
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!title && !description) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title || video.title,
        description: description || video.description,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const updateThumbnail = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Thumbnail is missing!");
  }

  const thumbnailLocalPath = req.file.path;
  const { videoId } = req.params;

  const currVideo = await Video.findById(videoId);
  if (!currVideo) {
    throw new ApiError(404, "Video not found!");
  }

  if (currVideo.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail?.url) {
    throw new ApiError(500, "Error uploading thumbnail to Cloudinary!");
  }

  const oldThumbnailPublicId = currVideo.thumbnail?.public_id;

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: {
          url: thumbnail.url,
          public_id: thumbnail.public_id,
        },
      },
    },
    { new: true }
  );

  if (oldThumbnailPublicId) {
    await deleteFromCloudinary(oldThumbnailPublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Thumbnail updated successfully"));
});

const deleteVideoController = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }

  const currentThumbnailPublicId = video.thumbnail?.public_id;
  const currentVideoFilePublicId = video.videoFile?.public_id;

  if (currentThumbnailPublicId) {
    await deleteFromCloudinary(currentThumbnailPublicId); 
  }

  if (currentVideoFilePublicId) {
    await deleteFromCloudinary(currentVideoFilePublicId, "video"); 
  }

  await Comment.deleteMany({ video: videoId });
  await Like.deleteMany({ video: videoId });

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // 2. find video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  // 3. owner check
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to change publish status");
  }

  // 4. toggle
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { isPublished: !video.isPublished } },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: updatedVideo.isPublished },
        `Video is now ${updatedVideo.isPublished ? "published" : "unpublished"}`
      )
    );
});

export {
  uploadVideoController,
  getVideoByIdController,
  getAllVideosController,
  updateVideoDetails,
  updateThumbnail,
  deleteVideoController,
  togglePublishStatus,
};
