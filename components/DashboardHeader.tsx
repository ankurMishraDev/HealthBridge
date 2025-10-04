import { User, DashboardPage } from "../lib/types";

interface DashboardHeaderProps {
  dashboardPage: DashboardPage;
  currentUserName: string;
  currentUser: User | null;
}

const getHeaderDetails = (page: DashboardPage, name: string) => {
  switch (page) {
    case "home":
      return {
        title: `Welcome, ${name}`,
        // description: "Here's your wellness overview.",
      };
    case "sessions":
      return {
        title: "AI Session",
        // description: "Connect with your AI mentor for personalized support and guidance.",
      };
    case "resources":
      return {
        title: "Resources",
        // description: "Explore exercises and tips to support your mental well-being.",
      };
    case "profile":
      return {
        title: "Profile",
        // description: "Manage your personal information.",
      };
    default:
      return {
        title: "Dashboard",
        description: "",
      };
  }
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dashboardPage,
  currentUserName,
  currentUser,
}) => {
  const headerDetails = getHeaderDetails(
    dashboardPage,
    currentUserName || "User"
  );

  return (
    <header className="flex justify-between items-center mb-8 md:mt-0 mt-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {headerDetails.title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {headerDetails.description}
        </p>
      </div>
    </header>
  );
};
