const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const History = require("../models/History");

const normalizeText = (value = "") => String(value || "").trim();
const normalizeTags = (value) =>
  Array.isArray(value)
    ? value.map((item) => normalizeText(item)).filter(Boolean).slice(0, 12)
    : [];

const getAuthUserId = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    const err = new Error("No token provided");
    err.statusCode = 401;
    throw err;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded?.id) {
    const err = new Error("Invalid token");
    err.statusCode = 401;
    throw err;
  }

  return decoded.id;
};

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

exports.getMemories = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const limitRaw = Number(req.query.limit || 60);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(120, limitRaw))
      : 60;

    const memories = await History.find({
      userId,
      driveFileId: { $exists: true, $ne: "" },
    })
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      data: memories,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to fetch memories",
    });
  }
};

exports.createMemory = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    const title = normalizeText(req.body?.title) || "Trip Memory";
    const detail = normalizeText(req.body?.detail);
    const dayLabel = normalizeText(req.body?.dayLabel);
    const image = normalizeText(req.body?.image);
    const driveFileId = normalizeText(req.body?.driveFileId);
    const driveWebViewLink = normalizeText(req.body?.driveWebViewLink);
    const driveDownloadLink = normalizeText(req.body?.driveDownloadLink);
    const driveThumbnailLink = normalizeText(req.body?.driveThumbnailLink);
    const drivePublicImageUrl = normalizeText(req.body?.drivePublicImageUrl);
    const tags = normalizeTags(req.body?.tags);

    if (!driveFileId) {
      return res.status(400).json({
        success: false,
        message: "driveFileId is required.",
      });
    }

    const created = await History.create({
      userId: [userId],
      title,
      detail,
      dayLabel,
      tags,
      source: "google-drive",
      image: image || drivePublicImageUrl || driveThumbnailLink,
      driveFileId,
      driveWebViewLink,
      driveDownloadLink,
      driveThumbnailLink,
      drivePublicImageUrl,
    });

    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to create memory entry",
    });
  }
};
