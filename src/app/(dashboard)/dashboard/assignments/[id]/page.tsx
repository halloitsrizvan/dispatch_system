"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapPanel = dynamic(() => import("@/components/MapPanel"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface-container animate-pulse rounded-lg flex items-center justify-center">
    <span className="text-[10px] font-bold text-outline uppercase tracking-widest text-center">Loading Tactical Data...</span>
  </div>
});

export default function AssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    
    const unsub = onSnapshot(doc(db, "assignments", params.id as string), (docSnap) => {
      if (docSnap.exists()) {
        setAssignment({ id: docSnap.id, ...docSnap.data() });
      } else {
        alert("Record not found.");
        router.push("/dashboard");
      }
      setLoading(false);
    });

    return () => unsub();
  }, [params.id]);

  const updateStatus = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, "assignments", params.id as string), {
        status: newStatus
      });
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <div className="font-technical text-[12px] text-outline uppercase tracking-[0.3em]">Syncing Record...</div>
      </div>
    </div>
  );

  return (
    <div className="assignment-details animate-fade-in space-y-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div className="flex items-center gap-md">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-variant/50 transition-colors">
            <span className="icon text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="text-[10px] text-outline-variant uppercase font-black tracking-[0.2em]">OPERATIONAL RECORD</div>
            <h1 className="text-xl font-technical font-bold text-text uppercase tracking-tight">ID: {assignment.id.slice(0, 8)}...</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-md bg-surface-container p-sm rounded-xl border border-outline-variant shadow-glow">
          <div className="px-lg">
            <div className="text-[9px] text-outline-variant uppercase font-black">Current Status</div>
            <div className={`text-[12px] font-technical font-bold uppercase tracking-widest ${
              assignment.status === 'completed' ? 'text-primary-container' : 
              assignment.status === 'pending' ? 'text-tertiary-container' : 'text-outline'
            }`}>
              {assignment.status}
            </div>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant"></div>
          <div className="flex gap-2 p-1">
            {['pending', 'in-progress', 'completed', 'cancelled'].map((s) => (
              <button 
                key={s}
                onClick={() => updateStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                  assignment.status === s 
                    ? 'bg-primary-container text-on-primary-container shadow-[0_0_10px_rgba(0,200,150,0.3)]' 
                    : 'bg-background text-outline hover:bg-surface-variant'
                }`}
              >
                {s.split('-')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Details Grid */}
        <div className="lg:col-span-4 space-y-lg">
          <section className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-glow">
            <div className="px-lg py-md border-b border-outline-variant bg-surface-container-high/50 flex items-center gap-sm">
              <span className="icon text-primary-container text-[18px]">info</span>
              <span className="text-[10px] font-black text-text uppercase tracking-widest">ASSIGNMENT METRICS</span>
            </div>
            <div className="p-lg space-y-lg">
              <div className="space-y-sm">
                <label className="text-[9px] text-outline-variant uppercase font-black tracking-widest">Patient Area</label>
                <div className="p-md bg-background border border-outline-variant rounded-lg font-data text-[13px] text-text leading-relaxed">
                  {assignment.patientArea}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-sm">
                  <label className="text-[9px] text-outline-variant uppercase font-black tracking-widest">Operative</label>
                  <div className="p-md bg-background border border-outline-variant rounded-lg font-technical font-bold text-[12px] text-primary-container">
                    {assignment.phlebName}
                  </div>
                </div>
                <div className="space-y-sm">
                  <label className="text-[9px] text-outline-variant uppercase font-black tracking-widest">Timestamp</label>
                  <div className="p-md bg-background border border-outline-variant rounded-lg font-data text-[12px] text-outline">
                    {assignment.createdAt?.toDate ? new Date(assignment.createdAt.toDate()).toLocaleTimeString() : '...'}
                  </div>
                </div>
              </div>

              <div className="bg-primary-container/5 border border-primary-container/20 p-md rounded-lg">
                 <div className="text-[9px] text-primary-container uppercase font-black mb-1">System Note</div>
                 <div className="text-[11px] text-outline leading-relaxed italic">
                   This record was generated via {assignment.patientLat ? 'Tactical Dispatch' : 'Quick Terminal'} and is currently synchronized with the live operative database.
                 </div>
              </div>
            </div>
          </section>

          <div className="bg-surface-container border border-outline-variant p-lg rounded-xl shadow-glow">
             <div className="flex items-center gap-sm mb-md">
               <span className="icon text-error text-[20px]">warning</span>
               <h3 className="font-technical text-[12px] font-bold text-text uppercase tracking-wider">ADMINISTRATIVE ACTIONS</h3>
             </div>
             <button className="w-full py-md border border-error/30 text-error hover:bg-error/5 rounded-lg font-bold text-[11px] uppercase transition-all tracking-widest">
               Invalidate Record
             </button>
          </div>
        </div>

        {/* Map View */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-glow min-h-[500px] flex flex-col">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-high/50 flex justify-between items-center">
             <div className="flex items-center gap-sm">
               <span className="icon text-primary-container text-[18px]">map</span>
               <span className="text-[10px] font-black text-text uppercase tracking-widest">TACTICAL VISUALIZATION</span>
             </div>
             <span className="text-[9px] font-data text-outline-variant">AUTO_ZOOM: ACTIVE</span>
          </div>
          <div className="flex-1 relative">
            <MapPanel 
              patientLat={assignment.patientLat} 
              patientLng={assignment.patientLng}
              phlebotomists={[{ 
                id: assignment.phlebId, 
                name: assignment.phlebName, 
                status: 'active',
                lat: assignment.patientLat ? assignment.patientLat + 0.005 : undefined, // Mock proximity if not saved
                lng: assignment.patientLng ? assignment.patientLng + 0.005 : undefined 
              }]}
              selectedId={assignment.phlebId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
