import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("error", error);

    throw new ApiError(
      500,
      "Error in generating accessTokens and RefreshTokens"
    );
  }
};

const registerController = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if ([username, email, fullname, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (user) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //   console.log("BODY:", req.body);
  //   console.log("FILES:", req.files);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const newUser = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    avatar: { url: avatar.url, public_id: avatar.public_id },
    coverImage: { url: coverImage.url, public_id: coverImage.public_id } || "",
    password,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered Successfully"));
});

const loginController = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "Email or username is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  }).select("+password");
  if (!existUser) {
    throw new ApiError(404, "User does'nt exist!");
  }

  const isValidUser = await existUser.comparePassword(password);
  if (!isValidUser) {
    throw new ApiError(401, "Invalid user Credentials!");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(existUser._id);

  const loggedInUser = await User.findById(existUser._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In successfully!"
      )
    );
});

const logOutController = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshTokenController = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    // console.log("Incoming:", incomingRefreshToken);
    // console.log("Stored:", user.refreshToken);

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "refresh token is expired and used");
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const updatePasswordController = asyncHandler(async (req, res) => {
  const { password, newPassword } = req.body;

  if (!password || !newPassword) {
    throw new ApiError(401, "Old password and newPassword are required");
  }

  const user = await User.findById(req.user._id).select("+password");

  const isValidUser = await user.comparePassword(password);
  if (!isValidUser) {
    throw new ApiError(401, "Invalid old password!");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"));
});

const getCurrentUserController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully!"));
});

const updateAccountDetailsController = asyncHandler(async (req, res) => {
  const { fullname, username } = req.body;

  if ([fullname, username].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    username,
    _id: { $ne: req.user._id },
  });

  if (existingUser) {
    throw new ApiError(409, "username already exists");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        username,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateAvatarController = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing!");
  }

  const currentUser = await User.findById(req.user._id);

  if (!currentUser) {
    throw new ApiError(404, "User not found!");
  }

  const oldAvatarPublicId = currentUser.avatar?.public_id;

  // console.log("oldAvatarPublicId : " , oldAvatarPublicId)

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "Error in Avatar uploading on cloudinary!");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: { url: avatar.url, public_id: avatar.public_id },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (oldAvatarPublicId) {
    await deleteFromCloudinary(oldAvatarPublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully!"));
});

const updateCoverImageController = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage is missing!");
  }

  const currentUser = await User.findById(req.user._id);

  if (!currentUser) {
    throw new ApiError(404, "User not found!");
  }

  const oldCoverImagePublicId = currentUser.coverImage?.public_id;

  // console.log("oldCoverImagePublicId", oldCoverImagePublicId);

  const uploadCoverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!uploadCoverImage.url) {
    throw new ApiError(400, "Error in uploading CoverImage at cloudinary!");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: {
          url: uploadCoverImage.url,
          public_id: uploadCoverImage.public_id,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (oldCoverImagePublicId) {
    await deleteFromCloudinary(oldCoverImagePublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage updated Successfully"));
});

export {
  registerController,
  loginController,
  logOutController,
  refreshTokenController,
  updatePasswordController,
  getCurrentUserController,
  updateAccountDetailsController,
  updateAvatarController,
  updateCoverImageController,
};
