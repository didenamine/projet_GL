import mongoose from "mongoose"
import { TASK_STATUS_VALUES } from "../../../states/taskStatuses.js"

const { Schema, model } = mongoose

const taskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: TASK_STATUS_VALUES,
    required: true
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  },
  userStoryId: { type: Schema.Types.ObjectId, ref: "UserStory", required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true })

taskSchema.index({ title: 1, userStoryId: 1 })

export default model("Task", taskSchema)
