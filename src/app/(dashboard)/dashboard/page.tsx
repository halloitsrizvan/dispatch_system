"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, where } from "firebase/firestore";
import Link from "next/link";
import dynamic from "next/dynamic";
import AddressSearch from "@/components/AddressSearch";

// Dynamic import for MapPanel to avoid SSR issues
const MapPanel = dynamic(() => import("@/components/MapPanel"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface-container animate-pulse rounded-lg border border-outline-variant flex items-center justify-center">
    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Initialising Map...</span>
  </div>
});

export default function DashboardPage() {
  const [stats, setStats] = useState({
    active: 0,
    assignments: 0,
    pending: 0,
    offDuty: 0
  });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [phlebotomists, setPhlebotomists] = useState<any[]>([]);
  const [targetArea, setTargetArea] = useState("");
  const [targetCoords, setTargetCoords] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Real-time phlebotomists for map and stats
    const unsubPhlebs = onSnapshot(collection(db, "phlebotomists"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPhlebotomists(data);
      setStats(prev => ({
        ...prev,
        active: data.filter((p: any) => p.status === "active").length,
        offDuty: data.filter((p: any) => p.status === "inactive").length
      }));
    });

    // Real-time assignments
    const q = query(collection(db, "assignments"), orderBy("createdAt", "desc"), limit(10));
    const unsubAssignments = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentAssignments(data);
      setStats(prev => ({
        ...prev,
        assignments: snapshot.size,
        pending: data.filter(a => a.status === "pending").length
      }));
    });

    return () => {
      unsubPhlebs();
      unsubAssignments();
    };
  }, []);

  const handleQuickDispatch = async () => {
    if (!targetArea) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "assignments"), {
        patientArea: targetArea,
        patientLat: targetCoords?.lat || null,
        patientLng: targetCoords?.lng || null,
        phlebId: "UNASSIGNED",
        phlebName: "Pending Auto-Match",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Quick Dispatch Initiated. Manual assignment required in Dispatch terminal.");
      setTargetArea("");
      setTargetCoords(null);
    } catch (error) {
      console.error("Quick dispatch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page animate-fade-in space-y-lg">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {[
          { label: "Active Operatives", value: stats.active, color: "text-primary-container", dot: "bg-primary-container" },
          { label: "Daily Operations", value: stats.assignments, color: "text-text", dot: null },
          { label: "Queue Status", value: stats.pending, color: "text-tertiary-container", dot: "bg-tertiary-container" },
          { label: "Off-Duty Personnel", value: stats.offDuty, color: "text-error", dot: null }
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container border border-outline-variant p-lg rounded-lg shadow-glow transition-all hover:border-outline hover:translate-y-[-2px] duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-outline-variant uppercase font-bold tracking-[0.1em]">{stat.label}</div>
              {stat.dot && <div className={`w-1.5 h-1.5 rounded-full ${stat.dot} shadow-[0_0_8px_rgba(0,200,150,0.4)] animate-pulse`}></div>}
            </div>
            <div className={`text-3xl font-technical font-bold ${stat.color} tracking-tight`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-lg">
        {/* Main Left (60%) */}
        <section className="lg:col-span-6 space-y-lg">
          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-glow">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-high/50">
              <div className="flex items-center gap-sm">
                <span className="icon text-primary-container text-[20px]">assignment</span>
                <h2 className="font-technical text-[14px] font-bold text-text uppercase tracking-widest">RECENT ASSIGNMENTS</h2>
              </div>
              <Link href="/dispatch" className="text-[10px] text-primary-container font-bold uppercase hover:underline flex items-center gap-xs">
                GO TO TERMINAL <span className="icon text-[12px]">open_in_new</span>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low/50">
                  <tr className="text-[10px] text-outline-variant uppercase font-bold border-b border-outline-variant">
                    <th className="px-lg py-md">Patient Area</th>
                    <th className="px-lg py-md">Phlebotomist</th>
                    <th className="px-lg py-md text-right">Status / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {recentAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-surface-variant/30 transition-colors group">
                      <td className="px-lg py-md">
                        <div className="font-data text-[13px] text-text group-hover:text-primary-container transition-colors">{assignment.patientArea}</div>
                      </td>
                      <td className="px-lg py-md">
                        <div className="text-[13px] text-outline font-medium">{assignment.phlebName}</div>
                      </td>
                      <td className="px-lg py-md text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            assignment.status === 'completed' ? 'border-primary-container/20 text-primary-container bg-primary-container/5' :
                            assignment.status === 'pending' ? 'border-tertiary-container/20 text-tertiary-container bg-tertiary-container/5' :
                            'border-outline-variant text-outline bg-surface-variant/20'
                          }`}>
                            {assignment.status.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-data text-outline-variant">
                            {assignment.createdAt?.toDate ? new Date(assignment.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentAssignments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-lg py-xl text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <span className="icon text-3xl">inbox</span>
                          <span className="font-data text-[11px] uppercase tracking-widest font-bold">No active records in current cycle</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Main Right (40%) */}
        <aside className="lg:col-span-4 space-y-lg">
          <div className="bg-surface-container border border-outline-variant p-lg rounded-xl shadow-glow relative overflow-hidden group transition-all hover:border-primary-container/30">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-container opacity-30"></div>
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-technical text-[13px] font-bold text-text uppercase tracking-widest flex items-center gap-2">
                <span className="icon text-primary-container text-[20px]">terminal</span>
                QUICK DISPATCH
              </h3>
              <span className="text-[9px] font-data text-primary-container bg-primary-container/10 px-2 py-0.5 rounded">LIVE_LINK</span>
            </div>
            
            <div className="space-y-md">
              <div className="relative group/input">
                <AddressSearch 
                  initialValue={targetArea}
                  onSelect={(result) => {
                    setTargetArea(result.display_name);
                    setTargetCoords({ lat: result.lat, lng: result.lng });
                  }} 
                />
                {targetArea && (
                  <button 
                    onClick={handleQuickDispatch}
                    disabled={loading}
                    className="absolute right-2 top-2 p-2 text-primary-container hover:bg-primary-container/10 rounded-md transition-all z-10"
                  >
                    <span className={`icon text-[20px] ${loading ? 'animate-spin' : ''}`}>{loading ? 'sync' : 'send'}</span>
                  </button>
                )}
              </div>
              
              {/* Map Thumbnail */}
              <div className="relative h-[220px] rounded-lg border border-outline-variant overflow-hidden group/map shadow-inner">
                <MapPanel 
                  patientLat={targetCoords?.lat} 
                  patientLng={targetCoords?.lng} 
                  phlebotomists={phlebotomists} 
                />
                <div className="absolute top-3 left-3 flex gap-2 z-[1000] pointer-events-none">
                  <span className="bg-background/80 backdrop-blur-md px-2 py-1 text-[9px] border border-outline-variant font-data text-primary-container uppercase tracking-tight rounded">TACTICAL_GRID:LIVE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant p-lg rounded-xl shadow-glow">
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-technical text-[12px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                <span className="icon text-[18px]">analytics</span>
                SYSTEM PULSE
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-primary-container uppercase">NOMINAL</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_8px_rgba(0,200,150,0.6)] animate-pulse"></span>
              </div>
            </div>
            <div className="space-y-3 font-data text-[10px] text-outline-variant">
              <div className="flex gap-4 items-start group hover:text-outline transition-colors">
                <span className="text-primary-container shrink-0 font-bold tracking-tighter opacity-80">[{new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                <span className="leading-relaxed">OPERATIVE_SYNC: {stats.active} units verified. Channel stable.</span>
              </div>
              <div className="flex gap-4 items-start group hover:text-outline transition-colors">
                <span className="text-primary-container shrink-0 font-bold tracking-tighter opacity-80">[{new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', millisecond: undefined})}]</span>
                <span className="leading-relaxed">LEAFLET_ENGINE: Active. Tileset: DarkMatter.</span>
              </div>
              <div className="flex gap-4 items-start group hover:text-outline transition-colors">
                <span className="text-primary-container shrink-0 font-bold tracking-tighter opacity-80">[{new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                <span className="leading-relaxed">SLA_MONITOR: All response times within 60s threshold.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
