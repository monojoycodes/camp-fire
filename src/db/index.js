import mongoose from "mongoose";

const connectDB = (URI) => {
    try {
        mongoose.connect(URI);
        console.log("✅ MongoDB connected!");
    } catch (err) {
        console.log("MONGODB connection ERROR!! - ", err);
        process.exit(1);
    }
}

export default connectDB;