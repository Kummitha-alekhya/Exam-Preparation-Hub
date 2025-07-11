import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  BarChart3, 
  User, 
  LogOut,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Study Plans", url: "/study-plans", icon: BookOpen },
  { title: "Mock Tests", url: "/mock-tests", icon: FileText },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 border-r border-sidebar-border bg-sidebar shadow-soft`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gradient-primary p-2 rounded-xl shadow-soft">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h2 className="font-bold text-lg text-sidebar-foreground">ExamPrep</h2>
              <p className="text-xs text-sidebar-foreground/70">Study Hub</p>
            </motion.div>
          )}
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="ml-auto"
            >
              <ThemeToggle />
            </motion.div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "text-sidebar-foreground/80 font-medium mb-3 transition-all duration-300",
            collapsed ? "hidden" : "block"
          )}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"} 
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]",
                          isActive(item.url) 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-soft border border-sidebar-border" 
                            : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className={cn(
                          "w-5 h-5 shrink-0 transition-colors",
                          isActive(item.url) ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70"
                        )} />
                        {!collapsed && (
                          <span className="font-medium">{item.title}</span>
                        )}
                        {!collapsed && isActive(item.url) && (
                          <motion.div
                            className="w-1.5 h-1.5 bg-sidebar-accent-foreground rounded-full ml-auto"
                            layoutId="activeIndicator"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {!collapsed && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/20 border border-sidebar-border/50">
              <Avatar className="w-8 h-8 ring-2 ring-sidebar-border">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-sidebar-foreground/60">Student</p>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            {collapsed ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="w-10 h-10 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </motion.div>
      </SidebarFooter>

      {/* Trigger for collapsing sidebar - only show when collapsed */}
      {collapsed && (
        <div className="absolute top-4 -right-3">
          <SidebarTrigger className="bg-sidebar border border-sidebar-border shadow-card rounded-xl" />
        </div>
      )}
    </Sidebar>
  );
}