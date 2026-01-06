import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import BuilderPage from "./pages/Builder";
import DashboardPage from "./pages/Dashboard";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Github } from "lucide-react";
import { PricingCard } from "./components/landing/PricingCard";
import { Footer } from "./components/landing/Footer";
import { ModernBackground } from "./components/landing/ModernBackground";

// ✅ IMPORT ASSETS (IMPORTANT)
import movevmLogo from "./assets/movevm.png";
import movementLogo from "./assets/movementlogo.png";

function HomePage() {
  const navigate = useNavigate();
  const initType = "dashboard"; // or "github"

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <ModernBackground />

      {/* Navigation Bar */}
      <nav className="relative z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={movevmLogo} alt="MoveVM" className="h-6" />
            <h3 className="text-2xl font-bold text-yellow-400">MoveVM</h3>
          </div>

          {/* Nav */}
          <div className="flex items-center space-x-8">
            <a href="#demo" className="hidden md:block text-gray-400 hover:text-yellow-400 text-sm">
              Demo
            </a>
            <a href="#pricing" className="hidden md:block text-gray-400 hover:text-yellow-400 text-sm">
              Pricing
            </a>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-2 md:px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg text-white text-sm font-semibold hover:from-yellow-400 hover:to-orange-500 transition-all shadow-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 min-h-[90vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-7xl md:text-8xl font-bold mb-6"
          >
            <div className="flex justify-center">
              <div className="flex flex-col items-start gap-2">
                <img src={movementLogo} alt="Movement Labs" className="h-4" />
                <span className="text-yellow-400">MoveVM</span>
              </div>
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl md:text-3xl text-gray-300 mb-12"
          >
            Deploy Move smart contracts on Movement Network with just three clicks.
            <br />
            <span className="text-yellow-400">No CLI required.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center"
          >
            <button
              onClick={() => {
                if (initType === "github") {
                  window.open(
                    "https://github.com/devbh04/MoveVM",
                    "_blank",
                    "noopener,noreferrer"
                  );
                } else {
                  navigate("/dashboard");
                }
              }}
              className="group px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl text-white font-semibold text-lg flex items-center gap-2 shadow-lg"
            >
              Initialize Project
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center pt-4"
          >

            <button
              onClick={() => {
                  window.open(
                    "https://github.com/devbh04/MoveVM",
                    "_blank",
                    "noopener,noreferrer"
                  );
              }}
              className="group px-2 py-1 bg-transparent rounded-md text-white text-sm flex items-center gap-2 cursor-pointer hover:underline"
            >
              <Github className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              View on GitHub
            </button>
            <div>|</div>
            <button
              onClick={() => {
                  window.open(
                    "https://youtu.be/hqAkiPw-mno",
                    "_blank",
                    "noopener,noreferrer"
                  );
              }}
              className="group px-2 py-1 bg-transparent rounded-md text-white text-sm flex items-center gap-2 cursor-pointer hover:underline"
            >
              Demo Video Link
              <ExternalLink className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="relative z-10 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              See <span className="text-yellow-400">MoveVM</span> in Action
            </h2>
            <p className="text-gray-400 text-lg">
              Watch how easy it is to build and deploy Move contracts
            </p>
          </motion.div>

          <iframe
            className="w-full aspect-video rounded-2xl"
            src="https://www.youtube.com/embed/y2kZ998O1E8?autoplay=1&mute=1&controls=0&loop=1&playlist=y2kZ998O1E8&modestbranding=1&rel=0&playsinline=1"
            title="MoveVM Demo"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />

        </div>
      </section>

      {/* Powered By */}
      <section className="relative z-10 py-20 px-6 text-center">
        <p className="text-gray-400 text-sm uppercase mb-4">Powered by</p>
        <img src={movementLogo} alt="Movement Labs" className="md:h-16 mx-auto mb-6" />
        <p className="text-gray-300 max-w-2xl mx-auto">
          Built on Movement Network, the fastest and most developer-friendly Move blockchain.
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <PricingCard
            name="Free"
            price="$0"
            description="Perfect for getting started"
            features={[
              "Up to 3 projects",
              "Basic AI code generation",
              "Community support",
            ]}
            buttonText="Get Started"
            onButtonClick={() => navigate("/dashboard")}
          />
          <PricingCard
            name="Monthly"
            price="$29"
            period="/month"
            isPopular
            description="For professionals"
            features={["Unlimited projects", "Priority support"]}
            buttonText="Start Free Trial"
          />
          <PricingCard
            name="Yearly"
            price="$290"
            period="/year"
            description="Best value"
            features={["Everything in Monthly", "Mainnet access"]}
            buttonText="Contact Sales"
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/builder" element={<BuilderPage />} />
      </Routes>
    </Router>
  );
}
