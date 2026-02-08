const express = require("express");
const {
  generateTripPlan,
  getLatestTripPlan,
  getTripDashboardData,
  getGuideCompanion,
} = require("../controllers/TripPlanningController");

const tripPlanningRouter = express.Router();

tripPlanningRouter.get("/dashboard", getTripDashboardData);
tripPlanningRouter.get("/guide-companion", getGuideCompanion);
tripPlanningRouter.get("/latest", getLatestTripPlan);
tripPlanningRouter.post("/generate", generateTripPlan);

module.exports = tripPlanningRouter;
