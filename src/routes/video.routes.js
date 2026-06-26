import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getVideoByIdController,
  uploadVideoController,
} from "../controllers/video.controller.js";

const videoRouter = express.Router();

videoRouter.post(
  "/upload",
  isAuth,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideoController
);

videoRouter.get("/:videoId", isAuth, getVideoByIdController);

export default videoRouter;
