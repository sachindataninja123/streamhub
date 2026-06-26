import express from "express";
import isAuth from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getAllVideosController,
  getVideoByIdController,
  updateVideoDetails,
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
videoRouter.get("/", isAuth, getAllVideosController);
videoRouter.patch("/update/:videoId", isAuth, updateVideoDetails);

export default videoRouter;
