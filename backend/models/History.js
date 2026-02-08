const mongoose = require("mongoose");
const moment = require("moment");

const Schema = mongoose.Schema;

const HistorySchema = new Schema({
  userId: [
    {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
  ],
  guestId: { type: String },
  image: { type: String },
  title: { type: String },
  detail: { type: String },
  dayLabel: { type: String },
  tags: [{ type: String }],
  source: { type: String, default: "app" },
  driveFileId: { type: String },
  driveWebViewLink: { type: String },
  driveDownloadLink: { type: String },
  driveThumbnailLink: { type: String },
  drivePublicImageUrl: { type: String },
  createdAt: {
    type: String,
    default: () => moment().format("MMMM Do YYYY, h:mm:ss a"),
  },
});

const History = mongoose.model("history", HistorySchema);

module.exports = History;
