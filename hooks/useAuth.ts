import { useState, useEffect } from "react";
import { User, ViewType, AuthMode } from "../lib/types";
import {
  sendOtp,
  verifyOtp,
  logout,
  getCurrentUser,
  setupRecaptcha,
} from "../lib/auth";
import type { ConfirmationResult } from "firebase/auth";

export const useAuth = () => {
  const [currentView, setCurrentView] = useState<ViewType>("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [signupForm, setSignupForm] = useState({
    phoneNumber: "",
    name: "",
    age: "",
    gender: "",
  });
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("anamai_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        setCurrentUser(user);
        setCurrentView("dashboard");

        if (user.uid) {
          refreshUserProfile(user.uid);
        }
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("anamai_user");
      }
    }
  }, []);


  const refreshUserProfile = async (uid: string) => {
    try {
      const userData = await getCurrentUser(uid);
      const updatedUser: User = {
        uid,
        phoneNumber: userData.phoneNumber || currentUser?.phoneNumber || "",
        name: userData.name || "",
        age: userData.age,
        gender: userData.gender || "",
      };

      setCurrentUser(updatedUser);
      localStorage.setItem("anamai_user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };

  const handleSendOtp = async () => {
    if (!signupForm.phoneNumber) {
      alert("Please enter your phone number.");
      return;
    }

    try {
      setIsSendingOtp(true);
      const result = await sendOtp(`+91${signupForm.phoneNumber}`);
      setConfirmationResult(result);
      alert("OTP sent to your phone.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !confirmationResult) {
      alert("Please enter the OTP.");
      return;
    }
    if (authMode === 'signup' && (!signupForm.name || !signupForm.age || !signupForm.gender)) {
      alert("Please complete all required fields before signing up.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const user = await verifyOtp(confirmationResult, otp, {
        name: signupForm.name,
        age: signupForm.age,
        gender: signupForm.gender,
      });
      setCurrentUser(user);
      setCurrentView("dashboard");
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setCurrentView("auth");
  };

  const updateCurrentUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("anamai_user", JSON.stringify(user));
  };

  return {
    currentView,
    setCurrentView,
    authMode,
    setAuthMode,
    currentUser,
    signupForm,
    setSignupForm,
    otp,
    setOtp,
    handleSendOtp,
    handleVerifyOtp,
    handleLogout,
    updateCurrentUser,
    isSendingOtp,
    isVerifyingOtp,
    confirmationResult,
  };
};
