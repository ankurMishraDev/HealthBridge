import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Users,
  Calendar,
  User as UserIcon,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { DashboardPage } from "../../lib/types";

interface DoctorSidebarProps {
  dashboardPage: DashboardPage;
  setDashboardPage: (page: DashboardPage) => void;
  handleLogout: () => void;
  onNavigateToLanding?: () => void;
}

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  dashboardPage,
  setDashboardPage,
  handleLogout,
  onNavigateToLanding,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "patients", label: "Patients", icon: Users },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "profile", label: "Profile", icon: UserIcon },
  ];

  const sidebarContent = (isCollapsed: boolean) => (
    <div className={`flex flex-col h-full bg-card p-4 ${isCollapsed ? 'items-center' : ''}`}>
      <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
        <img src="/Logo.png" alt="AnamAI Logo" className="h-16 w-16" />
        {!isCollapsed && (
          <div>
            <h1
  className="text-2xl font-bold cursor-pointer transition-colors hover:text-primary"
  onClick={onNavigateToLanding}
  style={{ fontFamily: "Gramond, sans-serif" }}
>
  <span style={{ color: '#000000' }}>anam</span>
  <span style={{ color: '#2B7FFF' }}>ai</span>
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
        onClick={handleLogout}
        className={`w-full justify-start text-lg h-12 mt-auto ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? "Logout" : undefined}
      >
        <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
        {!isCollapsed && "Logout"}
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
