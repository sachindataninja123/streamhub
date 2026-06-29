import express from "express";
import {
  getCurrentUserController,
  getUserChannelProfile,
  getWatchUserHistory,
  loginController,
  logOutController,
  refreshTokenController,
  registerController,
  updateAccountDetailsController,
  updateAvatarController,
  updateCoverImageController,
  updatePasswordController,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import isAuth from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerController
);

userRouter.post("/login", loginController);
userRouter.post("/logout", isAuth, logOutController);
userRouter.post("/refresh-token", refreshTokenController);
userRouter.get("/get-me", isAuth, getCurrentUserController);
userRouter.patch("/change-password", isAuth, updatePasswordController);
userRouter.patch("/update-details", isAuth, updateAccountDetailsController);
userRouter.patch(
  "/update-avatar",
  isAuth,
  upload.single("avatar"),
  updateAvatarController
);
userRouter.patch(
  "/update-coverImage",
  isAuth,
  upload.single("coverImage"),
  updateCoverImageController
);

userRouter.get("/channel/:username", isAuth, getUserChannelProfile);
userRouter.get("/history", isAuth, getWatchUserHistory);

export default userRouter;
