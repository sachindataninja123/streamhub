import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import Subscription from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID!");
  }

  if (channelId.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself!");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found!");
  }

  const subscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (subscription) {
    await Subscription.findByIdAndDelete(subscription._id);
  } else {
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        subscription ? "Unsubscribed successfully!" : "Subscribed successfully!"
      )
    );
});

const getSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID!");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found!");
  }

  const subscribers = await Subscription.aggregate([
    // match all subscriptions where channel === channelId
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },

    // get subscriber details
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: { username: 1, avatar: 1 },
          },
        ],
      },
    },

    // flatten subscriber array
    {
      $addFields: {
        subscriber: { $first: "$subscriber" },

        // check if current user is subscribed back to this subscriber
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscriber._id"],
            },
            then: true,
            else: false,
          },
        },
      },
    },

    {
      $project: {
        subscriber: 1,
        isSubscribed: 1,
        createdAt: 1,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribers,
        totalSubscribers: subscribers.length,
      },
      subscribers.length === 0
        ? "No subscribers yet!"
        : "Subscribers fetched successfully!"
    )
  );
});

export { toggleSubscription, getSubscribers };
