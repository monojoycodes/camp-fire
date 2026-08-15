import User from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
    emailVerificationTemplate,
    passwordResetEmailTemplate,
    sendEmail,
} from "../utils/mail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const getBaseUrl = (req) => {
    const forwardedProto = req.headers["x-forwarded-proto"];
    const protocol = forwardedProto ? forwardedProto.split(",")[0].trim() : req.protocol;
    const host = req.get("x-forwarded-host") || req.get("host");

    return `${protocol}://${host}`;
};

//options for cookies:
const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

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
    const {email, username, fullName, password} = req.body;

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
        fullName,
        isEmailVerified: false
    });

    const {unHashedToken, hashedToken, tokenExpiry} = newUser.generateTemporaryToken();
    newUser.emailVerificationToken = hashedToken;
    newUser.emailVerificationExpiry = tokenExpiry;

    await newUser.save({ validateBeforeSave: false });

    const verifyUrl = `${getBaseUrl(req)}/verify-email?token=${unHashedToken}`;

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

//Login the user
const login = asyncHandler( async (req, res) => {
    const { email, username, password } = req.body;

    if (!email && !username) throw new ApiError(400, "Email or username required!");
    if (!password) throw new ApiError(400, "Password required!");

    const searchUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (!searchUser) throw new ApiError(400, "User does not exist! Register before logging in.");

    const isPasswordValid = await searchUser.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(400, "Invalid Password. Forgot? Try resetting it.");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(searchUser._id);

    const loggedInUser = await User.findById(searchUser._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );


    return res.status(200)
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
                "User logged in successfully",
            )
        );
})

//logout the user
const logout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: "",
            },
        },
        {
            new: true,
        },
    );

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, { user: req.user }, "User logged out successfully!")
        );
});

const currentUser = asyncHandler( async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, { user: req.user }, "User fetched successfully")
        );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const verificationToken = req.query?.token; // token from verify-email link

    if (!verificationToken) {
        throw new ApiError(400, "No Verification token found!");
    }

    let verificationToken_hashed = crypto
                                    .createHash("sha256")
                                    .update(verificationToken)
                                    .digest("hex")


    const verifiedUser = await User.findOne({
        emailVerificationToken: verificationToken_hashed,
        emailVerificationExpiry: {$gt: Date.now()}
    });

    if (!verifiedUser) throw new ApiError(404, "email verification token is invalid or expired");

    verifiedUser.isEmailVerified = true;
    verifiedUser.emailVerificationToken = undefined;
    verifiedUser.emailVerificationExpiry = undefined;

    await verifiedUser.save({validateBeforeSave:false});

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Email verified successfully")
        )
});

const resendVerifyEmail = asyncHandler( async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User does not exist");

    if (user.isEmailVerified) throw new ApiError(409, "User is already verified");

    const {unHashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${getBaseUrl(req)}/verify-email?token=${unHashedToken}`;

    await sendEmail(
        user.email,
        "Verify your email address",
        emailVerificationTemplate(user.username, verifyUrl)
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Email verification link sent to email"))

} )

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    user.forgotPassword = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${getBaseUrl(req)}/reset-password?token=${unHashedToken}`;

    await sendEmail(
        user.email,
        "Reset your password",
        passwordResetEmailTemplate(user.username, resetUrl),
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset email sent"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        throw new ApiError(400, "Token and new password are required");
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        forgotPassword: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = newPassword;
    user.forgotPassword = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request: refresh token missing");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decodedToken?._id);
    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or already used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access token refreshed successfully",
            ),
        );
});



export { register, 
        generateAccessAndRefreshToken,
        login,
        logout,
        currentUser,
        verifyEmail,
        resendVerifyEmail,
        changePassword,
        requestPasswordReset,
        resetPassword,
        refreshAccessToken }