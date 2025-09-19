// src/App.jsx
import { useState, useEffect } from "react";

function App() {
  const [profile, setProfile] = useState({
    name: "",
    roll: "",
    email: "",
    phone: "",
    department: ""
  });

  useEffect(() => {
    // Prefer chrome.storage (works when running as extension)
    if (typeof chrome !== "undefined" && chrome?.storage?.local) {
      chrome.storage.local.get(["profile"], (result) => {
        if (result.profile) setProfile(result.profile);
      });
    } else {
      const stored = localStorage.getItem("gff_profile");
      if (stored) setProfile(JSON.parse(stored));
    }
  }, []);

  const saveProfile = () => {
    if (typeof chrome !== "undefined" && chrome?.storage?.local) {
      chrome.storage.local.set({ profile }, () => alert("Profile saved to chrome.storage.local"));
    } else {
      localStorage.setItem("gff_profile", JSON.stringify(profile));
      alert("Profile saved to localStorage");
    }
  };

  // Send profile with message so content script doesn't need to re-read storage
  const autoFill = () => {
    if (typeof chrome === "undefined" || !chrome.tabs) {
      alert("Auto-fill works only in Chrome extension context (load the built extension).");
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return alert("No active tab");
      chrome.tabs.sendMessage(tabs[0].id, { action: "fillForm", profile });
    });
  };

  return (
    <div className="p-4 w-80">
      <h1 className="text-lg font-bold mb-3">Form Auto-Filler (MVP)</h1>

      <input className="border p-2 mb-2 w-full rounded" placeholder="Full Name" value={profile.name}
        onChange={(e)=>setProfile({...profile, name: e.target.value})} />
      <input className="border p-2 mb-2 w-full rounded" placeholder="Roll / Student ID" value={profile.roll}
        onChange={(e)=>setProfile({...profile, roll: e.target.value})} />
      <input className="border p-2 mb-2 w-full rounded" placeholder="Email" value={profile.email}
        onChange={(e)=>setProfile({...profile, email: e.target.value})} />
      <input className="border p-2 mb-2 w-full rounded" placeholder="Phone" value={profile.phone}
        onChange={(e)=>setProfile({...profile, phone: e.target.value})} />
      <input className="border p-2 mb-3 w-full rounded" placeholder="Department" value={profile.department}
        onChange={(e)=>setProfile({...profile, department: e.target.value})} />

      <button onClick={saveProfile} className="bg-blue-600 text-white px-3 py-2 rounded w-full mb-2">Save Profile</button>
      <button onClick={autoFill} className="bg-green-600 text-white px-3 py-2 rounded w-full">Auto Fill Current Form</button>

      <p className="text-xs text-gray-500 mt-2">Profile stored locally in your browser (chrome.storage.local).</p>
    </div>
  );
}

export default App;
