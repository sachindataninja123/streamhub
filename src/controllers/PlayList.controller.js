import mongoose from "mongoose";
import PlayList from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const createPlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "name and description are required!");
  }

  const playList = await PlayList.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playList) {
    throw new ApiError(500, "playlist creation error from database!");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playList, "PlayList created successfully!"));
});

const addVideosToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Playlist Id is invalid!");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "video Id is invalid!");
  }

  const playList = await PlayList.findById(playlistId);
  if (!playList) {
    throw new ApiError(404, "playlist not found!");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found!");
  }

  if (playList.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied!");
  }

  if (playList.videos.includes(videoId)) {
    throw new ApiError(400, "Video already in playlist!");
  }

  const updatedPlayList = await PlayList.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: videoId },
    },
    {
      new: true,
    }
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        updatedPlayList,
        "Video added in playlist successfully!"
      )
    );
});

const removeVideosFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Playlist Id is invalid!");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "video Id is invalid!");
  }

  const playList = await PlayList.findById(playlistId);
  if (!playList) {
    throw new ApiError(404, "playlist not found!");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found!");
  }

  if (playList.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied!");
  }

  if (!playList.videos.includes(videoId)) {
    throw new ApiError(400, "Videos not in playlist!");
  }

  const updatedPlayList = await PlayList.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlayList,
        "Video removed from playlist successfully!"
      )
    );
});

const deletePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "PlaylistId is inValid!");
  }

  const playList = await PlayList.findById(playlistId);
  if (!playList) {
    throw new ApiError(404, "playlist not found!");
  }

  if (playList.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied!");
  }

  await PlayList.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, "playlist deleted successfully!"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "User Id is invalid!");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  // aggregate
  const playlists = await PlayList.aggregate([
    // match all playlists of this user
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    },

    // get video details
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
            },
          },
        ],
      },
    },

    // get playlist owner details
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

    // add extra fields
    {
      $addFields: {
        owner: { $first: "$owner" },
        totalVideos: { $size: "$videos" },
        totalViews: { $sum: "$videos.views" }, // sum of all video views
        thumbnail: { $first: "$videos.thumbnail" }, // first video thumbnail as playlist cover
      },
    },

    // project only needed fields
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        totalVideos: 1,
        totalViews: 1,
        thumbnail: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },

    // newest playlist first
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        playlists.length === 0
          ? "No playlists found!"
          : "User playlists fetched successfully!"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Playlist Id is invalid!");
  }


  const playlist = await PlayList.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(playlistId) },
    },

    // get full video details
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          // get owner of each video
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
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              owner: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },

    // get playlist owner details
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

    // add extra fields
    {
      $addFields: {
        owner: { $first: "$owner" },
        totalVideos: { $size: "$videos" },
        totalViews: { $sum: "$videos.views" },
        thumbnail: { $first: "$videos.thumbnail" }, // first video as cover
      },
    },

    // project only needed fields
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        owner: 1,
        totalVideos: 1,
        totalViews: 1,
        thumbnail: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  // check if playlist exists
  if (!playlist.length) {
    throw new ApiError(404, "Playlist not found!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist[0], "Playlist fetched successfully!")
    );
});

export {
  createPlayList,
  addVideosToPlaylist,
  removeVideosFromPlaylist,
  deletePlayList,
  getUserPlaylists,
  getPlaylistById
};
