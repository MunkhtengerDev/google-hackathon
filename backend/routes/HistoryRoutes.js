const express = require("express");
const router = express.Router();
const { getHistoryByUserId, deleteHistoryById } = require("../controllers/HistoryController");

// Route to get history by user ID
router.get("/:userId", getHistoryByUserId);
router.delete("/:historyId", deleteHistoryById );


module.exports = router;