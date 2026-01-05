import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import BuilderPage from "./pages/Builder";
import DashboardPage from "./pages/Dashboard";
import { motion } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';
import { PricingCard } from './components/landing/PricingCard';
import { Footer } from './components/landing/Footer';
import { ModernBackground } from './components/landing/ModernBackground';

function HomePage() {
  const navigate = useNavigate();
  const initType = "github"; // or "dashboard"

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <ModernBackground />

      {/* Navigation Bar */}
      <nav className="relative z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className='flex items-center gap-2'>
              <img src="/src/assets/movevm.png" alt="MoveVM" className="h-6" />
              <h3 className="text-2xl font-bold text-yellow-400">
                MoveVM
              </h3>
            </div>
          </div>

          {/* Navigation Links and CTA */}
          <div className="flex items-center space-x-8">
            <a
              href="#demo"
              className="text-gray-400 hover:text-yellow-400 transition-colors text-sm font-medium"
            >
              Demo
            </a>
            <a
              href="#pricing"
              className="text-gray-400 hover:text-yellow-400 transition-colors text-sm font-medium"
            >
              Pricing
            </a>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg text-white text-sm font-semibold hover:from-yellow-400 hover:to-orange-500 transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
                <img
                  src="/src/assets/movementlogo.png"
                  alt="Movement Labs"
                  className="h-4"
                />
                <span className="text-yellow-400">MoveVM</span>
              </div>
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl md:text-3xl text-gray-300 mb-12 font-light"
          >
            Deploy Move smart contracts on Movement Network with just three clicks.
            <br />
            <span className="text-yellow-400">No CLI required.</span>
          </motion.p>

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.4 }}
  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
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
    className="group px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl text-white font-semibold text-lg hover:from-yellow-400 hover:to-orange-500 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40"
  >
    Initialize Project
    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  </button>
</motion.div>
        </div>
      </section>

      {/* Demo Video Section */}
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
              See <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">MoveVM</span> in Action
            </h2>
            <p className="text-gray-400 text-lg">
              Watch how easy it is to build and deploy Move contracts
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
          >
            <iframe
              className="w-full aspect-video"
              src="https://www.youtube.com/embed/y2kZ998O1E8?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&showinfo=0"
              title="MoveVM Demo"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />

          </motion.div>
        </div>
      </section>

      {/* Movement Labs Logo Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="p-12"
          >
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-4">Powered by</p>
            <div className="flex items-center justify-center space-x-3 mb-6">
              <img src="/src/assets/movementlogo.png" alt="Movement Labs" className="h-16" />
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Built on Movement Network, the fastest and most developer-friendly Move blockchain.
              MoveVM leverages Movement Labs' infrastructure to provide seamless smart contract deployment.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Transparent</span> Pricing
            </h2>
            <p className="text-gray-400 text-lg">
              Choose the plan that works best for you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for getting started"
              features={[
                "Up to 3 projects",
                "Basic AI code generation",
                "Community support",
                "Testnet deployment only",
                "Basic file management",
              ]}
              buttonText="Get Started"
              onButtonClick={() => navigate('/dashboard')}
              delay={0}
            />
            <PricingCard
              name="Monthly"
              price="$29"
              period="/month"
              description="For professional developers"
              isPopular={true}
              features={[
                "Unlimited projects",
                "Advanced AI code generation",
                "Priority support",
                "Testnet & Devnet deployment",
                "Advanced file management",
                "Deployment history",
                "Custom templates",
              ]}
              buttonText="Start Free Trial"
              delay={0.1}
            />
            <PricingCard
              name="Yearly"
              price="$290"
              period="/year"
              description="Best value for teams"
              features={[
                "Everything in Monthly",
                "Mainnet deployment access",
                "Team collaboration",
                "Advanced analytics",
                "API access",
                "Custom integrations",
                "Dedicated support",
              ]}
              buttonText="Contact Sales"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function App() {
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

export default App;