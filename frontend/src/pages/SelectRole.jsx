import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { FaUserTie, FaBriefcase, FaArrowRight, FaGlobe, FaPhoneAlt } from "react-icons/fa";

const COUNTRIES = [
    { code: "IN", name: "India", flag: "🇮🇳", supported: true, dialCode: "91" },
    { code: "US", name: "United States", flag: "🇺🇸", supported: false, dialCode: "1" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧", supported: false, dialCode: "44" },
    { code: "CA", name: "Canada", flag: "🇨🇦", supported: false, dialCode: "1" },
    { code: "AU", name: "Australia", flag: "🇦🇺", supported: false, dialCode: "61" },
    { code: "DE", name: "Germany", flag: "🇩🇪", supported: false, dialCode: "49" },
    { code: "FR", name: "France", flag: "🇫🇷", supported: false, dialCode: "33" },
    { code: "AE", name: "UAE", flag: "🇦🇪", supported: false, dialCode: "971" },
    { code: "SG", name: "Singapore", flag: "🇸🇬", supported: false, dialCode: "65" },
    { code: "JP", name: "Japan", flag: "🇯🇵", supported: false, dialCode: "81" },
];

const SelectRole = () => {
    const { setUser, backendURL } = useAppContext();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedRole, setSelectedRole] = useState("");
    const [country, setCountry] = useState("IN");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const token = searchParams.get("token");

    const activeCountry = COUNTRIES.find(c => c.code === country);

    const handleRoleSelect = async () => {
        if (!selectedRole) {
            toast.warning("Please select a role");
            return;
        }

        if (!phone || phone.length < 10) {
            toast.warning("Please enter a valid mobile number");
            return;
        }

        if (!token) {
            toast.error("Invalid session. Please try again.");
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${backendURL}/api/auth/select-role`, {
                token,
                role: selectedRole,
                phone,
                country,
            });

            if (res.data.success) {
                const userData = { ...res.data.user, token: res.data.token };
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
                toast.success("Welcome to SuviX!");

                // Navigate based on role
                if (selectedRole === "editor") {
                    navigate("/editor-home");
                } else {
                    navigate("/client-home");
                }
            }
        } catch (error) {
            console.error("Role selection error:", error);
            toast.error(error.response?.data?.message || "Failed to finalize account");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-red-600">Invalid Session</h2>
                    <p className="text-gray-500 mt-2">Please try logging in again.</p>
                    <button
                        onClick={() => navigate("/login")}
                        className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 py-12">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to SuviX! 🎉</h1>
                    <p className="text-gray-500">
                        Help us tailor your experience by completing these steps
                    </p>
                </div>

                {/* Combined Form */}
                <div className="space-y-6">
                    {/* Role Options */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">Choose your purpose:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {/* Editor Option */}
                            <button
                                onClick={() => setSelectedRole("editor")}
                                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${selectedRole === "editor"
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedRole === "editor"
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    <FaUserTie className="text-lg" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Editor</h3>
                                    <p className="text-gray-500 text-xs mt-1">Showcase & find work</p>
                                </div>
                            </button>

                            {/* Client Option */}
                            <button
                                onClick={() => setSelectedRole("client")}
                                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${selectedRole === "client"
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedRole === "client"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    <FaBriefcase className="text-lg" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Client</h3>
                                    <p className="text-gray-500 text-xs mt-1">Hire professionals</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                        {/* Country Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Select Country:</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <FaGlobe />
                                </div>
                                <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="w-full p-4 pl-12 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 transition appearance-none text-gray-800"
                                >
                                    {COUNTRIES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.name} {!c.supported && "(Coming Soon)"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Mobile Number:</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                                    <FaPhoneAlt size={14} />
                                    <span className="text-sm font-bold border-r border-gray-200 pr-2">
                                        +{activeCountry?.dialCode || "91"}
                                    </span>
                                </div>
                                <input
                                    type="tel"
                                    placeholder="Enter mobile number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    className="w-full pl-24 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 transition text-gray-800 placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Continue Button */}
                <button
                    onClick={handleRoleSelect}
                    disabled={!selectedRole || !phone || loading}
                    className={`w-full mt-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${selectedRole && phone && !loading
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg active:scale-[0.98]"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Setting up...
                        </>
                    ) : (
                        <>
                            Complete Registration <FaArrowRight />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SelectRole;
