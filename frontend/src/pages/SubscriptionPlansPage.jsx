/**
 * SubscriptionPlansPage
 * Displays available subscription plans with pricing
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiSparkles,
  HiCheck,
  HiEye,
  HiUserGroup,
  HiChartBar,
  HiArrowDownTray,
  HiBell,
  HiShieldCheck,
} from "react-icons/hi2";
import { FaCrown, FaRupeeSign } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar";
import EditorNavbar from "../components/EditorNavbar";
import { useSubscription } from "../context/SubscriptionContext";
import { useAppContext } from "../context/AppContext";

const SubscriptionPlansPage = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const {
    plans,
    loading,
    hasActiveSubscription,
    hasUsedTrial,
    startTrial,
    createOrder,
    verifyPayment,
    checkFeatureSubscription,
  } = useSubscription();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const hasSub = await checkFeatureSubscription("profile_insights");
      setHasSubscription(hasSub);
      setTrialUsed(hasUsedTrial("profile_insights"));
    };
    if (user) checkStatus();
  }, [user, checkFeatureSubscription, hasUsedTrial]);

  // Filter plans for profile_insights feature
  const profileInsightsPlans = plans.filter(
    (p) => p.feature === "profile_insights" && p.isActive
  );

  // Handle starting trial
  const handleStartTrial = async (plan) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setProcessing(plan._id);
    try {
      await startTrial(plan._id);
      toast.success(`${plan.trialDays}-day free trial activated!`);
      navigate("/profile-insights");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start trial");
    } finally {
      setProcessing(null);
    }
  };

  // Handle subscription payment
  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setProcessing(plan._id);
    try {
      const orderData = await createOrder(plan._id);

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SuviX",
        description: orderData.plan.name,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              subscriptionId: orderData.subscriptionId,
            });
            toast.success("Subscription activated successfully!");
            navigate("/profile-insights");
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#10B981",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create order");
    } finally {
      setProcessing(null);
    }
  };

  const featureIcons = {
    "See who viewed your profile": HiEye,
    "Visitor names & photos": HiUserGroup,
    "Client vs Editor breakdown": HiChartBar,
    "Last 30 days history": HiSparkles,
    "Real-time notifications": HiBell,
    "Priority support": HiShieldCheck,
    default: HiCheck,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-20 md:pt-24 px-4 md:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full mb-4">
              <FaCrown className="text-amber-400" />
              <span className="text-sm font-medium text-amber-400">
                Profile Insights Pro
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              See Who's Viewing Your Profile
            </h1>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Unlock powerful insights about your profile visitors. Know which
              clients are interested in your work.
            </p>
          </motion.div>

          {/* Already Subscribed Banner */}
          {hasSubscription && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center"
            >
              <HiCheck className="text-2xl text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-medium">
                You have an active subscription!
              </p>
              <button
                onClick={() => navigate("/profile-insights")}
                className="mt-2 text-sm text-emerald-400 underline"
              >
                View your profile insights →
              </button>
            </motion.div>
          )}

          {/* Plans - Mobile Carousel / Desktop Grid */}
          {loading ? (
            // Skeleton loaders
            <div className="flex md:grid md:grid-cols-2 gap-4 max-w-3xl mx-auto overflow-x-auto pb-4 snap-x snap-mandatory md:overflow-visible">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-72 md:w-auto bg-zinc-900/50 rounded-xl p-5 animate-pulse snap-center"
                >
                  <div className="h-5 bg-zinc-800 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-zinc-800 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-3 bg-zinc-800 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : profileInsightsPlans.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No subscription plans available at the moment.
            </div>
          ) : (
            <>
              {/* Mobile Carousel */}
              <div className="md:hidden overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 pb-4 px-1 snap-x snap-mandatory overflow-x-auto">
                  {profileInsightsPlans.map((plan, index) => {
                    const isPopular = plan.badge === "BEST VALUE";
                    const Icon = isPopular ? FaCrown : HiSparkles;

                    return (
                      <motion.div
                        key={plan._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex-shrink-0 w-72 snap-center rounded-xl p-5 ${
                          isPopular
                            ? "bg-gradient-to-b from-amber-500/10 to-zinc-900 border-2 border-amber-500/30"
                            : "bg-zinc-900/50 border border-zinc-800"
                        }`}
                      >
                        {/* Badge */}
                        {plan.badge && (
                          <div className="mb-3">
                            <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                              {plan.badge}
                            </span>
                          </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <Icon
                            className={`text-lg ${
                              isPopular ? "text-amber-400" : "text-zinc-400"
                            }`}
                          />
                          <h3 className="text-base font-semibold">{plan.duration === "monthly" ? "Monthly" : "Yearly"}</h3>
                        </div>

                        {/* Pricing */}
                        <div className="mb-4">
                          <div className="flex items-baseline gap-1">
                            <FaRupeeSign className="text-sm text-zinc-400" />
                            <span className="text-3xl font-bold">{plan.price}</span>
                            <span className="text-zinc-500 text-sm">
                              /{plan.duration === "monthly" ? "mo" : "yr"}
                            </span>
                          </div>
                          {plan.discountPercent > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500 line-through">
                                ₹{plan.originalPrice}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                                Save {plan.discountPercent}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Features - Compact */}
                        <ul className="space-y-2 mb-4">
                          {plan.features?.slice(0, 4).map((feature, i) => {
                            const FeatureIcon =
                              featureIcons[feature] || featureIcons.default;
                            return (
                              <li key={i} className="flex items-start gap-2">
                                <FeatureIcon className="text-emerald-400 text-xs mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-zinc-300 leading-tight">
                                  {feature}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        {/* CTA Buttons */}
                        <div className="space-y-2">
                          {!trialUsed && plan.trialDays > 0 && !hasSubscription && (
                            <button
                              onClick={() => handleStartTrial(plan)}
                              disabled={processing === plan._id}
                              className="w-full py-2 bg-zinc-800 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                            >
                              {processing === plan._id
                                ? "Starting..."
                                : `${plan.trialDays}-Day Free Trial`}
                            </button>
                          )}

                          <button
                            onClick={() => handleSubscribe(plan)}
                            disabled={processing === plan._id || hasSubscription}
                            className={`w-full py-2.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                              isPopular
                                ? "bg-amber-500 text-black hover:bg-amber-400"
                                : "bg-emerald-500 text-white hover:bg-emerald-400"
                            }`}
                          >
                            {processing === plan._id
                              ? "Processing..."
                              : hasSubscription
                              ? "Subscribed"
                              : "Subscribe"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {/* Carousel Indicator */}
                <div className="flex justify-center gap-1.5 mt-2">
                  {profileInsightsPlans.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-zinc-700"
                    />
                  ))}
                </div>
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {profileInsightsPlans.map((plan, index) => {
                  const isPopular = plan.badge === "BEST VALUE";
                  const Icon = isPopular ? FaCrown : HiSparkles;

                  return (
                    <motion.div
                      key={plan._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative rounded-2xl p-6 ${
                        isPopular
                          ? "bg-gradient-to-b from-amber-500/10 to-zinc-900 border-2 border-amber-500/30"
                          : "bg-zinc-900/50 border border-zinc-800"
                      }`}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <Icon
                          className={`text-xl ${
                            isPopular ? "text-amber-400" : "text-zinc-400"
                          }`}
                        />
                        <h3 className="text-lg font-semibold">{plan.duration === "monthly" ? "Monthly" : "Yearly"}</h3>
                      </div>

                      {/* Pricing */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <FaRupeeSign className="text-lg text-zinc-400" />
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="text-zinc-500">
                            /{plan.duration === "monthly" ? "month" : "year"}
                          </span>
                        </div>
                        {plan.discountPercent > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-zinc-500 line-through">
                              ₹{plan.originalPrice}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                              Save {plan.discountPercent}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-6">
                        {plan.features?.map((feature, i) => {
                          const FeatureIcon =
                            featureIcons[feature] || featureIcons.default;
                          return (
                            <li key={i} className="flex items-start gap-2">
                              <FeatureIcon className="text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-zinc-300">
                                {feature}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      {/* CTA Buttons */}
                      <div className="space-y-2">
                        {/* Trial Button */}
                        {!trialUsed && plan.trialDays > 0 && !hasSubscription && (
                          <button
                            onClick={() => handleStartTrial(plan)}
                            disabled={processing === plan._id}
                            className="w-full py-2.5 bg-zinc-800 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                          >
                            {processing === plan._id
                              ? "Starting..."
                              : `Start ${plan.trialDays}-Day Free Trial`}
                          </button>
                        )}

                        {/* Subscribe Button */}
                        <button
                          onClick={() => handleSubscribe(plan)}
                          disabled={processing === plan._id || hasSubscription}
                          className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                            isPopular
                              ? "bg-amber-500 text-black hover:bg-amber-400"
                              : "bg-emerald-500 text-white hover:bg-emerald-400"
                          }`}
                        >
                          {processing === plan._id
                            ? "Processing..."
                            : hasSubscription
                            ? "Already Subscribed"
                            : "Subscribe Now"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <h2 className="text-xl font-semibold text-center mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "How long is visitor data stored?",
                  a: "We store your visitor data for the last 30 days. Older data is automatically deleted to ensure optimal performance.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes! You can cancel your subscription at any time. You'll retain access until the end of your billing period.",
                },
                {
                  q: "What happens after the free trial?",
                  a: "After your 3-day trial ends, you can choose to subscribe or your access will revert to the free tier.",
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
                >
                  <h4 className="font-medium mb-2">{faq.q}</h4>
                  <p className="text-sm text-zinc-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPlansPage;
