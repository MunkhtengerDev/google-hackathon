const express = require("express");
const {
  generateTripPlan,
  getLatestTripPlan,
  getTripDashboardData,
} = require("../controllers/TripPlanningController");

const tripPlanningRouter = express.Router();

tripPlanningRouter.get("/dashboard", getTripDashboardData);
tripPlanningRouter.get("/latest", getLatestTripPlan);
tripPlanningRouter.post("/generate", generateTripPlan);

module.exports = tripPlanningRouter;
