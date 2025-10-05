import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeroSectionProps {
  onBeginJourney: () => void;
}

export default function Home({ onBeginJourney }: HeroSectionProps) {
  const { t } = useTranslation();
  const [navbarOpacity, setNavbarOpacity] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [showNumberInput, setShowNumberInput] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          (scrollPosition - halfViewportHeight) /
            (fullViewportHeight - halfViewportHeight),
          1
        );

        setNavbarOpacity(transitionProgress);
      } else {
        setNavbarOpacity(0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    {
      key: "mission",
      label: t("hero_ourMission"),
      action: () => handleScrollTo("why-choose-anamai"),
    },
    {
      key: "resources",
      label: t("hero_resources"),
      action: () => handleScrollTo("wellness-journey"),
    },
    {
      key: "faq",
      label: t("hero_faq"),
      action: () => handleScrollTo("faq-section"),
    },
  ];

  const isScrolled = navbarOpacity > 0;

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
        <nav
          className={`fixed left-1/2 top-3 z-50 w-full max-w-[90vw] sm:max-w-4xl lg:max-w-6xl -translate-x-1/2 px-4 sm:px-6 transition-all duration-300 ${
            isScrolled ? "md:top-4" : "md:top-6"
          }`}
        >
          <div
            style={
              isScrolled
                ? {
                    background: `rgba(0, 82, 255, ${0.8 * Math.max(navbarOpacity, 0.3)})`,
                    backdropFilter: "blur(12px)",
                    border: `1px solid rgba(0, 82, 255, ${0.3 * navbarOpacity})`,
                    borderRadius: "1.5rem",
                  }
                : {
                    background: "rgba(255, 255, 255, 0.65)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "1.5rem",
                  }
            }
            className="w-full border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <img
                  src="/Logo.png"
                  alt="AnamAI Logo"
                  className="h-12 w-12 sm:h-16 sm:w-16"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-3xl font-bold leading-none transition-colors duration-300 sm:text-4xl ${
                    isScrolled ? "text-white" : "text-black"
                  }`}
                >
                  <span className="text-black">anam</span>
                  <span className="text-primary">ai</span>
                </motion.button>
              </div>

              <div className="hidden items-center gap-4 font-sans text-sm font-semibold md:flex lg:text-base">
                {isMounted && (
                  <div className="w-[160px] lg:w-[180px]">
                    <LanguageSwitcher />
                  </div>
                )}
                {navItems.map((item) => (
                  <motion.button
                    key={item.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={item.action}
                    className={`rounded-lg px-3 py-2 transition-all duration-200 ${
                      isScrolled
                        ? "text-white/90 hover:bg-white/10 hover:text-white"
                        : "text-black/80 hover:bg-black/5 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onBeginJourney();
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn-sweep group rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl lg:px-5 lg:py-2.5 lg:text-base"
                >
                  {t("hero_button")}
                </motion.button>
              </div>

              <button
                type="button"
                className={`inline-flex items-center justify-center rounded-lg border border-transparent p-2 md:hidden ${
                  isScrolled ? "text-white" : "text-black"
                }`}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col gap-3 px-4 pb-4 md:hidden"
                >
                  {isMounted && (
                    <div className="w-full">
                      <LanguageSwitcher />
                    </div>
                  )}
                  {navItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.action}
                      className="w-full rounded-lg bg-white/70 px-4 py-2 text-left text-sm font-semibold text-foreground shadow-sm transition hover:bg-white"
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      onBeginJourney();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-600"
                  >
                    {t("hero_button")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-24 text-center sm:px-6 md:items-start md:text-left lg:px-12">
          <div className="w-full max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="fade-in"
            >
              {/* Hero Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6 font-serif text-3xl font-bold leading-tight tracking-tight text-black drop-shadow-2xl sm:text-4xl lg:text-6xl"
              >
                {t("hero_title")}
              </motion.h1>

              {/* Call to Action Buttons */}
              <div className="flex w-full flex-col items-stretch gap-4 sm:w-auto sm:items-start">
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <motion.button
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMakeCall}
                  id="fancy"
                  className="btn-sweep group rounded-lg bg-blue-500 px-6 py-3 text-base font-sans font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl sm:text-lg"
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
                    className="flex flex-col gap-3 rounded-lg bg-black/20 p-3 text-left sm:flex-row sm:items-center"
                  >
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full rounded-lg bg-white/90 px-4 py-3 text-base text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-1"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMakeCall}
                      disabled={isCalling}
                      className="rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {isCalling ? 'Calling...' : 'Call'}
                    </motion.button>
                  </motion.div>
                )}
                {callStatus && (
                  <p className="mt-1 rounded bg-black/50 px-3 py-2 text-sm text-white">
                    {callStatus}
                  </p>
                )}
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
