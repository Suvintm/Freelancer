import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["editor", "client"], required: true },
    profileCompleted: { type: Boolean, default: false },

    profilePicture: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },

    editorProfile: {
      about: String,
      skills: [String],
      certifications: [String],
      portfolio: [String],
      rating: { type: Number, default: 0 },
    },

    clientProfile: {
      companyName: String,
      pastOrders: [mongoose.Schema.Types.ObjectId],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
