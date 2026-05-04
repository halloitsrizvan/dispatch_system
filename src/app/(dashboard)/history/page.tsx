"use client";

import { useState } from "react";
import "./history.css";

// Mock Data
const MOCK_HISTORY = [
  { id: "1", area: "Kozhikode Beach", phlebotomist: "Rahul K.", dispatcher: "admin@hc.dispatch", time: "2024-05-01 10:30 AM", notes: "Urgent collection" },
  { id: "2", area: "Mavoor Road", phlebotomist: "Anjali M.", dispatcher: "sarah@hc.dispatch", time: "2024-05-01 11:15 AM", notes: "Geriatric patient" },
  { id: "3", area: "Nadakkavu", phlebotomist: "Suresh P.", dispatcher: "admin@hc.dispatch", time: "2024-04-30 02:45 PM", notes: "" },
  { id: "4", area: "Kallayi", phlebotomist: "Deepa V.", dispatcher: "john@hc.dispatch", time: "2024-04-30 04:20 PM", notes: "Pediatric case" },
  { id: "5", area: "Palayam", phlebotomist: "Arun J.", dispatcher: "admin@hc.dispatch", time: "2024-04-30 05:00 PM", notes: "" },
];

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const exportCSV = () => {
    const headers = ["Area", "Phlebotomist", "Dispatcher", "Time", "Notes"];
    const rows = MOCK_HISTORY.map(h => [h.area, h.phlebotomist, h.dispatcher, h.time, h.notes]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hc_dispatch_history.csv";
    link.click();
  };

  return (
    <div className="history-page animate-fade-in">
      <section className="filter-bar glass">
        <div className="search-box">
          <span className="icon" style={{ fontSize: '18px', color: 'var(--primary-container)' }}>search</span>
          <input 
            type="text" 
            placeholder="Filter by area, unit, or dispatcher..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-select">
            <span className="icon" style={{ fontSize: '16px' }}>calendar_month</span>
            <select><option>LAST 24 HOURS</option></select>
          </div>
          <button onClick={exportCSV} className="export-btn">
            <span className="icon" style={{ fontSize: '18px' }}>download</span>
            EXPORT LOG
          </button>
        </div>
      </section>

      <section className="table-card glass">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Operational Area</th>
                <th>Assigned Unit</th>
                <th>Dispatcher ID</th>
                <th>Timestamp</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HISTORY.map((h) => (
                <tr key={h.id}>
                  <td>
                    <div className="area-cell">
                      <span className="icon" style={{ fontSize: '14px' }}>location_on</span>
                      <span>{h.area}</span>
                    </div>
                  </td>
                  <td><strong>{h.phlebotomist}</strong></td>
                  <td>{h.dispatcher}</td>
                  <td>{h.time}</td>
                  <td className="notes-cell">{h.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="table-footer">
          <span>Displaying 5 of 128 recorded entries</span>
          <div className="pagination">
            <button className="page-num active">01</button>
            <button className="page-num">02</button>
            <button className="page-num">03</button>
            <span style={{ margin: '0 8px' }}>...</span>
            <button className="page-num">24</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

