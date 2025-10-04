"use client"

import { useState, useEffect } from "react"
import { Auth } from "@/components/Auth"
import { AuthMode } from "@/lib/types"
import { ConfirmationResult } from "firebase/auth"
import { sendOtp, verifyOtp, setupRecaptcha } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { User } from "@/lib/types"

export default function UserAuthPage({
  setCurrentUser,
}: {
  setCurrentUser: (user: User) => void
}) {
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [signupForm, setSignupForm] = useState({
    phoneNumber: "",
    name: "",
    age: "",
    gender: "",
  })
  const [otp, setOtp] = useState("")
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      setupRecaptcha("recaptcha-container");
    }
  }, []);

  const handleSendOtp = async () => {
    setIsSendingOtp(true)
    try {
      const result = await sendOtp("+91" + signupForm.phoneNumber)
      setConfirmationResult(result)
    } catch (error) {
      console.error("Failed to send OTP:", error)
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!confirmationResult) return
    setIsVerifyingOtp(true)
    try {
      const user = await verifyOtp(confirmationResult, otp, signupForm)
      setCurrentUser(user)
      router.push("/")
    } catch (error) {
      console.error("Failed to verify OTP:", error)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  return (
    <>
      <div id="recaptcha-container" />
      <Auth
        authMode={authMode}
        setAuthMode={setAuthMode}
      signupForm={signupForm}
      setSignupForm={setSignupForm}
      otp={otp}
      setOtp={setOtp}
      handleSendOtp={handleSendOtp}
      handleVerifyOtp={handleVerifyOtp}
      isSendingOtp={isSendingOtp}
      isVerifyingOtp={isVerifyingOtp}
      confirmationResult={confirmationResult}
    />
    </>
  )
}
