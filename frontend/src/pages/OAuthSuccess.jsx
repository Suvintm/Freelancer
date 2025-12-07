import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const OAuthSuccess = () => {
    const { setUser } = useAppContext();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (error) {
            toast.error("OAuth login failed. Please try again.");
            navigate("/login");
            return;
        }

        if (token) {
            // Decode token to get user info (basic decode, not verification)
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));

                // Fetch user details
                fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.success && data.user) {
                            const userData = { ...data.user, token };
                            setUser(userData);
                            localStorage.setItem("user", JSON.stringify(userData));
                            toast.success("Login successful!");

                            // Navigate based on role
                            if (data.user.role === "editor") {
                                navigate("/editor-home");
                            } else if (data.user.role === "client") {
                                navigate("/client-home");
                            } else {
                                navigate("/");
                            }
                        } else {
                            toast.error("Failed to get user details");
                            navigate("/login");
                        }
                    })
                    .catch((err) => {
                        console.error("OAuth success error:", err);
                        toast.error("Something went wrong");
                        navigate("/login");
                    });
            } catch (err) {
                console.error("Token decode error:", err);
                toast.error("Invalid token");
                navigate("/login");
            }
        } else {
            navigate("/login");
        }
    }, [searchParams, setUser, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">Completing login...</h2>
                <p className="text-gray-500 mt-2">Please wait while we set up your account.</p>
            </div>
        </div>
    );
};

export default OAuthSuccess;
