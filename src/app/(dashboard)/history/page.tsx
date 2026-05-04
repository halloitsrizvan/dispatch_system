"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import "./history.css";

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "assignments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredHistory = assignments.filter(h => 
    h.patientArea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.phlebName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ["Area", "Phlebotomist", "Status", "Time"];
    const rows = filteredHistory.map(h => [
      h.patientArea, 
      h.phlebName, 
      h.status, 
      h.createdAt?.toDate ? new Date(h.createdAt.toDate()).toLocaleString() : "..."
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hc_dispatch_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="history-page animate-fade-in">
      <section className="filter-bar glass">
        <div className="search-box">
          <span className="icon" style={{ fontSize: '18px', color: 'var(--primary-container)' }}>search</span>
          <input 
            type="text" 
            placeholder="Search by area, unit, or status..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-select">
            <span className="icon" style={{ fontSize: '16px' }}>history</span>
            <span className="text-[10px] font-bold text-outline uppercase ml-2">Total Records: {assignments.length}</span>
          </div>
          <button onClick={exportCSV} className="export-btn">
            <span className="icon" style={{ fontSize: '18px' }}>download</span>
            EXPORT CSV
          </button>
        </div>
      </section>

      <section className="table-card glass">
        <div className="table-container">
          {loading ? (
            <div className="p-xl text-center font-technical text-outline uppercase tracking-widest animate-pulse">Syncing Database...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Operational Area</th>
                  <th>Assigned Unit</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <div className="area-cell">
                        <span className="icon" style={{ fontSize: '14px' }}>location_on</span>
                        <span>{h.patientArea}</span>
                      </div>
                    </td>
                    <td><strong className="text-primary-container">{h.phlebName}</strong></td>
                    <td>
                      <span className={`status-badge ${h.status}`}>
                        {h.status?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="font-data text-[12px] opacity-70">
                        {h.createdAt?.toDate ? new Date(h.createdAt.toDate()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "..."}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-xl text-center opacity-30 italic">No historical records found for this query.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {!loading && (
          <footer className="table-footer">
            <span>Displaying {filteredHistory.length} of {assignments.length} assignments</span>
          </footer>
        )}
      </section>
    </div>
  );
}

