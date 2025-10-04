"use client"


import { useEffect } from "react"
import { Auth } from "../components/Auth"
import { Dashboard } from "../components/Dashboard"
import { Session } from "../components/Session"
import { useAuth } from "../hooks/useAuth"
import { useMessages } from "../hooks/useMessages"
import { useSession } from "../hooks/useSession"
import Landing from "./Landing"

export default function AnamAI() {
  const auth = useAuth()
  const { messages, setMessages, messagesEndRef } = useMessages()
  const session = useSession(auth.currentUser, setMessages)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const view = urlParams.get("view")
    if (view === "auth") {
      auth.setCurrentView("auth")
    }
  }, [])

  useEffect(() => {
    if (auth.currentView === "session" && !session.audioClientRef.current) {
      session.initializeAudioClient()
    }
  }, [auth.currentView, session])

  const handleLogout = () => {
    auth.handleLogout()
    if (session.audioClientRef.current) {
      session.audioClientRef.current.close()
    }
  }

  if (auth.currentView === "auth") {
    return (
      <Auth
        authMode={auth.authMode}
        setAuthMode={auth.setAuthMode}
        signupForm={auth.signupForm}
        setSignupForm={auth.setSignupForm}
        otp={auth.otp}
        setOtp={auth.setOtp}
        handleSendOtp={auth.handleSendOtp}
        handleVerifyOtp={auth.handleVerifyOtp}
        isSendingOtp={auth.isSendingOtp}
        isVerifyingOtp={auth.isVerifyingOtp}
        confirmationResult={auth.confirmationResult}
      />
    );
  }

  if (auth.currentView === "dashboard") {
    return (
      <Dashboard
        currentUser={auth.currentUser}
        handleLogout={handleLogout}
        dashboardPage={session.dashboardPage}
        setDashboardPage={session.setDashboardPage}
        setCurrentView={auth.setCurrentView}
        onUserUpdate={auth.updateCurrentUser}
      />
    )
  }

  if (auth.currentView === "session") {
    return (
      <Session
        messages={messages}
        messagesEndRef={messagesEndRef}
        isRecording={session.isRecording}
        sessionSeconds={session.sessionSeconds}
        sessionActive={session.sessionActive}
        isAudioPlaying={session.isAudioPlaying}
        startRecording={session.startRecording}
        stopRecording={session.stopRecording}
        endSession={() => {
          session.endSession()
          auth.setCurrentView("dashboard")
        }}
        setCurrentView={auth.setCurrentView}
        sendTextMessage={session.sendTextMessage}
        setInputMode={session.setInputMode}
      />
    )
  }

  if (auth.currentView === "landing") {
    return <Landing onBeginJourney={() => auth.setCurrentView("auth")} />
  }

  return null;
}
