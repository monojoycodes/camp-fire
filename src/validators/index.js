import { body } from "express-validator";

const userRegisterValidator = () => { //returns the errors array which is used in the validator.middlewares.js
  return [ 
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be in lower case")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password").trim().notEmpty().withMessage("Password is required"),
    body("fullName").optional().trim(),
  ];
};

const userLoginValidator = ()=> {
    return [
    body().custom((_, { req }) => {
      if (!req.body.email && !req.body.username) {
        throw new Error("Email or username is required");
      }
      return true;
    }),

    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Email is invalid!"),

    body("username")
      .optional()
      .trim()
      .isLowercase()
      .withMessage("Username must be in lower case")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),

        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required")

    ]
}

export { userRegisterValidator, userLoginValidator };