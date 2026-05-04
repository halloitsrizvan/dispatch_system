"use client";

import { useState } from "react";
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  Edit3,
  Loader2
} from "lucide-react";
import "./settings.css";

// Mock Data
const MOCK_USERS = [
  { id: "1", email: "admin@healthycart.com", role: "admin" },
  { id: "2", email: "dispatcher1@healthycart.com", role: "dispatcher" },
  { id: "3", email: "dispatcher2@healthycart.com", role: "dispatcher" },
];

export default function SettingsPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [loading, setLoading] = useState(false);

  const deleteUser = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="settings-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1>System Settings</h1>
          <p>Manage internal user accounts and role-based permissions.</p>
        </div>
        <button className="add-user-button">
          <UserPlus size={20} />
          Add Internal User
        </button>
      </header>

      <section className="settings-grid">
        <div className="settings-card glass">
          <div className="card-header">
            <Shield size={20} className="header-icon" />
            <h2>Internal Accounts</h2>
          </div>
          
          <div className="user-list">
            {users.map((user) => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <div className="user-avatar">{user.email[0].toUpperCase()}</div>
                  <div className="user-text">
                    <span className="user-email">{user.email}</span>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </div>
                </div>
                <div className="user-actions">
                  <button className="icon-button"><Edit3 size={18} /></button>
                  <button onClick={() => deleteUser(user.id)} className="icon-button delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-card glass">
          <div className="card-header">
            <Mail size={20} className="header-icon" />
            <h2>System Notifications</h2>
          </div>
          <div className="settings-form">
            <div className="setting-toggle">
              <div className="toggle-text">
                <span className="toggle-label">Email on New Assignment</span>
                <span className="toggle-desc">Send notification to phlebotomist when assigned.</span>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="setting-toggle">
              <div className="toggle-text">
                <span className="toggle-label">Weekly Reports</span>
                <span className="toggle-desc">Send automated performance reports to admins.</span>
              </div>
              <input type="checkbox" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
