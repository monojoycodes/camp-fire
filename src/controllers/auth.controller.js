import User from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { emailVerificationTemplate, sendEmail } from "../utils/mail.js";

// Generate Tokens
const generateAccessAndRefreshToken = async (userId) => {

    try {
        const currUser = await User.findById(userId);
        const accessToken = currUser.generateAccessToken();
        const refreshToken = currUser.generateRefreshToken();

        currUser.refreshToken = refreshToken;
        await currUser.save({validateBeforeSave:false});

        return {accessToken, refreshToken};
    } catch (err) {
        throw new ApiError(500, "Error while generating access token!");
    }

}

// Register a user:
const register = asyncHandler( async (req, res) => {
    const {email, username, password} = req.body;

    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    });

    if (existingUser) {
        throw new ApiError(403, "User with username or email already exists! Try Logging in...", []);
    }

    const newUser = await User.create({
        email,
        username,
        password,
        isEmailVerified: false
    });

    const {unHashedToken, hashedToken, tokenExpiry} = newUser.generateTemporaryToken();
    newUser.emailVerificationToken = hashedToken;
    newUser.emailVerificationExpiry = tokenExpiry;

    await newUser.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${unHashedToken}`;

    await sendEmail(
        newUser.email,
        "Verify your email address",
        emailVerificationTemplate(newUser.username, verifyUrl)
    );

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPassword -forgotPasswordExpiry"
    );

    if (!createdUser) throw new ApiError(501, "something went wrong while creating the user");

    
    return res.status(201).json(
        new ApiResponse(201, {
            user: createdUser
        }, "Verification email sent")
    );
})

export {register, generateAccessAndRefreshToken}