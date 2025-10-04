import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  MessageCircle,
  BookOpen,
  User as UserIcon,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { DashboardPage } from "../lib/types";
import { useTranslation } from "@/hooks/useTranslation";

interface SidebarProps {
  dashboardPage: DashboardPage;
  setDashboardPage: (page: DashboardPage) => void;
  handleLogout: () => void;
  onNavigateToLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  dashboardPage,
  setDashboardPage,
  handleLogout,
  onNavigateToLanding,
}) => {
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const navItems = [
    { id: "home", label: t("sidebar_home"), icon: Home },
    { id: "sessions", label: t("sidebar_aiSession"), icon: MessageCircle },
    { id: "resources", label: t("sidebar_resources"), icon: BookOpen },
    { id: "profile", label: t("sidebar_profile"), icon: UserIcon },
  ];

  const sidebarContent = (isCollapsed: boolean) => (
    <div className={`flex flex-col h-full bg-card p-4 ${isCollapsed ? 'items-center' : ''}`}>
      <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
        <img src="/Logo.png" alt="AnamAI Logo" className="h-16 w-16" />
        {!isCollapsed && (
          <div>
            <h1 
              className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={onNavigateToLanding}
            >
              {t("sidebar_anamai")}
            </h1>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={dashboardPage === id ? "default" : "ghost"}
            onClick={() => {
              setDashboardPage(id as DashboardPage);
              setIsMobileOpen(false);
            }}
            className={`w-full justify-start text-lg h-12 ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? label : undefined}
          >
            <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && label}
          </Button>
        ))}
      </nav>
      <Button
        variant="ghost"
        onClick={() => {
          handleLogout();
          window.location.href = "/";
        }}
        className={`w-full justify-start text-lg h-12 mt-auto ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? t("sidebar_logout") : undefined}
      >
        <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
        {!isCollapsed && t("sidebar_logout")}
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-20">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card p-0">
            {sidebarContent(false)}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col h-screen transition-all duration-300 relative ${isDesktopCollapsed ? 'w-20' : 'w-64'} sticky top-0`}>
        {sidebarContent(isDesktopCollapsed)}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-0 transform translate-x-1/2 bg-card border rounded-full z-10"
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        >
          <ChevronLeft className={`transition-transform duration-300 ${isDesktopCollapsed ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    </>
  );
};
