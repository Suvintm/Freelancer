import Navbar from "../components/Navbar";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAppContext } from "../context/AppContext";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  FaArrowRight,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaUserTie,
  FaBriefcase,
  FaCheckCircle,
  FaUsers,
  FaStar,
  FaRocket,
  FaVideo,
  FaCreditCard,
  FaQuoteLeft,
  FaPlay,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaShieldAlt,
  FaHeadset,
  FaComments,
  FaCheckDouble,
  FaWallet,
  FaLayerGroup,
  FaGem,
} from "react-icons/fa";
import {
  HiOutlineVideoCamera,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineChatAlt2,
  HiOutlineSparkles,
  HiOutlineCloudUpload,
  HiOutlineFilm,
  HiOutlineClock,
  HiOutlineBadgeCheck,
} from "react-icons/hi";

// Import banner images
import banner1 from "../assets/banner1.jpg";
import banner2 from "../assets/banner2.jpg";
import banner3 from "../assets/banner3.jpg";
import banner4 from "../assets/banner4.jpg";
import banner5 from "../assets/banner5.jpg";
import banner6 from "../assets/banner6.jpg";

const bannerSlides = [
  { image: banner1, title: "Wedding Films", tag: "Most Popular" },
  { image: banner2, title: "YouTube Content", tag: "Trending" },
  { image: banner3, title: "Corporate Videos", tag: "Enterprise" },
  { image: banner4, title: "Music Videos", tag: "Creative" },
  { image: banner5, title: "Social Media", tag: "Fast Delivery" },
  { image: banner6, title: "Documentaries", tag: "Premium" },
];

// Platform features
const platformFeatures = [
  { icon: HiOutlineFilm, title: "Portfolio Showcase", description: "Create stunning video portfolios with our advanced media player.", color: "emerald" },
  { icon: HiOutlineCloudUpload, title: "Cloud Storage", description: "Store and share large video files securely. Up to 50GB free.", color: "blue" },
  { icon: HiOutlineChatAlt2, title: "Real-time Chat", description: "Built-in messaging with file sharing and video calls.", color: "purple" },
  { icon: HiOutlineShieldCheck, title: "Escrow Payments", description: "Your money is protected until you approve the work.", color: "orange" },
  { icon: HiOutlineClock, title: "Project Tracking", description: "Track progress with milestones, deadlines, and reminders.", color: "pink" },
  { icon: HiOutlineBadgeCheck, title: "Verified Profiles", description: "All editors are verified with portfolio review.", color: "cyan" },
];

// How it works
const howItWorks = [
  { step: 1, title: "Create Your Profile", description: "Sign up in 60 seconds. Build your portfolio or post requirements.", icon: FaUserTie, forEditor: "Showcase your work", forClient: "Describe your project" },
  { step: 2, title: "Connect & Discuss", description: "Browse profiles, compare prices, and chat directly.", icon: FaComments, forEditor: "Respond to inquiries", forClient: "Interview editors" },
  { step: 3, title: "Work Together", description: "Share files, give feedback, and track progress in real-time.", icon: FaVideo, forEditor: "Deliver quality work", forClient: "Review iterations" },
  { step: 4, title: "Complete & Pay", description: "Approve final work and release payment securely.", icon: FaCheckDouble, forEditor: "Get paid instantly", forClient: "Download files" },
];

// Categories
const categories = [
  { name: "Wedding", icon: "💒", editors: "2,400+", avgPrice: "₹5,000" },
  { name: "YouTube", icon: "▶️", editors: "3,100+", avgPrice: "₹1,500" },
  { name: "Corporate", icon: "🏢", editors: "1,800+", avgPrice: "₹8,000" },
  { name: "Music Video", icon: "🎵", editors: "1,200+", avgPrice: "₹4,000" },
  { name: "Social Media", icon: "📱", editors: "4,200+", avgPrice: "₹800" },
  { name: "Documentary", icon: "🎬", editors: "890+", avgPrice: "₹12,000" },
  { name: "Animation", icon: "✨", editors: "650+", avgPrice: "₹6,000" },
  { name: "Short Film", icon: "🎞️", editors: "980+", avgPrice: "₹7,500" },
];

// Testimonials
const testimonials = [
  { name: "Rahul Sharma", role: "YouTuber · 500K Subs", image: "https://randomuser.me/api/portraits/men/32.jpg", quote: "SuviX transformed my content creation. My channel grew 3x in 6 months!", rating: 5, project: "YouTube Series" },
  { name: "Priya Patel", role: "Marketing Director", image: "https://randomuser.me/api/portraits/women/44.jpg", quote: "We've completed 15 corporate videos through SuviX. Exceptional quality!", rating: 5, project: "Corporate Videos" },
  { name: "Amit Kumar", role: "Professional Editor", image: "https://randomuser.me/api/portraits/men/67.jpg", quote: "I've tripled my income using SuviX. The platform handles everything!", rating: 5, project: "Freelancer" },
  { name: "Sneha Reddy", role: "Wedding Filmmaker", image: "https://randomuser.me/api/portraits/women/28.jpg", quote: "The cloud storage feature is amazing! No more WeTransfer hassles.", rating: 5, project: "Wedding Films" },
];

// Stats
const stats = [
  { number: "2M+", label: "Active Users", icon: FaUsers },
  { number: "46K+", label: "Projects Done", icon: FaVideo },
  { number: "₹15Cr+", label: "Paid to Editors", icon: FaWallet },
  { number: "4.9/5", label: "User Rating", icon: FaStar },
];

// Pricing
const pricing = [
  { name: "Starter", price: "Free", desc: "Perfect for beginners", features: ["5GB Storage", "Basic Profile", "10 Proposals/month", "Email Support"] },
  { name: "Pro", price: "₹499", desc: "For serious editors", features: ["50GB Storage", "Featured Profile", "Unlimited Proposals", "Priority Support", "Analytics"], popular: true },
  { name: "Business", price: "₹1,499", desc: "For agencies", features: ["200GB Storage", "Team Accounts", "Custom Branding", "Dedicated Manager", "API Access"] },
];

const Homepage = () => {
  const { user, showAuth, setShowAuth } = useAppContext();
  const [selectedRole, setSelectedRole] = useState("editor");
  const [currentBanner, setCurrentBanner] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const navigate = useNavigate();

  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });

  useEffect(() => {
    const interval = setInterval(() => setCurrentBanner((p) => (p + 1) % bannerSlides.length), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTestimonialIndex((p) => (p + 1) % (testimonials.length - 2)), 6000);
    return () => clearInterval(interval);
  }, []);

  const handleGoWorkspace = () => {
    if (user.role === "editor") navigate("/editor-home");
    else navigate("/client-home");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 pt-8 pb-16 lg:pt-12 lg:pb-20 overflow-hidden">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Text Content - Shows first on mobile, first on desktop */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="order-1 lg:order-1">
              {user && (
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <FaCheckCircle className="text-emerald-500" />
                  <span>Welcome back, {user.name}!</span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">#1 Platform</span>
                <span className="text-slate-500 text-sm">Trusted by 2M+ users</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {user ? <>Your Projects <span className="text-emerald-500">Await</span></> : <>Hire Expert <span className="text-emerald-500">Video Editors</span> in Minutes</>}
              </h1>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                {user ? "Continue where you left off. Your workspace, messages, and earnings are ready." : "India's largest marketplace for video editing talent. Find your perfect creative partner."}
              </p>
              

              {!user && (
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="inline-flex bg-slate-100 rounded-full p-1">
                    <button className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${selectedRole === "editor" ? "bg-white text-slate-900 shadow-md" : "text-slate-600"}`} onClick={() => setSelectedRole("editor")}>
                      <FaUserTie className="inline mr-2 text-emerald-500" /> I'm an Editor
                    </button>
                    <button className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${selectedRole === "client" ? "bg-white text-slate-900 shadow-md" : "text-slate-600"}`} onClick={() => setSelectedRole("client")}>
                      <FaBriefcase className="inline mr-2 text-blue-500" /> I'm a Client
                    </button>
                  </div>
                  <button onClick={() => setShowAuth(true)} className="group inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">
                    Get Started Free <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {user && (
                <button onClick={handleGoWorkspace} className="group inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105">
                  Enter Workspace <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {!user && (
                <div className="flex flex-wrap items-center gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => <img key={i} src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${20 + i}.jpg`} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />)}
                    </div>
                    <span className="text-slate-600 text-sm font-medium">2,000+ Editors Online</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex text-amber-400">{[...Array(5)].map((_, i) => <FaStar key={i} className="text-sm" />)}</div>
                    <span className="text-slate-600 text-sm font-medium">4.9 (12K+ reviews)</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Banner - Shows second/below on mobile, second on desktop */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative order-2 lg:order-2">
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80">
                <div className="aspect-[4/3] relative">
                  <AnimatePresence mode="wait">
                    <motion.img key={currentBanner} src={bannerSlides[currentBanner].image} alt={bannerSlides[currentBanner].title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full object-cover" />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="inline-block px-2 py-1 bg-emerald-500 text-white text-[10px] font-semibold rounded mb-2">{bannerSlides[currentBanner].tag}</span>
                        <h3 className="text-white text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{bannerSlides[currentBanner].title}</h3>
                      </div>
                      <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                        <FaPlay className="text-xs ml-0.5" />
                      </button>
                    </div>
                    <div className="flex gap-1.5 mt-4">
                      {bannerSlides.map((_, i) => <button key={i} onClick={() => setCurrentBanner(i)} className={`h-1 rounded-full transition-all ${i === currentBanner ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />)}
                    </div>
                  </div>
                </div>
              </div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100 hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><FaCheckCircle className="text-emerald-500" /></div>
                <div><p className="text-sm font-semibold text-slate-900">Project Delivered!</p><p className="text-xs text-slate-500">Wedding Film · Just now</p></div>
              </motion.div>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100 hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><FaCreditCard className="text-blue-500" /></div>
                <div><p className="text-sm font-semibold text-slate-900">₹12,500 Received</p><p className="text-xs text-slate-500">Payment · 2 min ago</p></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsRef} className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: index * 0.1, duration: 0.5 }} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-50 flex items-center justify-center"><stat.icon className="text-xl text-emerald-600" /></div>
                <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{stat.number}</p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mb-3"><HiOutlineSparkles /> Popular Categories</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Browse by Video Type</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {categories.map((cat, index) => (
              <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="flex-shrink-0 snap-start bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer min-w-[180px] group">
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{cat.icon}</span>
                <h3 className="font-semibold text-slate-900 mb-1">{cat.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{cat.editors} editors</p>
                <p className="text-sm text-emerald-600 font-semibold">From {cat.avgPrice}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" ref={featuresRef} className="py-16 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-3"><FaGem /> Platform Features</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Everything You Need to Succeed</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">From project management to secure payments, we've built every tool you need.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: index * 0.1, duration: 0.5 }} className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-emerald-300 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}><feature.icon className={`text-2xl text-${feature.color}-600`} /></div>
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 bg-gradient-to-b from-slate-50 to-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full mb-3"><FaRocket /> How It Works</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Get Started in 4 Simple Steps</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="relative">
                {index < howItWorks.length - 1 && <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-emerald-300 to-transparent -translate-x-1/2 z-0" />}
                <div className="relative z-10 bg-white border border-slate-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg">{item.step}</div>
                  <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mt-4 mb-4"><item.icon className="text-2xl text-slate-600" /></div>
                  <h3 className="font-bold text-slate-900 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{item.description}</p>
                  <div className="space-y-1 text-xs">
                    <p className="text-emerald-600"><FaCheck className="inline mr-1" /> Editor: {item.forEditor}</p>
                    <p className="text-blue-600"><FaCheck className="inline mr-1" /> Client: {item.forClient}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-16 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full mb-3"><FaStar /> Success Stories</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loved by Thousands</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTestimonialIndex(Math.max(0, testimonialIndex - 1))} disabled={testimonialIndex === 0} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-colors"><FaChevronLeft className="text-slate-600 text-sm" /></button>
              <button onClick={() => setTestimonialIndex(Math.min(testimonials.length - 2, testimonialIndex + 1))} disabled={testimonialIndex >= testimonials.length - 2} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-colors"><FaChevronRight className="text-slate-600 text-sm" /></button>
            </div>
          </div>
          <div className="overflow-hidden">
            <motion.div className="flex gap-6" animate={{ x: -testimonialIndex * (100 / 2 + 3) + "%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              {testimonials.map((t, index) => (
                <div key={index} className="flex-shrink-0 w-[calc(50%-12px)] min-w-[320px]">
                  <div className="bg-slate-50 rounded-2xl p-6 h-full border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                      <div><p className="font-semibold text-slate-900">{t.name}</p><p className="text-xs text-slate-500">{t.role}</p></div>
                      <span className="ml-auto px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">{t.project}</span>
                    </div>
                    <FaQuoteLeft className="text-xl text-emerald-200 mb-2" />
                    <p className="text-slate-700 leading-relaxed mb-4">{t.quote}</p>
                    <div className="flex text-amber-400 text-sm">{[...Array(t.rating)].map((_, i) => <FaStar key={i} />)}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mb-3"><FaLayerGroup /> Pricing</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Plans for Every Creator</h2>
            <p className="text-slate-600">Start free, upgrade as you grow. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className={`relative bg-white rounded-2xl p-6 border ${plan.popular ? 'border-emerald-400 shadow-xl' : 'border-slate-200'}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">Most Popular</span>}
                <h3 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{plan.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{plan.desc}</p>
                <p className="text-3xl font-bold text-slate-900 mb-6">{plan.price}<span className="text-sm font-normal text-slate-500">/month</span></p>
                <ul className="space-y-3 mb-6">{plan.features.map((f, i) => <li key={i} className="flex items-center gap-2 text-sm text-slate-600"><FaCheck className="text-emerald-500 text-xs" /> {f}</li>)}</ul>
                <button className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}>Get Started</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-500 to-teal-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ready to Transform Your Video Projects?</h2>
            <p className="text-white/90 mb-8 text-lg max-w-xl mx-auto">Join 2M+ creators and businesses using SuviX today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => !user && setShowAuth(true)} className="group inline-flex items-center justify-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-all">{user ? "Go to Workspace" : "Start Free Today"} <FaArrowRight className="group-hover:translate-x-1 transition-transform" /></button>
              <button className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur text-white px-6 py-4 rounded-full font-semibold border border-white/20 hover:bg-white/20 transition-all"><FaPlay className="text-xs" /> Watch Demo</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Suvi<span className="text-emerald-500">X</span></h3>
              <p className="text-sm leading-relaxed mb-5">India's largest video editing marketplace. Connect with talented editors or showcase your skills.</p>
              <div className="flex gap-2">{[FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube].map((Icon, i) => <a key={i} href="#" className="w-9 h-9 bg-slate-800 hover:bg-emerald-500 rounded-lg flex items-center justify-center transition-all hover:scale-110"><Icon className="text-sm" /></a>)}</div>
            </div>
            <div><h4 className="text-white font-semibold mb-4">Platform</h4><ul className="space-y-2 text-sm">{["How It Works", "Find Editors", "For Clients", "Pricing", "Enterprise"].map(link => <li key={link}><a href="#" className="hover:text-emerald-400 transition-colors">{link}</a></li>)}</ul></div>
            <div><h4 className="text-white font-semibold mb-4">Resources</h4><ul className="space-y-2 text-sm">{["Help Center", "Blog", "API Docs", "Community", "Success Stories"].map(link => <li key={link}><a href="#" className="hover:text-emerald-400 transition-colors">{link}</a></li>)}</ul></div>
            <div><h4 className="text-white font-semibold mb-4">Contact</h4><ul className="space-y-2 text-sm"><li className="flex items-center gap-2"><FaHeadset className="text-emerald-400" /> 24/7 Support</li><li>support@suvix.com</li><li>+91 1234567890</li><li>Mumbai, India</li></ul></div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
            <p>&copy; {new Date().getFullYear()} SuviX. All rights reserved.</p>
            <div className="flex gap-4"><a href="#" className="hover:text-emerald-400">Terms</a><a href="#" className="hover:text-emerald-400">Privacy</a><a href="#" className="hover:text-emerald-400">Cookies</a></div>
          </div>
        </div>
      </footer>

      {!user && showAuth && <AuthForm />}
    </div>
  );
};

export default Homepage;
