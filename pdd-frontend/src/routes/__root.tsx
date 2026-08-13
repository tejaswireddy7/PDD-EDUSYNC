import React, { useState, useEffect } from "react";
import { createRootRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { Home, BookOpen, MessageSquare, BarChart2, FolderOpen, LogOut, User } from "lucide-react";
import AuthScreen from "../screens/AuthScreen";
import { useDashboardStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { fetchDBAllIncomingUnreadCount, fetchDBResources } from "../lib/supabase-db";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const store = useDashboardStore();
  const isAuthenticated = store.user !== null;
  const [openAssessmentsCount, setOpenAssessmentsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [newResourcesCount, setNewResourcesCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!store.user) return;
    async function loadCounts() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("assessments")
            .select("id, status")
            .eq("user_id", user.id);
          
          if (!error && data) {
            const count = data.filter((a: any) => a.status !== "submitted").length;
            setOpenAssessmentsCount(count);
          } else {
            const focusDomain = store.surveyAnswers?.focusDomain || "Mobile";
            const key = `assessments_${user.id}_${focusDomain}`;
            const cached = localStorage.getItem(key);
            if (cached) {
              const items = JSON.parse(cached);
              const count = items.filter((a: any) => a.status !== "submitted").length;
              setOpenAssessmentsCount(count);
            } else {
              setOpenAssessmentsCount(0);
            }
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }
    loadCounts();
  }, [store.user, store.submittedAssessmentId, store.surveyAnswers?.focusDomain, store.enrolledCourses]);

  useEffect(() => {
    if (!store.user) return;

    let active = true;
    async function pollUnreadMessages() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const count = await fetchDBAllIncomingUnreadCount(user.id);
        if (!active) return;

        setUnreadMessagesCount(count);
      } catch (err) {
        // Safe catch
      }
    }

    pollUnreadMessages();
    const interval = setInterval(pollUnreadMessages, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [store.user]);

  useEffect(() => {
    if (!store.user) return;

    let active = true;
    async function updateNewResourcesBadge() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dbRes = await fetchDBResources();
        if (!active) return;

        // Get list of seen resource IDs from localStorage
        const seenKey = `seen_resources_${user.id}`;
        const seenStr = localStorage.getItem(seenKey);
        const seenIds = seenStr ? JSON.parse(seenStr) : [];
        const seenSet = new Set(seenIds);

        // Filter out resources that are already seen
        const newResources = dbRes.filter((r: any) => r.id && !seenSet.has(r.id));
        
        // If the user is currently on the resources page, mark all as seen
        if (location.pathname === "/resources") {
          const allIds = dbRes.map((r: any) => r.id).filter(Boolean);
          localStorage.setItem(seenKey, JSON.stringify(allIds));
          setNewResourcesCount(0);
        } else {
          setNewResourcesCount(newResources.length);
        }
      } catch (err) {
        console.warn("Failed to check new resources:", err);
      }
    }

    updateNewResourcesBadge();
    const interval = setInterval(updateNewResourcesBadge, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [store.user, location.pathname]);

  const navItems = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/assessments", label: "Assessments", icon: BookOpen, badge: openAssessmentsCount > 0 ? String(openAssessmentsCount) : undefined },
    { to: "/chat", label: "Messenger", icon: MessageSquare, badge: unreadMessagesCount > 0 ? String(unreadMessagesCount) : undefined },
    { to: "/evaluation", label: "Analytics", icon: BarChart2 },
    { to: "/resources", label: "Resource Hub", icon: FolderOpen, badge: newResourcesCount > 0 ? String(newResourcesCount) : undefined },
    { to: "/profile", label: "Profile", icon: User },
  ];

  if (!isAuthenticated) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (Visible on md and larger viewports)                     */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white shadow-sm shrink-0">
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              className="h-9 w-9 rounded-xl object-contain shadow-sm bg-indigo-50" 
              alt="EduSync Logo" 
            />
            <div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                EduSync
              </h1>
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Student Pathway
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{
                  className: "bg-indigo-50/70 text-indigo-600 font-semibold shadow-sm border-l-4 border-indigo-500",
                }}
                inactiveProps={{
                  className: "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent",
                }}
                className="flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm transition-all duration-200 cursor-pointer"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 uppercase">
                {(store.user?.name || "Student")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2) || "S"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-700 truncate">{store.user?.name || "Student"}</p>
                <p className="text-[10px] text-slate-400 truncate">{store.user?.email || "student@edusync.ai"}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT AND CONTENT AREA                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Main scrollable body panel */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* ========================================================================= */}
        {/* MOBILE BOTTOM NAVIGATION BAR (Visible on screens smaller than md)          */}
        {/* ========================================================================= */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-around px-2 z-50 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{
                  className: "text-indigo-600 scale-105 font-bold",
                }}
                inactiveProps={{
                  className: "text-slate-400 hover:text-slate-600",
                }}
                className="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 text-center cursor-pointer relative"
              >
                <div className="relative flex items-center justify-center p-1 rounded-lg">
                  <Icon className="h-5.5 w-5.5" />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-0.5">
                  {item.label === "Resource Hub" ? "Resources" : item.label}
                </span>
              </Link>
            );
          })}

        </nav>
      </div>
    </div>
  );
}
