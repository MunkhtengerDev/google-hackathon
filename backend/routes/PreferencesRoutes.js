const express = require("express");
const {
  getPreferences,
  savePreferences,
  updatePreference,
  deletePreferences,
} = require("../controllers/PreferencesController");

const preferenceRouter = express.Router();

preferenceRouter.get("/", getPreferences);
preferenceRouter.post("/", savePreferences);
preferenceRouter.patch("/", updatePreference);
preferenceRouter.delete("/", deletePreferences);

module.exports = preferenceRouter;
