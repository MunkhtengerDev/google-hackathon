const express = require("express");
const {
  generateTripPlan,
  getLatestTripPlan,
} = require("../controllers/TripPlanningController");

const tripPlanningRouter = express.Router();

tripPlanningRouter.get("/latest", getLatestTripPlan);
tripPlanningRouter.post("/generate", generateTripPlan);

module.exports = tripPlanningRouter;
