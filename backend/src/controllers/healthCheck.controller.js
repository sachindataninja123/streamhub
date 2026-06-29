import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const healthCheckController = asyncHandler((req, res) => {
  res.status(200).json(new ApiResponse(200, "Server connected"));
});

export { healthCheckController };
