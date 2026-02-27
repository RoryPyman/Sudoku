import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]{3,20}$/,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
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
    refreshTokens: {
      type: [String],
      default: [],
    },
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    friendRequestsSent: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    friendRequestsReceived: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  { timestamps: true },
);

userSchema.index({ username: 1 });
userSchema.index({ firstName: 1, lastName: 1 });

userSchema.methods.toPublicJSON = function () {
  return {
    id:        this._id.toString(),
    username:  this.username,
    firstName: this.firstName,
    lastName:  this.lastName,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
