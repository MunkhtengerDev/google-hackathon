const Users = require("../models/User.js");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const JWT_EXPIRES_IN = "14d";

const signToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    const err = new Error("JWT_SECRET is not set");
    err.statusCode = 500;
    throw err;
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

exports.googleAuth = async (req, res) => {
  console.log("googleAuth called");

  try {
    const { idToken, code, redirectUri } = req.body;

    // Handle ID Token flow (mobile apps)
    if (idToken) {
      console.log("Using ID token flow...");

      const client = new OAuth2Client();

      const ticket = await client.verifyIdToken({
        idToken,
        audience: [process.env.GOOGLE_CLIENT_ID].filter(Boolean),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ message: "Invalid ID token" });
      }

      const email = (payload.email || "").toLowerCase();
      const username = payload.name || email.split("@")[0];
      const emailVerified = payload.email_verified;

      if (!email || !emailVerified) {
        return res
          .status(401)
          .json({ message: "Email not verified by Google" });
      }

      // Find or create user
      let user = await Users.findOne({ email });
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        user = await Users.create({
          email,
          username,
          googleId: payload.sub,
          password: null,
        });
      }

      // Generate JWT
      const token = signToken({ id: user._id, email: user.email });

      console.log(
        "Google auth successful for:",
        email,
        "isNewUser:",
        isNewUser
      );

      return res.json({
        token,
        isNewUser,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        },
      });
    }

    // Handle authorization code flow (web) - keep existing logic
    if (code) {
      console.log("Using authorization code flow...");
      console.log("code received:", code.substring(0, 20) + "...");
      console.log("redirectUri received:", redirectUri);

      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      let tokens;
      try {
        const tokenResponse = await oauth2Client.getToken(code);
        tokens = tokenResponse.tokens;
      } catch (tokenError) {
        console.error("Token exchange error:", tokenError.message);
        return res
          .status(401)
          .json({ message: "Failed to exchange code for tokens" });
      }

      const idTokenFromCode = tokens.id_token;
      if (!idTokenFromCode) {
        return res
          .status(401)
          .json({ message: "No ID token received from Google" });
      }

      const verifyClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      const ticket = await verifyClient.verifyIdToken({
        idToken: idTokenFromCode,
        audience: [process.env.GOOGLE_CLIENT_ID].filter(Boolean),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ message: "Invalid ID token" });
      }

      const email = (payload.email || "").toLowerCase();
      const username = payload.name || email.split("@")[0];
      const emailVerified = payload.email_verified;

      if (!email || !emailVerified) {
        return res
          .status(401)
          .json({ message: "Email not verified by Google" });
      }

      let user = await Users.findOne({ email });
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        user = await Users.create({
          email,
          username,
          googleId: payload.sub,
          password: null,
        });
      }

      const token = signToken({ id: user._id, email: user.email });

      console.log(
        "Google auth successful for:",
        email,
        "isNewUser:",
        isNewUser
      );

      return res.json({
        token,
        isNewUser,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        },
      });
    }

    return res.status(400).json({ message: "No idToken or code provided" });
  } catch (e) {
    console.error("googleAuth error:", e.message);
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

exports.getUsers = async (request, response) => {
  const users = await Users.find();
  response.status(200).json({
    message: "success",
    data: users,
  });
};

exports.getUserProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log(
      "token received:",
      token ? token.substring(0, 10) + "..." : "none"
    );

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Users.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      name: user.username,
      email: user.email,
      createdAt: user.createdAt,
      profilePicture: user.profilePic || user.profilePicture || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
