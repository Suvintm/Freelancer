import { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EditorMyOrdersPage = () => {
  const { backendURL, user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("gig");
  const navigate = useNavigate();

  const demoOrders = [
    {
      id: 1,
      type: "gig",
      gigTitle: "YouTube Video Editing",
      description:
        "Edit a 10-min vlog with transitions, color grading, and music.",
      clientName: "John Doe",
      clientId: "c123", // add clientId for chat
      amount: 120,
      requestedDate: "2025-09-20",
      deadline: "2025-09-25",
      status: "pending",
    },
    {
      id: 2,
      type: "requested",
      gigTitle: "Corporate Promo Video",
      description: "Edit a 2-min promo with animations and branding.",
      clientName: "Sarah Johnson",
      clientId: "c456",
      amount: 300,
      requestedDate: "2025-09-15",
      deadline: "2025-09-30",
      status: "completed",
    },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${backendURL}/orders/my-orders`, {
          withCredentials: true,
        });
        setOrders(res.data.length > 0 ? res.data : demoOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders(demoOrders);
      }
    };
    fetchOrders();
  }, [backendURL]);

  const filteredOrders = orders.filter((order) => order.type === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Navbar */}
      <div className="flex justify-between items-center bg-white shadow-md px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            onClick={() => navigate("/editor-home")}
            src={logo}
            alt="SuviX"
            className="w-8 h-8 cursor-pointer"
          />
          <h1 className="text-lg font-bold">My Orders</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-semibold">
            {user?.name || "Profile"}
          </span>
          <img
            src={
              user?.profilePicture ||
              user?.avatar ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt="Profile"
            className="w-8 h-8 rounded-full border-2 border-green-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mt-4 mb-6 flex-wrap">
        <button
          className={`px-4 py-2 rounded-full font-semibold ${
            activeTab === "gig"
              ? "bg-green-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("gig")}
        >
          Orders from Gigs
        </button>
        <button
          className={`px-4 py-2 rounded-full font-semibold ${
            activeTab === "requested"
              ? "bg-green-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("requested")}
        >
          Requested Orders
        </button>
      </div>

      {/* Orders List */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/chat/${order.id}`)} // 👈 Navigate to chat
              className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl transition cursor-pointer flex flex-col justify-between"
            >
              <h3 className="font-bold text-lg mb-2">
                {order.gigTitle || "Custom Order"}
              </h3>
              <p className="text-gray-600 text-sm mb-2">{order.description}</p>
              <p className="text-gray-500 text-xs mb-1">
                Client: {order.clientName}
              </p>
              <p className="font-bold text-sm mb-1">Amount: ${order.amount}</p>
              <p className="text-gray-500 text-xs mb-1">
                Requested: {order.requestedDate}
              </p>
              <p className="text-gray-500 text-xs mb-2">
                Deadline: {order.deadline}
              </p>
              <p
                className={`text-sm font-semibold ${
                  order.status === "accepted"
                    ? "text-green-500"
                    : order.status === "pending"
                    ? "text-yellow-500"
                    : order.status === "completed"
                    ? "text-blue-500"
                    : "text-gray-500"
                }`}
              >
                Status: {order.status}
              </p>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No orders available.
          </p>
        )}
      </div>
    </div>
  );
};

export default EditorMyOrdersPage;
