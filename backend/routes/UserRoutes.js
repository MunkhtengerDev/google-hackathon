const express = require("express");
const {
  getUsers,
  googleAuth,
  getUserProfile,
} = require("../controllers/UserController");

const userRouter = express.Router();

userRouter
  .get("/", getUsers)
  .post("/google", googleAuth)
  .get("/profile", getUserProfile);

module.exports = userRouter;
