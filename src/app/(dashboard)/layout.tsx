"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const userRole = userData?.role || "dispatcher";
  const userEmail = user?.email || "";

  const navItems = [
    { name: "Terminal", path: "/dashboard", icon: "terminal" },
    { name: "Live Dispatch", path: "/dispatch", icon: "sensors" },
    { name: "Phlebotomists", path: "/admin/phlebotomists", icon: "group" },
    { name: "Ops History", path: "/history", icon: "history" },
    ...(userRole === "admin"
      ? [
          { name: "System Settings", path: "/settings", icon: "settings" },
        ]
      : []),
  ];

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === pathname);
    return item ? item.name : "System";
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary-container font-mono text-sm uppercase tracking-widest">Initialising Secure Session...</p>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="p-lg border-b border-outline-variant">
        <div className="flex items-center justify-between mb-xs">
          <div className="flex items-center gap-sm">
            <span className="icon text-primary-container text-[24px]">ecg_heart</span>
            <span className="font-technical text-[18px] font-bold tracking-tight">HEALTHYCART</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-outline hover:text-text">
            <span className="icon">close</span>
          </button>
        </div>
        <span className="font-label text-[10px] font-bold text-outline-variant uppercase tracking-[0.2em]">Secure Ops V6.2</span>
      </div>

      <nav className="flex-1 py-lg px-md flex flex-col gap-xs overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-md py-sm px-md rounded font-label text-[13px] font-medium transition-all ${
              pathname === item.path 
                ? "bg-primary-container/10 text-primary-container border-r-2 border-primary-container" 
                : "text-text-muted hover:bg-surface-variant hover:text-text"
            }`}
          >
            <span className="icon text-[20px]">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-md border-t border-outline-variant">
        <div className="bg-surface-container rounded p-sm flex items-center gap-sm mb-md">
          <div className="w-8 h-8 rounded bg-primary-container text-on-primary-container flex items-center justify-center font-technical font-bold text-[14px]">
            {userEmail ? userEmail[0].toUpperCase() : "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-medium text-text truncate">{userEmail}</span>
            <span className="text-[10px] font-bold text-outline-variant uppercase tracking-wider">{userRole}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-sm py-sm px-md rounded font-label text-[12px] font-bold text-error border border-error/20 hover:bg-error/10 transition-all uppercase tracking-wider"
        >
          <span className="icon text-[18px]">logout</span>
          Terminate
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[1002] w-[280px] bg-surface border-r border-outline-variant flex flex-col transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[72px] px-md md:px-xl border-b border-outline-variant flex items-center justify-between shrink-0 bg-surface/50 backdrop-blur-sm">
          <div className="flex items-center gap-md">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-outline-variant hover:text-text transition-colors">
              <span className="icon text-[24px]">menu</span>
            </button>
            <div className="hidden sm:block">
              <span className="font-label text-[10px] font-bold text-outline-variant uppercase tracking-[0.2em]">Operational Mode / {userRole.toUpperCase()}</span>
              <h1 className="font-technical text-[18px] md:text-[20px] font-semibold text-text">{getPageTitle()}</h1>
            </div>
            <div className="sm:hidden font-technical font-bold text-primary-container text-[14px]">HEALTHYCART</div>
          </div>
          <div className="flex items-center gap-md">
            <span className="flex items-center gap-xs px-sm py-[2px] bg-primary-container/10 border border-primary-container/30 rounded-full font-label text-[9px] md:text-[10px] font-bold text-primary-container uppercase tracking-wider">
              <span className="w-[6px] h-[6px] rounded-full bg-primary-container animate-pulse"></span>
              Online
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-md md:p-xl custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
