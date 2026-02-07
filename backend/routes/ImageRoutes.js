const express = require("express");
const {
  fetchImageDataAndGenerateContentStream,
} = require("../controllers/ImageController");

const imageRouter = express.Router();

// Route to handle image-based content generation
imageRouter.post("/", fetchImageDataAndGenerateContentStream);

module.exports = imageRouter;
