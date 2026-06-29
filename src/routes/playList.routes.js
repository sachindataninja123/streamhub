import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import {
  addVideosToPlaylist,
  createPlayList,
  deletePlayList,
  getPlaylistById,
  getUserPlaylists,
  removeVideosFromPlaylist,
  updatePlaylist,
} from "../controllers/PlayList.controller.js";

const playlistRouter = express.Router();

playlistRouter.post("/create", isAuth, createPlayList);
playlistRouter.patch("/add/:videoId/:playlistId", isAuth, addVideosToPlaylist);
playlistRouter.patch(
  "/remove/:videoId/:playlistId",
  isAuth,
  removeVideosFromPlaylist
);
playlistRouter.delete("/delete/:playlistId", isAuth, deletePlayList);
playlistRouter.get("/user/:userId", isAuth, getUserPlaylists);
playlistRouter.get("/:playlistId", isAuth, getPlaylistById);
playlistRouter.patch("/update/:playlistId" , isAuth , updatePlaylist)

export default playlistRouter;
