import { useState, useEffect } from "react";
import { User } from "../lib/types";
import { logout } from "../lib/auth";

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("curez_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("curez_user");
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  return { currentUser, loading, handleLogout, setCurrentUser };
};
