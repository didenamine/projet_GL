import mongoose from "mongoose";

const { Schema, model } = mongoose;

const UserStorySchema = new Schema(
  {
    storyName: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    priority: {
      type: String,
      required: true,
      enum: ["highest", "high", "medium", "low", "lowest"],
      default: "medium",
    },
    storyPointEstimate: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    sprintId: { type: Schema.Types.ObjectId, ref: "Sprint", required: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

UserStorySchema.index(
  { priority: 1, deletedAt: 1 },
  {
    partialFilterExpression: { deletedAt: { $eq: null } },
    background: true,
  },
);

UserStorySchema.index({ storyName: 1, sprintId: 1 }, { unique: true });

function toISODateString(date) {
  if (!date) return "null";
  return date.toISOString().split("T")[0];
}

function validateRequiredDates(startDate, dueDate) {
  if (!startDate || !dueDate) {
    throw new Error(
      "[OCL][pre] startDate and dueDate are required for UserStory creation",
    );
  }
}

function validateStoryNameNotEmpty(storyName) {
  if (!storyName || storyName.trim() === "") {
    throw new Error("[OCL][pre] storyName cannot be empty");
  }
}

function validateSprintIdExists(sprintId) {
  if (!sprintId) {
    throw new Error("[OCL][pre] sprintId is required for UserStory");
  }
}

function validateDueDateAfterStartDate(startDate, dueDate) {
  const start = new Date(startDate);
  const due = new Date(dueDate);

  if (due <= start) {
    throw new Error(
      `[OCL][inv] dueDate must be strictly after startDate: ` +
        `${toISODateString(start)} -> ${toISODateString(due)}`,
    );
  }
}

function validateFibonacciStoryPoints(storyPointEstimate) {
  const fibonacci = [1, 2, 3, 5, 8, 13];

  if (
    storyPointEstimate !== undefined &&
    !fibonacci.includes(storyPointEstimate)
  ) {
    throw new Error(
      "[OCL][inv] storyPointEstimate must be a Fibonacci value: " +
        fibonacci.join(", "),
    );
  }
}

async function validateStoryWithinSprint(userStory) {
  if (!userStory.sprintId) return;

  const Sprint = mongoose.model("Sprint");
  const sprint = await Sprint.findById(userStory.sprintId);

  if (!sprint) {
    throw new Error(
      `[OCL][inv] Sprint not found for UserStory: ${userStory.sprintId}`,
    );
  }

  const startDate = new Date(userStory.startDate);
  const sprintStartDate = new Date(sprint.startDate);
  const dueDate = new Date(userStory.dueDate);
  const sprintEndDate = new Date(sprint.endDate);

  if (startDate < sprintStartDate) {
    throw new Error(
      `[OCL][inv] UserStory startDate (${toISODateString(startDate)}) ` +
        `must be >= Sprint startDate (${toISODateString(sprintStartDate)})`,
    );
  }

  if (dueDate > sprintEndDate) {
    throw new Error(
      `[OCL][inv] UserStory dueDate (${toISODateString(dueDate)}) ` +
        `must be <= Sprint endDate (${toISODateString(sprintEndDate)})`,
    );
  }
}

function validatePriority(priority) {
  const validPriorities = ["highest", "high", "medium", "low", "lowest"];
  if (!validPriorities.includes(priority)) {
    throw new Error(
      "[OCL][inv] priority must be one of: " + validPriorities.join(", "),
    );
  }
}

function validatePostConditionAfterCreate(savedUserStory) {
  const startDate = new Date(savedUserStory.startDate);
  const dueDate = new Date(savedUserStory.dueDate);

  if (dueDate <= startDate) {
    throw new Error(
      `[OCL][post] After creation: dueDate must be strictly after startDate. ` +
        `Got: start=${toISODateString(startDate)}, due=${toISODateString(dueDate)}`,
    );
  }
}

function validatePostConditionFibonacci(savedUserStory) {
  const fibonacci = [1, 2, 3, 5, 8, 13];
  const estimate = savedUserStory.storyPointEstimate;

  if (estimate !== undefined && !fibonacci.includes(estimate)) {
    throw new Error(
      `[OCL][post] After creation: storyPointEstimate must be a Fibonacci value. ` +
        `Got: ${estimate}`,
    );
  }
}

UserStorySchema.pre("save", async function (next) {
  try {
    validateDueDateAfterStartDate(this.startDate, this.dueDate);

    validateFibonacciStoryPoints(this.storyPointEstimate);

    await validateStoryWithinSprint(this);

    validatePriority(this.priority);

    next();
  } catch (error) {
    next(error);
  }
});

UserStorySchema.statics.createWithOCL = async function (userStoryData) {
  validateStoryNameNotEmpty(userStoryData.storyName);
  validateRequiredDates(userStoryData.startDate, userStoryData.dueDate);
  validateSprintIdExists(userStoryData.sprintId);

  const userStory = new this(userStoryData);
  const savedUserStory = await userStory.save();

  validatePostConditionAfterCreate(savedUserStory);
  validatePostConditionFibonacci(savedUserStory);

  return savedUserStory;
};

export default model("UserStory", UserStorySchema);
