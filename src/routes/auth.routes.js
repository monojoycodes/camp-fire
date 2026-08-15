import { Router } from "express";
import {
	login,
	register,
	logout,
	currentUser,
	verifyEmail,
	resendVerifyEmail,
	changePassword,
	requestPasswordReset,
	resetPassword,
	refreshAccessToken,
} from "../controllers/auth.controller.js";
import { userRegisterValidator, userLoginValidator } from "../validators/index.js"
import {validate} from "../middlewares/validator.middlewares.js";
import {ApiError} from "../utils/api-error.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const router = Router();

//syntax: (validator(), middleware, method) ->
// Q) why is validator method called and midle method is simply passed as a reference?
router.post("/register", userRegisterValidator(), validate, register);

router.post("/login",userLoginValidator(), validate, login);

router.post("/logout", verifyJWT, logout);

router.get("/current-user", verifyJWT, currentUser);

router.get("/verify-email", verifyEmail);

router.post("/resend-verify-email", verifyJWT, resendVerifyEmail);

router.post("/change-password", verifyJWT, changePassword);

router.post("/forgot-password", requestPasswordReset);

router.post("/reset-password", resetPassword);

router.post("/refresh-token", refreshAccessToken);

export default router;