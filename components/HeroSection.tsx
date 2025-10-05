import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import Link from "next/link";

interface HeroSectionProps {
  onBeginJourney: () => void;
}

export default function Home({ onBeginJourney }: HeroSectionProps) {
  const { t } = useTranslation();
  const [navbarBg, setNavbarBg] = useState("bg-transparent");
  const [navbarOpacity, setNavbarOpacity] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [showNumberInput, setShowNumberInput] = useState(false);

  const handleMakeCall = async () => {
    if (!showNumberInput) {
      setShowNumberInput(true);
      return;
    }

    if (!phoneNumber) {
      setCallStatus("Please enter a phone number.");
      return;
    }
    setIsCalling(true);
    setCallStatus("Initiating call...");

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860';
      const response = await fetch(`${apiBaseUrl}/make-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to_number: phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setCallStatus(`Call initiated successfully! SID: ${data.call_sid}`);
      } else {
        setCallStatus(`Error: ${data.detail || 'Failed to initiate call.'}`);
      }
    } catch (error) {
      console.error('Error making call:', error);
      setCallStatus('An error occurred. Please check the console and server logs.');
    } finally {
      setIsCalling(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const halfViewportHeight = window.innerHeight / 2;
      const fullViewportHeight = window.innerHeight;
      
      if (scrollPosition >= halfViewportHeight) {
        // Calculate smooth opacity transition from half to full viewport height
        const transitionProgress = Math.min(
          (scrollPosition - halfViewportHeight) / (fullViewportHeight - halfViewportHeight), 
          1
        );
        
        setNavbarBg("bg-orange-500/80 backdrop-blur-sm border rounded-4xl");
        setNavbarOpacity(transitionProgress);
      } else {
        setNavbarBg("bg-transparent");
        setNavbarOpacity(0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>

      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden">
        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 z-0" />

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl z-0" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-xl z-0" />

        {/* Navigation Bar */}
        {navbarOpacity === 0 && (
          <nav className="fixed left-1/2 transform -translate-x-1/2 z-50 w-full max-w-none top-4 py-4 px-6">
            <div className="flex justify-between items-center mx-20">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img src="/Logo.png" alt="AnamAI Logo" className="w-20 h-20"/>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-black text-5xl drop-shadow-lg pr-6 cursor-pointer transition-all duration-300 hover:text-blue-200"
                >
                  <span style={{ color: '#000000' }}>anam</span>
  <span style={{ color: '#2B7FFF' }}>ai</span>
                </motion.div>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-4 text-black/90 font-sans text-lg font-semibold drop-shadow-md">
                {isMounted && <LanguageSwitcher />}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => {
                    const element = document.getElementById('why-choose-anamai');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-black transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/10"
                >
                  {t("hero_ourMission")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => {
                    const element = document.getElementById('wellness-journey');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-black transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/10"
                >
                  {t("hero_resources")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => {
                    const element = document.getElementById('faq-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-black transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/10"
                >
                  {t("hero_faq")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={onBeginJourney}
                  className="btn-sweep group text-white font-sans font-semibold bg-blue-500 px-4 py-2 rounded-lg text-lg hover:shadow-2xl transition-all duration-300 shadow-xl drop-shadow-2xl"
                >
                  {t("hero_button")}
                </motion.button>
              </div>
            </div>
          </nav>
        )}

        {navbarOpacity > 0 && (
          <nav
            className="fixed left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-2xl top-2 py-2 px-4"
            style={{
              background: `rgba(0, 82, 255, ${0.8 * navbarOpacity})`,
              backdropFilter: 'blur(8px)',
              border: `1px solid rgba(0, 82, 255, ${0.3 * navbarOpacity})`,
              borderRadius: '1rem',
            }}
          >
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <img src="/Logo.png" alt="AnamAI Logo" className="w-10 h-10"/>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-white text-xl drop-shadow-lg cursor-pointer transition-all duration-300 hover:text-blue-200 mr-8"
                >
                  AnamAI
                </motion.div>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-2 text-white/90 font-sans text-sm font-semibold drop-shadow-md">
                {isMounted && <LanguageSwitcher />}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => {
                    const element = document.getElementById('why-choose-anamai');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-white cursor-pointer transition-all duration-300 px-3 py-1 rounded-lg hover:bg-white/10"
                >
                  {t("hero_ourMission")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => {
                    const element = document.getElementById('wellness-journey');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-white cursor-pointer transition-all duration-300 px-3 py-1 rounded-lg hover:bg-white/10"
                >
                  {t("hero_resources")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => {
                    const element = document.getElementById('faq-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-white cursor-pointer transition-all duration-300 px-3 py-1 rounded-lg hover:bg-white/10"
                >
                  {t("hero_faq")}
                </motion.button>
              </div>
            </div>
          </nav>
        )}

        {/* Hero Content */}
        <div className="relative z-10 flex pl-12 items-center justify-start h-screen">
          <div className="px-6 lg:px-12">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl fade-in text-left"
            >
              {/* Hero Heading */}
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-serif text-black text-4xl lg:text-6xl font-bold tracking-tight mb-8 drop-shadow-2xl"
              >
                {t("hero_title")}
              </motion.h1>

              {/* Call to Action Buttons */}
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-4">
                  <motion.button
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMakeCall}
                  id="fancy"
                  className="btn-sweep group text-white font-sans font-semibold bg-blue-500 px-[2.3rem] py-[1.15rem] rounded-lg text-[1.5rem] hover:shadow-2xl transition-all duration-300 shadow-xl drop-shadow-2xl"
                  >
                  Call <span style={{ color: 'white' }}>anam</span>
          <span style={{ color: 'yellow' }}>ai</span>
                  </motion.button>
                </div>
                {showNumberInput && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex items-center gap-2 bg-black/20 p-2 rounded-lg"
                  >
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="bg-white/90 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMakeCall}
                      disabled={isCalling}
                      className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isCalling ? 'Calling...' : 'Call'}
                    </motion.button>
                  </motion.div>
                )}
                {callStatus && <p className="mt-2 text-sm text-white bg-black/50 px-3 py-1 rounded">{callStatus}</p>}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        {/* <div className="absolute bottom-6 left-0 right-0 z-10">
          <div className="px-6 lg:px-12">
            <div className="flex justify-between items-center">
              <p className="font-sans text-white/80 text-sm font-medium drop-shadow-lg">
                © 2025 AnamAI. All rights reserved.
              </p>
              <p className="font-sans text-white/80 text-sm font-medium drop-shadow-lg">
                Powered by Gemini for Mental Wellness
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </>
  );
}
