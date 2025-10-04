import { Doctor } from "./types";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  User as FirebaseUser,
} from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);

const mapFirebaseError = (code?: string) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    default:
      return code ? code.replace(/_/g, " ").toLowerCase() : "An unknown error occurred.";
  }
};

type SignupFormData = {
  name: string;
  age: string;
  gender: string;
  email: string;
  password?: string;
};

const syncDoctorProfile = async (doctor: Doctor) => {
  try {
    const response = await fetch("/api/doctor/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doctor),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      console.warn(
        "Failed to persist doctor profile:",
        data.error || response.statusText
      );
    }
  } catch (error) {
    console.error("Failed to sync doctor profile:", error);
  }
};

export const signup = async (formData: SignupFormData): Promise<FirebaseUser> => {
  try {
    const { email, name, age, gender, password } = formData;
    if (!password) {
      throw new Error("Password is required.");
    }
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    const doctor: Doctor = {
      doctor_id: firebaseUser.uid,
      name,
      age: Number.parseInt(age),
      gender,
      email,
      expertise: "",
      qualification: "",
      experience: 0,
      languages: [],
      profile_photo: "",
      availability_time: "",
      medicalLicenseCertificate: "",
      clinicAddress: "",
      phoneNumber: "",
      preferredLanguages: [],
      averageRating: 0,
      reviewStars: [],
    };

    await syncDoctorProfile(doctor);

    localStorage.setItem("curez_doctor", JSON.stringify(doctor));

    return firebaseUser;
  } catch (error: any) {
    console.error("Doctor signup failed:", error);
    const message = mapFirebaseError(error.code);
    throw new Error(message);
  }
};

export const login = async (email: string, pass: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    const doctor: Doctor = {
      doctor_id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: "",
      age: 0,
      gender: "",
      expertise: "",
      qualification: "",
      experience: 0,
      languages: [],
      profile_photo: "",
      availability_time: "",
      medicalLicenseCertificate: "",
      clinicAddress: "",
      phoneNumber: "",
      preferredLanguages: [],
      averageRating: 0,
      reviewStars: [],
    };

    localStorage.setItem("curez_doctor", JSON.stringify(doctor));

    return firebaseUser;
  } catch (error: any) {
    console.error("Doctor login failed:", error);
    const message = mapFirebaseError(error.code);
    throw new Error(message);
  }
};

export const logout = () => {
  if (auth) {
    auth.signOut();
  }
};
