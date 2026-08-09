import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { userRegisterValidator, userLoginValidator } from "../validators/index.js"
import  {validate} from "../middlewares/validator.middlewares.js";
import {ApiError} from "../utils/api-error.js"


const router = Router();

//syntax: (validator(), middleware, method) ->
// Q) why is validator method called and midle method is simply passed as a reference?
router.post("/register", userRegisterValidator(), validate, register);

router.post("/login",userLoginValidator(), validate, login);

export default router;