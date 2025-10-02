import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    client: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    role: String,
    company: String,
    duration: String,
    description: String,
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    degree: String,
    school: String,
    year: String,
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    title: String,
    year: String,
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    title: String,
    image: String, // URL to image/video
  },
  { _id: false }
);

const gigSchema = new mongoose.Schema(
  {
    title: String,
    price: Number,
    image: String, // URL
    description: String,
  },
  { _id: false }
);

const editorProfileSchema = new mongoose.Schema(
  {
    title: String,
    location: String,
    about: String,
    skills: [String],
    languages: [String],
    certifications: [certificationSchema],
    portfolio: [portfolioSchema],
    gigs: [gigSchema],
    experience: [experienceSchema],
    education: [educationSchema],
    rating: { type: Number, default: 0 },
    topRated: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    hourlyRate: { type: Number, default: 0 },
    projectRate: { type: Number, default: 0 }, // new field
    phone: String, // new field
    reviews: [reviewSchema],
  },
  { _id: false }
);



const clientProfileSchema = new mongoose.Schema(
  {
    companyName: String,
    pastOrders: [mongoose.Schema.Types.ObjectId], // order references
  },
  { _id: false }
);

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
    editorProfile: editorProfileSchema,
    clientProfile: clientProfileSchema,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
