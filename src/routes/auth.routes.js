import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { userRegisterValidator, userLoginValidator } from "../validators/index.js"
import {validate} from "../middlewares/validator.middlewares.js";
import {ApiError} from "../utils/api-error.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { logout } from "../controllers/auth.controller.js";


const router = Router();

//syntax: (validator(), middleware, method) ->
// Q) why is validator method called and midle method is simply passed as a reference?
router.post("/register", userRegisterValidator(), validate, register);

router.post("/login",userLoginValidator(), validate, login);

router.post("/logout", verifyJWT, logout);

export default router;