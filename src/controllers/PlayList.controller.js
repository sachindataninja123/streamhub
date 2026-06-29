import mongoose from "mongoose";
import PlayList from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

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

export { createPlayList, addVideosToPlaylist, removeVideosFromPlaylist , deletePlayList };
