import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserStorySchema = new Schema(
  {
    storyName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
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

// Index pour améliorer les recherches
UserStorySchema.index(
  { priority: 1, deletedAt: 1 },
  {
    partialFilterExpression: { deletedAt: { $eq: null } },
    background: true,
  },
);

// Unicité du nom de la UserStory dans un même sprint
UserStorySchema.index({ storyName: 1, sprintId: 1 }, { unique: true });

// ══════════════════════════════════════════════════════════
// CONTRAINTES OCL — Membre 5
// ══════════════════════════════════════════════════════════

// OCL Invariant 2 : dueDate doit être strictement postérieure à startDate
// context UserStory inv DueDateAfterStartDate:
//   self.dueDate > self.startDate

// OCL Invariant 3 : storyPointEstimate doit être dans la suite de Fibonacci
// context UserStory inv ValidStoryPoints:
//   Set{1,2,3,5,8,13}->includes(self.storyPointEstimate)

UserStorySchema.pre("save", function (next) {
  // Invariant 2 — dueDate > startDate
  if (this.dueDate && this.startDate && this.dueDate <= this.startDate) {
    return next(new Error("[OCL] dueDate must be strictly after startDate"));
  }

  // Invariant 3 — storyPointEstimate ∈ {1,2,3,5,8,13}
  const fibonacci = [1, 2, 3, 5, 8, 13];
  if (
    this.storyPointEstimate !== undefined &&
    !fibonacci.includes(this.storyPointEstimate)
  ) {
    return next(
      new Error(
        "[OCL] storyPointEstimate must be a Fibonacci value: 1, 2, 3, 5, 8, 13",
      ),
    );
  }

  next();
});

// ══════════════════════════════════════════════════════════

export default model("UserStory", UserStorySchema);
