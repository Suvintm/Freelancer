// src/pages/MyOrders.jsx
import { useState, useEffect } from "react";
import { FaUserTie, FaCheckCircle } from "react-icons/fa";
import logo from "../assets/logo.png";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EditorMyOrdersPage = () => {
  const { backendURL, user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("gig");
  const navigate = useNavigate();

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${backendURL}/orders/my-orders`, {
          withCredentials: true,
        });
        setOrders(res.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
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
          <img src={logo} alt="SuviX" className="w-8 h-8" />
          <h1 className="text-lg font-bold">My Orders</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-semibold">
            {user?.name || "Profile"}
          </span>
          <img
            src={
              user?.avatar || "https://randomuser.me/api/portraits/men/46.jpg"
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
              className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl transition flex flex-col justify-between"
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
                    : "text-gray-500"
                }`}
              >
                Status: {order.status}
              </p>

              {order.status === "pending" && (
                <button className="mt-2 w-full px-3 py-1 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm">
                  Accept
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No orders available.
          </p>
        )}
      </div>

      {/* Mobile Quick Access */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white p-2 flex justify-around shadow-t-md">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-xl"
          onClick={() => setActiveTab("gig")}
        >
          Orders from Gigs
        </button>
        <button
          className="px-4 py-2 bg-white text-gray-700 rounded-xl shadow-md"
          onClick={() => setActiveTab("requested")}
        >
          Requested Orders
        </button>
      </div>
    </div>
  );
};

export default EditorMyOrdersPage;
