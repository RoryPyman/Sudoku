import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    /** Hashed refresh tokens — max 5, oldest pruned on overflow */
    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

/** Return a safe public view — never expose passwordHash or refreshTokens */
userSchema.methods.toPublicJSON = function () {
  return {
    id:        this._id.toString(),
    username:  this.username,
    email:     this.email,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
