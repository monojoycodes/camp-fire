import { ApiError } from "../utils/api-error";
import { jwt } from "jsonwebtoken";
import { asyncHandler } from "../utils/async-handler";
import User from "../models/user.model.js";

const verifyJWT = (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Unauthorized request! Either you are not logged in or are unauthorized");

    try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
    next();

  } catch (error) {
    throw new ApiError(401, "Invalid access token");
  }

}

export {verifyJWT};
