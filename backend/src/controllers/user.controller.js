import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import crypto from "node:crypto";

// =========================
// LOGIN CONTROLLER
// =========================
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Please provide both username and password.",
    });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Incorrect password." });
    }

    // ✅ Generate a random token using crypto
    const token = crypto.randomBytes(20).toString("hex");

    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong during login.",
    });
  }
};

// =========================
// REGISTER CONTROLLER
// =========================
const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(httpStatus.CREATED).json({ message: "User registered." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong during registration.",
    });
  }
};

// GET USER HISTORY
const getUserHistory = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(httpStatus.UNAUTHORIZED).json({ message: "Missing or invalid token" });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
    }

    const meetings = await Meeting.find({ user_id: user.username });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: `Something went wrong`, error: error.toString() });
  }
};

// ADD TO HISTORY
const addToHistory = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    const { meeting_code } = req.body;

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ message: "User not found with token" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();

    res.status(201).json({ message: "Added code to history" });
  } catch (e) {
    console.error("Add to history error:", e);
    res.status(500).json({ message: `Something went wrong: ${e.message}` });
  }
};


export { login, register, getUserHistory, addToHistory };
