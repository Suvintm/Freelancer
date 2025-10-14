import mongoose from "mongoose";

// const reviewSchema = new mongoose.Schema(
//   {
//     client: { type: String, required: true },
//     rating: { type: Number, required: true },
//     comment: { type: String, required: true },
//   },
//   { _id: false }
// );

// const experienceSchema = new mongoose.Schema(
//   {
//     role: { type: String, default: "Add your role here" },
//     company: { type: String, default: "Add your company here" },
//     duration: { type: String, default: "Add duration here" },
//     description: { type: String, default: "Add description here" },
//   },
//   { _id: false }
// );

// const educationSchema = new mongoose.Schema(
//   {
//     degree: { type: String, default: "Add your degree here" },
//     school: { type: String, default: "Add your school/college here" },
//     year: { type: String, default: "Add year here" },
//   },
//   { _id: false }
// );

// const certificationSchema = new mongoose.Schema(
//   {
//     title: { type: String, default: "Add certification title here" },
//     year: { type: String, default: "Add certification year here" },
//   },
//   { _id: false }
// );

// const portfolioSchema = new mongoose.Schema(
//   {
//     title: { type: String, default: "Add project title here" },
//     image: {
//       type: String,
//       default: "https://via.placeholder.com/150?text=Portfolio",
//     }, // placeholder image
//   },
//   { _id: false }
// );

// const gigSchema = new mongoose.Schema(
//   {
//     title: { type: String, default: "Add gig title here" },
//     price: { type: Number, default: 0 },
//     image: {
//       type: String,
//       default: "https://via.placeholder.com/150?text=Gig",
//     }, // placeholder gig image
//     description: { type: String, default: "Add gig description here" },
//   },
//   { _id: false }
// );

// const editorProfileSchema = new mongoose.Schema(
//   {
//     // Required fields with defaults
//     title: { type: String, default: "Add your professional title here" },
//     location: { type: String, default: "Add your location here" },
//     about: { type: String, default: "Write something about yourself here" },
//     skills: {
//       type: [String],
//       default: ["Add your skills here"],
//     },
//     languages: {
//       type: [String],
//       default: ["Add languages here"],
//     },
//     hourlyRate: { type: Number, default: 0 },
//     projectRate: { type: Number, default: 0 },

//     // Optional fields with placeholder defaults
//     certifications: { type: [certificationSchema], default: [] },
//     portfolio: { type: [portfolioSchema], default: [] },
//     gigs: { type: [gigSchema], default: [] },
//     experience: { type: [experienceSchema], default: [] },
//     education: { type: [educationSchema], default: [] },
//     phone: { type: String, default: "Add phone number here" },

//     // System-managed fields
//     rating: { type: Number, default: 0 },
//     topRated: { type: Boolean, default: false },
//     verified: { type: Boolean, default: false },
//     reviews: { type: [reviewSchema], default: [] },
//   },
//   { _id: false }
// );

// const clientProfileSchema = new mongoose.Schema(
//   {
//     companyName: { type: String, default: "Add company name here" },
//     pastOrders: { type: [mongoose.Schema.Types.ObjectId], default: [] }, // order references
//   },
//   { _id: false }
// );

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
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
