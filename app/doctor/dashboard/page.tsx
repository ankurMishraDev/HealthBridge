"use client";
import { useState, useEffect } from "react";
import { DoctorDashboard } from "@/components/doctor/DoctorDashboard";
import { useDoctorAuth } from "@/hooks/useDoctorAuth";
import { DashboardPage, ViewType } from "@/lib/types";
import { Doctor } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function DoctorDashboardPage() {
  const { currentDoctor, loading, handleLogout: doctorLogout } = useDoctorAuth();
  const [dashboardPage, setDashboardPage] = useState<DashboardPage>("home");
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentDoctor) {
      router.push("/doctor/auth");
    }
  }, [currentDoctor, loading, router]);

  const handleLogout = () => {
    doctorLogout();
  };

  if (loading || !currentDoctor) {
    return <div>Loading...</div>;
  }

  return (
    <DoctorDashboard
      currentDoctor={currentDoctor}
      handleLogout={handleLogout}
      dashboardPage={dashboardPage}
      setDashboardPage={setDashboardPage}
      setCurrentView={setCurrentView}
    />
  );
}
