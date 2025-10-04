"use client"

import { useState, useEffect } from "react"
import { Dashboard } from "../components/Dashboard"
import { Session } from "../components/Session"
import { useAuth } from "../hooks/useAuth"
import { useMessages } from "../hooks/useMessages"
import { useSession } from "../hooks/useSession"
import Landing from "./Landing"
import { useRouter } from "next/navigation"
import UserAuthPage from "./user/auth/page"

export default function AnamAI() {
  const { currentUser, loading, handleLogout, setCurrentUser } = useAuth()
  const { messages, setMessages, messagesEndRef } = useMessages()
  const session = useSession(currentUser, setMessages)
  const [currentView, setCurrentView] = useState("landing")
  const router = useRouter()

  useEffect(() => {
    if (currentUser) {
      setCurrentView("dashboard")
    } else {
      setCurrentView("landing")
    }
  }, [currentUser])

  useEffect(() => {
    if (currentView === "session" && !session.audioClientRef.current) {
      session.initializeAudioClient()
    }
  }, [currentView, session])

  const handleLogoutAndEndSession = () => {
    handleLogout()
    if (session.audioClientRef.current) {
      session.audioClientRef.current.close()
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (currentView === "auth") {
    return <UserAuthPage setCurrentUser={setCurrentUser} />
  }

  if (currentView === "dashboard") {
    return (
      <Dashboard
        currentUser={currentUser}
        handleLogout={handleLogoutAndEndSession}
        dashboardPage={session.dashboardPage}
        setDashboardPage={session.setDashboardPage}
        setCurrentView={setCurrentView}
        onUserUpdate={setCurrentUser}
      />
    )
  }

  if (currentView === "session") {
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
          setCurrentView("dashboard")
        }}
        setCurrentView={setCurrentView}
        sendTextMessage={session.sendTextMessage}
        setInputMode={session.setInputMode}
      />
    )
  }

  return <Landing onBeginJourney={() => setCurrentView("auth")} />
}
