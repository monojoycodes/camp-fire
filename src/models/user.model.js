import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto";

const schema = Schema();

const userSchema = new Schema(
    {
        avatar: {
            type: {
                url: String,
                localPath: String
            },
            default: {
                url: `https://placehold.co/200?text=User&font=raleway`,
                localPath: ""
            }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    fullName: {
        type: String,
        required: true,
        default: "Superhero",
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    //set up tokens
    refreshToken: {
        type: String
    },
    forgotPassword: {
        type: String
    },
    forgotPasswordExpiry: {
        type: Date
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationExpiry: {
        type: String
    }
})

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.isPasswordCorrect = async function(password) {
  if (!this.password) return false;
  // Coerce both values to strings to avoid bcrypt "data and hash must be strings" errors
  const plain = typeof password === 'string' ? password : String(password);
  const hash = typeof this.password === 'string' ? this.password : String(this.password);
  return await bcrypt.compare(plain, hash);
}

//let us generate tokens!
// JWT : jwt.sign(payload, secret, expiry)

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      _id: this.id,
      email: this.email,
      username: this.username,
    }, 
    process.env.ACCESS_TOKEN_SECRET, 
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
      _id: this.id,
      email: this.email,
      username: this.username,
    }, 
    process.env.REFRESH_TOKEN_SECRET, 
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateTemporaryToken = function() {
    const unHashedToken = crypto.randomBytes(20).toString("hex")

    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex")

    const tokenExpiry = Date.now() + (20*60*1000) //20 mins
    return {unHashedToken, hashedToken, tokenExpiry}
}


export default mongoose.model('User', userSchema);