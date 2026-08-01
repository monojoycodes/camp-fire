import dotenv from 'dotenv';
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT;

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Database connected successfully.');
    app.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// app.listen(PORT, () => {
//       console.log(`Server running on port http://localhost:${PORT}`);
//     });

