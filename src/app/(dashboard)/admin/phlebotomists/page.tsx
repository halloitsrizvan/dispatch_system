"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";

export default function PhlebotomistsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [phlebotomists, setPhlebotomists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "phlebotomists"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhlebotomists(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to decommission this operative record?")) {
      try {
        await deleteDoc(doc(db, "phlebotomists", id));
      } catch (error) {
        console.error("Error deleting phlebotomist:", error);
        alert("Action failed: Security clearance required.");
      }
    }
  };

  const filteredPhlebotomists = phlebotomists.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone?.includes(searchTerm)
  );

  return (
    <div className="flex flex-col gap-lg animate-fade-in pb-xl">
      <header className="flex justify-between items-end mb-md">
        <div>
          <h1 className="font-technical text-2xl font-semibold text-text uppercase">OPERATIVE DIRECTORY</h1>
          <p className="font-label text-[11px] text-outline uppercase tracking-widest">Personnel Management & Deployment Radius Control</p>
        </div>
        <Link href="/admin/phlebotomists/new" className="btn-primary py-lg px-xl h-12 shadow-glow">
          <span className="icon" style={{ fontSize: '20px' }}>person_add</span>
          ADD NEW OPERATIVE
        </Link>
      </header>

      <section className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden shadow-glow">
        {/* Search & Filter Bar */}
        <div className="p-md px-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-variant">
          <div className="flex items-center gap-md bg-background border border-outline-variant p-2 px-4 rounded-lg w-full max-w-[360px] group transition-all focus-within:border-primary-container">
            <span className="icon text-outline group-focus-within:text-primary-container" style={{ fontSize: '18px' }}>search</span>
            <input 
              type="text" 
              placeholder="Search by name, UID or contact..." 
              className="bg-transparent border-none outline-none w-full text-text font-data text-[13px] placeholder:text-outline/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-sm">
             <span className="font-data text-[10px] text-outline uppercase">Active Nodes: {phlebotomists.filter(p => p.status === 'active').length}</span>
             <div className="w-1 h-1 bg-outline rounded-full"></div>
             <span className="font-data text-[10px] text-outline uppercase">Total: {phlebotomists.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-md">
              <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
              <p className="text-outline font-data text-[11px] uppercase tracking-widest">Syncing with secure operative vault...</p>
            </div>
          ) : filteredPhlebotomists.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-md">
               <span className="icon text-outline/20 text-[48px]">person_search</span>
               <p className="text-outline font-data text-[11px] uppercase tracking-widest">No matching operative records found</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-outline-variant">
                  <th className="text-left py-3 px-6 text-outline font-label text-[11px] font-bold uppercase tracking-wider">Operative Name / ID</th>
                  <th className="text-left py-3 px-6 text-outline font-label text-[11px] font-bold uppercase tracking-wider">Contact Vector</th>
                  <th className="text-left py-3 px-6 text-outline font-label text-[11px] font-bold uppercase tracking-wider">EXP / Radius</th>
                  <th className="text-left py-3 px-6 text-outline font-label text-[11px] font-bold uppercase tracking-wider">Service Status</th>
                  <th className="text-right py-3 px-6 text-outline font-label text-[11px] font-bold uppercase tracking-wider">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredPhlebotomists.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-variant/20 transition-colors group">
                    <td className="py-4 px-6 flex items-center gap-md">
                      <div className="w-10 h-10 bg-surface-variant border border-outline-variant text-text rounded flex items-center justify-center font-technical font-bold text-lg group-hover:border-primary-container transition-colors">
                        {(p.name || "U")[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                         <span className="font-technical text-[14px] font-bold text-text">{p.name}</span>
                         <span className="font-data text-[10px] text-outline uppercase tracking-tighter">UID: {p.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-sm">
                             <span className="icon text-outline text-[14px]">call</span>
                             <span className="font-data text-[12px] text-text">{p.phone}</span>
                          </div>
                          {p.whatsapp && (
                            <div className="flex items-center gap-sm">
                               <span className="icon text-primary-container text-[14px]">chat</span>
                               <span className="font-data text-[12px] text-outline">{p.whatsapp}</span>
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex flex-col">
                          <span className="font-label text-[12px] text-text font-bold uppercase">{p.experience} Years EXP</span>
                          <span className="font-data text-[11px] text-primary-container uppercase tracking-tight">{p.radius} KM Radius</span>
                       </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${
                           p.status === 'active' ? 'bg-primary-container shadow-[0_0_8px_rgba(0,200,150,0.5)]' : 
                           p.status === 'on_leave' ? 'bg-tertiary' : 'bg-error'
                         }`}></div>
                         <span className={`text-[10px] font-bold uppercase font-label tracking-widest ${
                           p.status === 'active' ? 'text-primary-container' : 
                           p.status === 'on_leave' ? 'text-tertiary' : 'text-error'
                         }`}>
                           {p.status?.replace("_", " ")}
                         </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/admin/phlebotomists/${p.id}`} 
                          className="w-9 h-9 flex items-center justify-center text-outline border border-outline-variant rounded hover:border-primary-container hover:text-primary-container bg-background/50 transition-all"
                          title="Edit Record"
                        >
                          <span className="icon" style={{ fontSize: '18px' }}>edit</span>
                        </Link>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="w-9 h-9 flex items-center justify-center text-outline border border-outline-variant rounded hover:border-error hover:text-error bg-background/50 transition-all"
                          title="Delete Record"
                        >
                          <span className="icon" style={{ fontSize: '18px' }}>delete_forever</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Footer System Info */}
      <footer className="mt-lg text-center space-y-xs opacity-50">
        <p className="font-data text-[10px] text-outline uppercase tracking-tighter">Operative Management Framework v2.4</p>
        <p className="font-data text-[10px] text-outline">Terminal ID: DC-04-A | High Security Access Enabled</p>
      </footer>
    </div>
  );
}
