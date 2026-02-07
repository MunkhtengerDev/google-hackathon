const express = require("express");
const cors = require("cors");
const app = express();

const userRouter = require("./routes/UserRoutes");
const imageRouter = require("./routes/ImageRoutes");
const historyRoutes = require("./routes/HistoryRoutes");
const preferenceRouter = require("./routes/PreferencesRoutes");
const tripPlanningRouter = require("./routes/TripPlanningRoutes");

const connect = require("./database");

require("dotenv").config();
const port = process.env.PORT;

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/images", imageRouter);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/preferences", preferenceRouter);
app.use("/api/v1/trip-planning", tripPlanningRouter);

// Connect to the database
connect();

// Start the server
app.listen(port, () => {
  console.log(`server listening on ${port}`);
});
