import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {   MessageCircle,
  Heart,
  Brain,
  Activity,
  MoonStar,
  Users,
  Dumbbell,
  Gauge,
  Target,
  Sparkles, } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";
import { MoodData, ViewType } from "../../lib/types";
import { PositiveTipCard } from "../PositiveTipCard";
import { useTranslation } from "@/hooks/useTranslation";

interface HomeSectionProps {
  setCurrentView: (view: ViewType) => void;
  isLoadingMood: boolean;
  moodData: MoodData | null;
  currentTip: string;
  positiveTip: string;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  setCurrentView,
  isLoadingMood,
  moodData,
  currentTip,
  positiveTip,
}) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("");

  const handleMakeCall = async () => {
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

  const formatHours = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined || Number.isNaN(hours)) {
      return t("home_notAvailable");
    }
    if (hours === 0) {
      return `0${t("home_hours")}`;
    }
    const rounded = Math.round(hours * 10) / 10;
    return `${rounded}${t("home_hours")}`;
  };

  const formatNumber = (value: number | null | undefined, suffix = "%") => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return t("home_notAvailable");
    }
    // Ensure the value is within valid range (0-100 for percentages)
    const clampedValue = suffix === "%" ? Math.max(0, Math.min(100, value)) : value;
    return `${Math.round(clampedValue)}${suffix}`;
  };

  const formatText = (value: string | null | undefined) => {
    if (!value) {
      return t("home_notAvailable");
    }
    return value;
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-center items-center min-h-[120px] w-full">
        <div className="flex justify-center w-full">
          <PositiveTipCard tip={positiveTip} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-xl">
                <Brain className="h-6 w-6 text-secondary" />
                <span>{t("home_moodAnalytics")}</span>
              </CardTitle>
              <CardDescription className="text-base">
                {t("home_moodAnalyticsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMood ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-sm text-muted-foreground">{t("home_loadingMood")}</p>
                </div>
              ) : moodData ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {/* Mood Overview */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-500">
                            {moodData.mood}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("home_currentMood")}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-500">
                            {formatNumber(moodData.mood_percentage, "%")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("home_moodScore")}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Energy Level Chart */}
                        <div className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <ResponsiveContainer width={150} height={150}>
                              <PieChart>
                                <Pie
                                  data={[
                                    {
                                      name: "Energy",
                                      value: Math.max(0, Math.min(100, moodData.energy_level || 0)),
                                      fill: "#f97316",
                                    },
                                    {
                                      name: "Remaining",
                                      value: 100 - Math.max(0, Math.min(100, moodData.energy_level || 0)),
                                      fill: "#e5e7eb",
                                    },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  startAngle={180}
                                  endAngle={0}
                                  innerRadius={45}
                                  outerRadius={70}
                                  paddingAngle={0}
                                  dataKey="value"
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-500">
                                  {formatNumber(moodData.energy_level, "%")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {t("home_energy")}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-orange-500">
                              {moodData.mood_stability}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("home_stability")}
                            </div>
                          </div>
                        </div>

                        {/* Stress Level Chart */}
                        <div className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <ResponsiveContainer width={150} height={150}>
                              <PieChart>
                                <Pie
                                  data={[
                                    {
                                      name: "Stress",
                                      value: Math.max(0, Math.min(100, moodData.stress_level || 0)),
                                      fill: "#f97316",
                                    },
                                    {
                                      name: "Remaining",
                                      value: 100 - Math.max(0, Math.min(100, moodData.stress_level || 0)),
                                      fill: "#e5e7eb",
                                    },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  startAngle={180}
                                  endAngle={0}
                                  innerRadius={45}
                                  outerRadius={70}
                                  paddingAngle={0}
                                  dataKey="value"
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-500">
                                  {formatNumber(moodData.stress_level, "%")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {t("home_stress")}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-orange-500">
                              {moodData.mood_calmness}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("home_calmness")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {/* Cognitive & Emotional Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Cognitive Score Chart */}
                        <div className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <ResponsiveContainer width={150} height={150}>
                              <PieChart>
                                <Pie
                                  data={[
                                  {
                                    name: "Cognitive",
                                    value: Math.max(0, Math.min(100, moodData?.cognitive_score || 0)),
                                    fill: "#f97316",
                                  },
                                  {
                                    name: "Remaining",
                                    value: 100 - Math.max(0, Math.min(100, moodData?.cognitive_score || 0)),
                                    fill: "#e5e7eb",
                                  },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  startAngle={180}
                                  endAngle={0}
                                  innerRadius={45}
                                  outerRadius={70}
                                  paddingAngle={0}
                                  dataKey="value"
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-500">
                                  {formatNumber(moodData.cognitive_score, "%")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {t("home_cognitive")}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-orange-500">
                              {moodData.focus_level}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("home_focus")}
                            </div>
                          </div>
                        </div>

                        {/* Emotional Score Chart */}
                        <div className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <ResponsiveContainer width={150} height={150}>
                              <PieChart>
                                <Pie
                                  data={[
                                  {
                                    name: "Emotional",
                                    value: Math.max(0, Math.min(100, moodData?.emotional_score || 0)),
                                    fill: "#f97316",
                                  },
                                  {
                                    name: "Remaining",
                                    value: 100 - Math.max(0, Math.min(100, moodData?.emotional_score || 0)),
                                    fill: "#e5e7eb",
                                  },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  startAngle={180}
                                  endAngle={0}
                                  innerRadius={45}
                                  outerRadius={70}
                                  paddingAngle={0}
                                  dataKey="value"
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-500">
                                  {formatNumber(moodData.emotional_score, "%")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {t("home_emotional")}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-orange-500">
                              {moodData.mood_calmness}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("home_calmness")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t("home_completeSession")}
                  </p>
                  <Button
                    onClick={() => setCurrentView("session")}
                    className="mt-4"
                    size="sm"
                  >
                    {t("home_startSession")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("home_quickTip")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                "{currentTip}"
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Call AnamAI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                />
                <Button onClick={handleMakeCall} disabled={isCalling}>
                  {isCalling ? "Calling..." : "Call Now"}
                </Button>
              </div>
              {callStatus && <p className="mt-2 text-sm text-gray-600">{callStatus}</p>}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2 text-xl">
                <Heart className="h-7 w-7 text-primary" />
                <span>{t("home_howFeeling")}</span>
              </CardTitle>
              <CardDescription className="text-base">
                {t("home_howFeelingDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => setCurrentView("session")}
                className="w-full h-16 text-xl font-semibold"
              >
                <MessageCircle className="h-6 w-6 mr-3" />
                {t("home_startAiSession")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
