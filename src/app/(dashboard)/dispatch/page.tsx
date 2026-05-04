"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import dynamic from "next/dynamic";
import AddressSearch from "@/components/AddressSearch";

// Dynamic import for MapPanel to avoid SSR issues with Leaflet
const MapPanel = dynamic(() => import("@/components/MapPanel"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface-container animate-pulse flex items-center justify-center">
    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Initialising Map Engine...</span>
  </div>
});

import { calculateDistance } from "@/lib/geo";

export default function DispatchPage() {
  const [patientArea, setPatientArea] = useState("");
  const [patientCoords, setPatientCoords] = useState<{lat: number, lng: number} | null>(null);
  const [selectedPhleb, setSelectedPhleb] = useState<any>(null);
  const [phlebotomists, setPhlebotomists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for available phlebotomists
    const q = query(collection(db, "phlebotomists"), where("status", "==", "active"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhlebotomists(data);
    });

    return () => unsubscribe();
  }, []);

  // Calculate distances and sort phlebotomists
  const sortedPhlebotomists = [...phlebotomists].map(p => {
    if (patientCoords && p.lat && p.lng) {
      return { ...p, distance: calculateDistance(patientCoords.lat, patientCoords.lng, p.lat, p.lng) };
    }
    return { ...p, distance: Infinity };
  }).sort((a, b) => a.distance - b.distance);

  const handleDispatch = async () => {
    if (!selectedPhleb || !patientArea) {
      alert("Missing required dispatch parameters.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "assignments"), {
        phlebId: selectedPhleb.id,
        phlebName: selectedPhleb.name,
        patientArea,
        patientLat: patientCoords?.lat || null,
        patientLng: patientCoords?.lng || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Dispatch successful: Operative assigned.");
      setPatientArea("");
      setPatientCoords(null);
      setSelectedPhleb(null);
    } catch (error) {
      console.error("Dispatch error:", error);
      alert("System failure: Dispatch record rejected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dispatch-page h-[calc(100vh-10rem)] flex flex-col gap-lg animate-fade-in">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-lg overflow-hidden">
        {/* Left Panel: Unit Selection (40%) */}
        <section className="lg:col-span-4 flex flex-col gap-lg overflow-hidden">
          <div className="bg-surface-container border border-outline-variant p-lg rounded-xl shadow-glow space-y-md">
            <div className="space-y-xs">
              <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] px-1">Target Patient Area</label>
              <AddressSearch onSelect={(result) => {
                setPatientArea(result.display_name);
                setPatientCoords({ lat: result.lat, lng: result.lng });
              }} />
              {patientCoords && (
                <div className="flex items-center gap-2 mt-2 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_8px_rgba(0,200,150,0.5)]"></span>
                  <span className="text-[9px] font-data text-outline-variant uppercase">
                    Pinpointed: {patientCoords.lat.toFixed(4)}° N, {patientCoords.lng.toFixed(4)}° E
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-xl flex-1 flex flex-col overflow-hidden shadow-glow">
            <div className="px-lg py-md border-b border-outline-variant bg-surface-container-high/50 flex justify-between items-center">
              <div className="flex items-center gap-sm">
                <span className="icon text-primary-container text-[18px]">group</span>
                <span className="text-[10px] font-black text-text uppercase tracking-widest">
                  {patientCoords ? "Closest Available Units" : "Available Units"}
                </span>
              </div>
              <span className="text-[9px] bg-primary-container/10 text-primary-container px-2 py-0.5 rounded border border-primary-container/20 font-bold">REAL-TIME</span>
            </div>
            <div className="flex-1 overflow-y-auto p-md space-y-md custom-scrollbar">
              {sortedPhlebotomists.map((phleb, idx) => (
                <div 
                  key={phleb.id}
                  onClick={() => setSelectedPhleb(phleb)}
                  className={`p-lg rounded-lg border transition-all cursor-pointer group relative overflow-hidden ${
                    selectedPhleb?.id === phleb.id 
                      ? "border-primary-container bg-primary-container/5 shadow-[0_0_15px_rgba(0,200,150,0.1)]" 
                      : "border-outline-variant bg-background hover:border-outline hover:bg-surface-variant/20"
                  }`}
                >
                  {selectedPhleb?.id === phleb.id && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-container shadow-[0_0_8px_rgba(0,200,150,1)]"></div>
                  )}
                  {idx === 0 && patientCoords && phleb.distance !== Infinity && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary-container text-on-primary-container text-[8px] font-black uppercase tracking-tighter rounded-bl">Best Match</div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-[14px] font-bold text-text group-hover:text-primary-container transition-colors uppercase tracking-tight">{phleb.name}</div>
                      <div className="text-[10px] text-outline-variant font-data mt-0.5">{phleb.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-data text-primary-container font-bold">
                        {phleb.distance === Infinity ? "N/A" : `${phleb.distance.toFixed(1)} KM`}
                      </div>
                      <div className="text-[9px] text-outline-variant uppercase font-bold tracking-tighter">Distance</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {phleb.specialisations?.slice(0, 3).map((spec: string) => (
                      <span key={spec} className="text-[8px] font-bold bg-surface-variant/50 text-outline px-2 py-0.5 rounded border border-outline-variant/30 uppercase tracking-tighter">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {phlebotomists.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2 py-xl">
                  <span className="icon text-3xl">cloud_off</span>
                  <span className="text-[11px] font-data uppercase font-bold tracking-widest">No active units found</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Panel: Map & Dispatch (60%) */}
        <section className="lg:col-span-6 bg-surface-container border border-outline-variant rounded-xl overflow-hidden relative flex flex-col shadow-glow">
          <div className="flex-1 relative">
            <MapPanel 
              patientLat={patientCoords?.lat} 
              patientLng={patientCoords?.lng}
              phlebotomists={phlebotomists} 
              selectedId={selectedPhleb?.id}
              onSelectPhlebotomist={(id) => setSelectedPhleb(phlebotomists.find(p => p.id === id))}
            />
            
            {/* Map Overlay Info */}
            <div className="absolute bottom-6 left-6 p-lg bg-background/90 backdrop-blur-md border border-outline-variant rounded-xl shadow-glow max-w-[240px] pointer-events-none group z-[1000]">
              <div className="text-[10px] font-black text-primary-container uppercase mb-2 tracking-[0.1em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_rgba(0,200,150,1)]"></span>
                SITUATIONAL DATA
              </div>
              <p className="text-[11px] text-outline font-data leading-relaxed opacity-80">Distribution based on proximity and operational bandwidth.</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-lg bg-surface-container-high/80 backdrop-blur-md border-t border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-lg">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                selectedPhleb ? "bg-primary-container/10 border-primary-container/30" : "bg-background border-outline-variant"
              }`}>
                <span className={`icon text-[24px] ${selectedPhleb ? "text-primary-container" : "text-outline-variant"}`}>
                  {selectedPhleb ? "person_check" : "person_search"}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-outline-variant uppercase font-black tracking-[0.1em]">Selected Operative</div>
                <div className={`text-[15px] font-technical font-bold uppercase ${selectedPhleb ? "text-text" : "text-outline-variant/50 italic"}`}>
                  {selectedPhleb ? selectedPhleb.name : "Waiting for selection..."}
                </div>
              </div>
            </div>
            <button 
              onClick={handleDispatch}
              disabled={loading || !selectedPhleb || !patientArea}
              className={`px-xl h-14 rounded-xl font-bold text-[13px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                loading || !selectedPhleb || !patientArea
                  ? "bg-surface-variant text-outline-variant cursor-not-allowed border border-outline-variant/30"
                  : "bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(0,200,150,0.3)] hover:bg-primary active:scale-95"
              }`}
            >
              <span className="icon text-[20px]">{loading ? "sync" : "flash_on"}</span>
              {loading ? "TRANSMITTING..." : "INITIATE DISPATCH"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
