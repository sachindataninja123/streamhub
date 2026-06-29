import PlayList from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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


export {createPlayList}