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

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

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

export {register, 
        generateAccessAndRefreshToken,
        login}