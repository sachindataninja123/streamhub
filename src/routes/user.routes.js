import express from "express";
import {
  getCurrentUserController,
  loginController,
  logOutController,
  refreshTokenController,
  registerController,
  updateAccountDetailsController,
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
userRouter.put("/change-password", isAuth, updatePasswordController);
userRouter.put("/update-details", isAuth, updateAccountDetailsController);

export default userRouter;
