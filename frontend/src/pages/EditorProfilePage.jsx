// src/pages/EditorProfile.jsx
import React from "react";
import {
  FaStar,
  FaCheckCircle,
  FaEnvelope,
  FaUserTie,
  FaArrowCircleRight,
  FaPencilAlt,
  FaPlus,
} from "react-icons/fa";
import profilePic from "../assets/logo.png"; // optional local demo profile image
import portfolio1 from "../assets/logo.png";
import portfolio2 from "../assets/logo.png";
import portfolio3 from "../assets/logo.png";
import gig1 from "../assets/logo.png";
import gig2 from "../assets/logo.png";
import gig3 from "../assets/logo.png";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

const EditorProfile = () => {
  const navigate = useNavigate();

  // Dummy editor data
  const editor = {
    name: "Alice Johnson",
    title: "Professional Video Editor",
    location: "New York, USA",
    avatar: profilePic || "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 4.8,
    topRated: true,
    verified: true,
    hourlyRate: 35,
    about:
      "I am a professional video editor with 5+ years of experience in creating high-quality videos for YouTube, marketing, and corporate purposes. I specialize in Premiere Pro and After Effects.",
    skills: [
      "Video Editing",
      "After Effects",
      "Premiere Pro",
      "Motion Graphics",
    ],
    languages: ["English", "Spanish"],
    education: [
      {
        degree: "Bachelor of Arts in Film Production",
        school: "NYU",
        year: "2015-2019",
      },
    ],
    experience: [
      {
        role: "Freelance Video Editor",
        company: "Self-employed",
        duration: "2019 - Present",
        description:
          "Edited YouTube, corporate, and promotional videos. Specialized in motion graphics and post-production effects.",
      },
    ],
    certifications: [{ title: "Adobe Certified Expert (ACE)", year: "2021" }],
    reviews: [
      {
        client: "John Doe",
        rating: 5,
        comment: "Excellent work! Highly recommended.",
      },
      {
        client: "Mary Smith",
        rating: 4.5,
        comment: "Very professional and quick delivery.",
      },
    ],
    portfolio: [
      { id: 1, title: "Promo Video 2023", image: portfolio1 },
      { id: 2, title: "YouTube Channel Intro", image: portfolio2 },
      { id: 3, title: "Corporate Ad", image: portfolio3 },
    ],
    gigs: [
      { id: 1, title: "YouTube Video Editing", price: 50, image: gig1 },
      { id: 2, title: "Social Media Promo Video", price: 80, image: gig2 },
      { id: 3, title: "Corporate Video Editing", price: 100, image: gig3 },
    ],
    contact: { email: "alice.johnson@example.com", phone: "+1 123-456-7890" },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Navbar */}
      <div className="flex justify-between items-center bg-white mb-4 shadow-md px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            onClick={() => navigate("/editor-home")}
            src={logo}
            alt="SuviX"
            className="w-8 h-8 cursor-pointer"
          />
          <h1 className="text-lg font-bold">My Profile</h1>
        </div>
        <div className="flex gap-2 items-center justify-center">
          Back <FaArrowCircleRight onClick={() => navigate("/editor-home")} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src={editor.avatar}
              alt={editor.name}
              className="w-28 h-28 rounded-full object-cover border-2 border-green-500"
            />
            <div>
              <h1 className="text-2xl font-bold">{editor.name}</h1>
              <p className="text-gray-600">{editor.title}</p>
              <p className="text-gray-500 text-sm">{editor.location}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center text-yellow-500">
                  {editor.rating} <FaStar className="ml-1" />
                </span>
                {editor.topRated && (
                  <span className="text-blue-500 font-semibold">Top Rated</span>
                )}
                {editor.verified && (
                  <FaCheckCircle className="text-green-500" />
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col gap-2">
            <p className="text-xl font-semibold">${editor.hourlyRate}/hr</p>
            <button onClick={() => navigate("/editor-profile-update")} className="px-4 py-2 bg-green-500 text-white flex items-center justify-center gap-2 font-bold rounded-xl hover:bg-green-600">
              Edit Profile <FaPencilAlt />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">About</h2>
          <p className="text-gray-700">{editor.about}</p>
        </div>

        {/* My Gigs */}
        <div className="mb-6">
          <div className="flex justify-evenly items-center mb-4">
            <h2 className="text-xl font-semibold mb-4">My Gigs</h2>{" "}
            <div className="bg-green-500 flex items-center text-white px-3 py-1 rounded-full cursor-pointer hover:bg-green-600">
              <FaPlus /> Add Gigs
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 border-zinc-300 border-2 rounded-2xl shadow-black shadow-2xl md:grid-cols-3 gap-4">
            {editor.gigs.map((gig) => (
              <div
                key={gig.id}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition"
              >
                <img
                  src={gig.image}
                  alt={gig.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-2 flex justify-between items-center">
                  <p className="font-semibold text-gray-700">{gig.title}</p>
                  <span className="font-bold text-green-500">${gig.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {editor.portfolio.map((item) => (
              <div
                key={item.id}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-2">
                  <p className="font-semibold text-gray-700 text-center">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills & Languages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {editor.skills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {editor.languages.map((lang, i) => (
                <span
                  key={i}
                  className="bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Experience</h2>
          {editor.experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <p className="font-semibold">
                {exp.role} @ {exp.company} ({exp.duration})
              </p>
              <p className="text-gray-700 text-sm">{exp.description}</p>
            </div>
          ))}
        </div>

        {/* Education */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Education</h2>
          {editor.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold">
                {edu.degree}, {edu.school} ({edu.year})
              </p>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Certifications</h2>
          {editor.certifications.map((cert, i) => (
            <div key={i} className="mb-1">
              <p>
                {cert.title} ({cert.year})
              </p>
            </div>
          ))}
        </div>

        {/* Reviews */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Reviews</h2>
          {editor.reviews.map((review, i) => (
            <div key={i} className="mb-2 border-b border-gray-200 pb-2">
              <p className="font-semibold">{review.client}</p>
              <p className="flex items-center gap-1 text-yellow-500">
                {review.rating} <FaStar />
              </p>
              <p className="text-gray-700 text-sm">{review.comment}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Contact</h2>
          <p className="text-gray-700">
            <FaEnvelope className="inline mr-2" />
            {editor.contact.email}
          </p>
          <p className="text-gray-700">
            <FaUserTie className="inline mr-2" />
            {editor.contact.phone}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditorProfile;
