const express = require("express");
const router = express.Router();
const {
  getHistoryByUserId,
  deleteHistoryById,
  getMemories,
  createMemory,
} = require("../controllers/HistoryController");

// Route to get history by user ID
router.get("/memories", getMemories);
router.post("/memories", createMemory);
router.get("/:userId", getHistoryByUserId);
router.delete("/:historyId", deleteHistoryById );


module.exports = router;
