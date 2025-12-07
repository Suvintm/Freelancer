import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { FaUserTie, FaBriefcase, FaArrowRight } from "react-icons/fa";

const SelectRole = () => {
    const { setUser, backendURL } = useAppContext();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedRole, setSelectedRole] = useState("");
    const [loading, setLoading] = useState(false);

    const token = searchParams.get("token");

    const handleRoleSelect = async () => {
        if (!selectedRole) {
            toast.warning("Please select a role");
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
            toast.error(error.response?.data?.message || "Failed to set role");
            navigate("/login");
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to SuviX! 🎉</h1>
                    <p className="text-gray-500">
                        One last step - tell us how you want to use the platform
                    </p>
                </div>

                {/* Role Options */}
                <div className="space-y-4 mb-8">
                    {/* Editor Option */}
                    <button
                        onClick={() => setSelectedRole("editor")}
                        className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${selectedRole === "editor"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedRole === "editor"
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                        >
                            <FaUserTie className="text-xl" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 text-lg">I'm an Editor</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                Showcase your portfolio, find clients, and grow your video editing business
                            </p>
                        </div>
                        {selectedRole === "editor" && (
                            <div className="ml-auto flex-shrink-0">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                            </div>
                        )}
                    </button>

                    {/* Client Option */}
                    <button
                        onClick={() => setSelectedRole("client")}
                        className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${selectedRole === "client"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedRole === "client"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                        >
                            <FaBriefcase className="text-xl" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 text-lg">I'm a Client</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                Find talented editors, post projects, and get your videos edited professionally
                            </p>
                        </div>
                        {selectedRole === "client" && (
                            <div className="ml-auto flex-shrink-0">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                            </div>
                        )}
                    </button>
                </div>

                {/* Continue Button */}
                <button
                    onClick={handleRoleSelect}
                    disabled={!selectedRole || loading}
                    className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${selectedRole && !loading
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg active:scale-[0.98]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Setting up your account...
                        </>
                    ) : (
                        <>
                            Continue <FaArrowRight />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SelectRole;
