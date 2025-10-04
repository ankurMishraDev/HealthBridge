import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { AuthMode } from "../lib/types";
import { useTranslation } from "@/hooks/useTranslation";
import type { ConfirmationResult } from "firebase/auth";
import { setupRecaptcha } from "../lib/auth";

interface AuthProps {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  signupForm: {
    phoneNumber: string;
    name: string;
    age: string;
    gender: string;
  };
  setSignupForm: (form: {
    phoneNumber: string;
    name: string;
    age: string;
    gender: string;
  }) => void;
  otp: string;
  setOtp: (otp: string) => void;
  handleSendOtp: () => void;
  handleVerifyOtp: () => void;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
  confirmationResult: ConfirmationResult | null;
}

export const Auth: React.FC<AuthProps> = ({
  authMode,
  setAuthMode,
  signupForm,
  setSignupForm,
  otp,
  setOtp,
  handleSendOtp,
  handleVerifyOtp,
  isSendingOtp,
  isVerifyingOtp,
  confirmationResult,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      setupRecaptcha("recaptcha-container");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="absolute top-4 left-4">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </div>
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto shadow-lg">
            <MessageCircle className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("auth_welcome")}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {t("auth_welcomeDesc")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={authMode}
            onValueChange={(value) => setAuthMode(value as AuthMode)}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t("auth_login")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth_signup")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              {!confirmationResult ? (
                <>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 h-12 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                      +91
                    </span>
                    <Input
                      type="tel"
                      placeholder={t("auth_phoneNumber")}
                      value={signupForm.phoneNumber}
                      onChange={(e) =>
                        setSignupForm({
                          ...signupForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="h-12 rounded-l-none"
                    />
                  </div>
                  <Button
                    onClick={handleSendOtp}
                    className="w-full h-12 text-lg font-semibold"
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? t("auth_sendingOtp") : t("auth_sendOtp")}
                  </Button>
                  <Link href="/doctor/auth" className="w-full">
                    <Button variant="outline" className="w-full h-12 text-lg font-semibold">
                      Doctor Login
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder={t("auth_otp")}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-12"
                  />
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp}
                    className="w-full h-12 text-lg font-semibold"
                  >
                    {isVerifyingOtp
                      ? t("auth_verifyingOtp")
                      : t("auth_verifyOtp")}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              {!confirmationResult ? (
                <>
                  <Input
                    type="text"
                    placeholder={t("auth_fullName")}
                    value={signupForm.name}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, name: e.target.value })
                    }
                    className="h-12"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder={t("auth_age")}
                      min="13"
                      max="25"
                      value={signupForm.age}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, age: e.target.value })
                      }
                      className="h-12"
                      required
                    />
                    <Select
                      value={signupForm.gender}
                      onValueChange={(value) =>
                        setSignupForm({ ...signupForm, gender: value })
                      }
                      required
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={t("auth_gender")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t("auth_male")}</SelectItem>
                        <SelectItem value="female">
                          {t("auth_female")}
                        </SelectItem>
                        <SelectItem value="non-binary">
                          {t("auth_nonBinary")}
                        </SelectItem>
                        <SelectItem value="prefer-not-to-say">
                          {t("auth_preferNotToSay")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 h-12 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                      +91
                    </span>
                    <Input
                      type="tel"
                      placeholder={t("auth_phoneNumber")}
                      value={signupForm.phoneNumber}
                      onChange={(e) =>
                        setSignupForm({
                          ...signupForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="h-12 rounded-l-none"
                      required
                    />
                  </div>
                  <Button
                    onClick={handleSendOtp}
                    className="w-full h-12 text-lg font-semibold"
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp
                      ? t("auth_sendingOtp")
                      : t("auth_sendOtp")}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder={t("auth_otp")}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-12"
                  />
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp}
                    className="w-full h-12 text-lg font-semibold"
                  >
                    {isVerifyingOtp
                      ? t("auth_verifyingOtp")
                      : t("auth_verifyOtp")}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
