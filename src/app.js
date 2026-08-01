import express from "express";
import healthCheckRouter from "./routes/healthcheck.routes.js"

const app = express();

// If you forget this line or place it after your route definitions, req.body will be undefined. If you try to destructure const { email, password } = req.body; in your /register route without this middleware, your server will throw a TypeError and crash. It must always be placed before your routes.

app.use(express.json());

app.use("/api/v1/healthcheck", healthCheckRouter)

export default app;
