import { useState, useEffect } from "react";

function App() {
  const [profile, setProfile] = useState({});

  useEffect(() => {
    chrome.storage.local.get(["profile"], (result) => {
      if (result.profile) setProfile(result.profile);
    });
  }, []);

  const saveProfile = () => {
    chrome.storage.local.set({ profile }, () => alert("Profile saved!"));
  };

  const autoFill = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "fillForm", profile });
    });
  };

  return (
    <div className="p-4 w-72">
      <h1 className="text-lg font-bold mb-3">Form Auto-Filler</h1>

      {["Name","Roll","Email","Phone","Department"].map((field) => (
        <input
          key={field}
          className="border p-2 mb-2 w-full rounded"
          placeholder={field}
          value={profile[field.toLowerCase()] || ""}
          onChange={(e) =>
            setProfile({ ...profile, [field.toLowerCase()]: e.target.value })
          }
        />
      ))}

      <button onClick={saveProfile} className="bg-blue-600 text-white px-3 py-2 rounded w-full mb-2">Save Profile</button>
      <button onClick={autoFill} className="bg-green-600 text-white px-3 py-2 rounded w-full">Auto Fill Current Form</button>
      <p className="text-xs text-gray-500 mt-2">Profile stored locally.</p>
    </div>
  );
}

export default App;
