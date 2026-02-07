const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_CONNECTION_STRING = process.env.MONGODB;

mongoose.connect(MONGODB_CONNECTION_STRING);

const connect = async () => {
  try {
    await mongoose.connect(MONGODB_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.once("open", () => {
      console.log("Connected to Mongo");
    });
  } catch (e) {
    console.log("Error connecting to Mongo");
  }
};

module.exports = connect;
