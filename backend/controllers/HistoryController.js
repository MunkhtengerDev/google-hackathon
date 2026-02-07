const mongoose = require("mongoose");
const History = require("../models/History");

exports.getHistoryByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!userId) {
      console.error("Error: User ID is required.");
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    let objectUserId;
    try {
      objectUserId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID format.",
      });
    }

    console.log("Fetching history for userId:", userId);
    console.log("Pagination - Page:", page, "Limit:", limit, "Skip:", skip);
    console.log("Sorting by latest date first");

    // Fetch history entries (latest first)
    const historyEntries = await History.aggregate([
      { $match: { userId: objectUserId } },
      // If your documents have a specific date field (e.g., "date" or "takenAt"),
      // it will sort by that first; otherwise it falls back to createdAt.
      { $sort: { date: -1, takenAt: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    console.log("History entries fetched:", historyEntries.length);

    // Fetch total count for pagination
    const totalCount = await History.countDocuments({
      userId: objectUserId,
    });
    console.log("Total history count:", totalCount);

    res.status(200).json({
      success: true,
      data: historyEntries,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching history:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.deleteHistoryById = async (req, res) => {
  try {
    const { historyId } = req.params;

    if (!historyId) {
      console.error("Error: History ID is required.");
      return res.status(400).json({
        success: false,
        message: "History ID is required.",
      });
    }

    let objectHistoryId;
    try {
      objectHistoryId = new mongoose.Types.ObjectId(historyId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid History ID format.",
      });
    }

    console.log("Deleting history entry with ID:", historyId);

    // Delete the history entry
    const deletedHistory = await History.findByIdAndDelete(objectHistoryId);

    if (!deletedHistory) {
      console.error("Error: History entry not found.");
      return res.status(404).json({
        success: false,
        message: "History entry not found.",
      });
    }

    console.log("History entry deleted successfully:", deletedHistory);

    res.status(200).json({
      success: true,
      message: "History entry deleted successfully.",
      data: deletedHistory,
    });
  } catch (err) {
    console.error("Error deleting history entry:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
