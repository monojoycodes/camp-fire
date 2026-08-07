import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthCheckRouter from "./routes/healthcheck.routes.js"

const app = express();

// If you forget this line or place it after your route definitions, req.body will be undefined. If you try to destructure const { email, password } = req.body; in your /register route without this middleware, your server will throw a TypeError and crash. It must always be placed before your routes.

//setup express to be able to make POST requests
app.use(express.json( {limit:"16kb"} )); //will accept payload upto 16KB.
app.use(express.urlencoded( {extended:true, limit:"16kb"} )); //will encode url spaces (say, to %20,..) and upto 16KB allowed
app.use(express.static("public")); //will be used to make this part of api publically usable

app.use(cookieParser())

//cors configuration
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000", //which frontend can access this backend. 
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Authorization", "Content-Type"]
    }
))


app.use("/api/v1/healthcheck", healthCheckRouter)


export default app;
