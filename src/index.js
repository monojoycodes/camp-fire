import dotenv from 'dotenv';
dotenv.config();

import app from "./app.js";
import connectDB from './db/index.js';

const PORT = process.env.PORT;

const MONGODB_URI = process.env.MONGODB_URI;

connectDB(MONGODB_URI)
  .then( ()=>{
      app.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}`);
     });
  } )
  .catch(
        (error) => {
            console.log("MongoDB connection error: ", error);
            process.exit(1);
        }
    )



