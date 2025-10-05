import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ViewType } from "../../lib/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SessionSnapshots } from "./SessionSnapshots";

interface SessionsSectionProps {
  setCurrentView: (view: ViewType) => void;
}

export const SessionsSection: React.FC<SessionsSectionProps> = ({
  setCurrentView,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshots = async () => {
      if (!currentUser) return;
      try {
        const response = await fetch(
          `http://localhost:3000/get-snapshots/${currentUser.uid}`
        );
        if (response.ok) {
          const data = await response.json();
          setSnapshots(data);
        }
      } catch (error) {
        console.error("Failed to fetch snapshots", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshots();
  }, [currentUser]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("sessions_curie")}</CardTitle>
          <CardDescription className="text-base">
            {t("sessions_curieDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setCurrentView("session")}
            className="w-full h-16 text-xl font-semibold"
          >
            <MessageCircle className="h-6 w-6 mr-3" />
            {t("sessions_startNew")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sessions_summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="ml-2 text-sm text-muted-foreground">
                {t("sessions_loading")}
              </p>
            </div>
          ) : (
            <SessionSnapshots snapshots={snapshots} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
