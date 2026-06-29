import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import { createPlayList } from "../controllers/PlayList.controller.js";

const playlistRouter = express.Router();

playlistRouter.post("/create", isAuth, createPlayList);

export default playlistRouter;
