import express from "express";
import {
  loginController,
  logOutController,
  refreshTokenController,
  registerController,
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

export default userRouter;
