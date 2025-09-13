import mongoose, { Schema } from "mongoose";

// Meeting Schema
const meetingSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true, // ✅ It's safer to require user_id
    },
    meetingCode: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true, // ✅ Optional: Adds createdAt & updatedAt fields
  }
);

// Meeting Model
const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };
