import mongoose from "mongoose";

const connectDB = (URI) => {
    // Return the mongoose.connect promise so callers can chain .then/.catch
    return mongoose.connect(URI).then(() => {
        console.log("✅ MongoDB connected!");
    });
}

export default connectDB;