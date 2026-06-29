import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import {
  addVideosToPlaylist,
  createPlayList,
  removeVideosFromPlaylist,
} from "../controllers/PlayList.controller.js";

const playlistRouter = express.Router();

playlistRouter.post("/create", isAuth, createPlayList);
playlistRouter.patch("/add/:videoId/:playlistId", isAuth, addVideosToPlaylist);
playlistRouter.patch(
  "/remove/:videoId/:playlistId",
  isAuth,
  removeVideosFromPlaylist
);

export default playlistRouter;
