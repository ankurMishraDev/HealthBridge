import { useState, useEffect } from "react";
import { Doctor } from "../lib/types";
import { logout } from "../lib/doctor-auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../lib/firebase";

const auth = getAuth(app);

export const useDoctorAuth = () => {
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const storedDoctor = localStorage.getItem("curez_doctor");
        if (storedDoctor) {
          try {
            setCurrentDoctor(JSON.parse(storedDoctor));
          } catch (error) {
            console.error("Failed to parse stored doctor:", error);
            localStorage.removeItem("curez_doctor");
          }
        }
      } else {
        setCurrentDoctor(null);
        localStorage.removeItem("curez_doctor");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentDoctor(null);
    localStorage.removeItem("curez_doctor");
  };

  return { currentDoctor, loading, handleLogout, setCurrentDoctor };
};
