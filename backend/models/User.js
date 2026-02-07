const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: { type: String },
    email: { type: String },
    phoneNumber: { type: Number },
    password: { type: String },
    profilePic: { type: String },
    bio: { type: String },
    gender: { type: String },
    score: { type: Number },
    leaderboard: { type: Number },
  },
  { timestamps: true }
);

const Users = mongoose.model("users", UserSchema);

module.exports = Users;
