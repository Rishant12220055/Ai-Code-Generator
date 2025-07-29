"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground py-12 px-4">
      <div className="bg-card rounded-2xl shadow-lg p-8 w-full max-w-md">
        <Button variant="ghost" className="mb-4 text-foreground hover:bg-muted" onClick={() => router.back()}>
          ← Back
        </Button>
        <h2 className="text-2xl font-bold mb-6 text-center">Settings</h2>
        <div className="space-y-4">
          <ThemeSelect />
          <div>
            <label className="block text-gray-700 font-medium mb-1">Notifications</label>
            <input type="checkbox" className="mr-2" />
            <span className="text-gray-600">Enable email notifications</span>
          </div>
        </div>
        <Button className="w-full mt-6 bg-black text-white hover:bg-gray-800">Save Changes</Button>
      </div>
    </div>
  );
}

import { useTheme } from "next-themes";
import { useEffect } from "react";
function ThemeSelect() {
  const { theme, setTheme } = useTheme();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage on change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', e.target.value);
    }
  };

  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1">Theme</label>
      <select
        className="w-full border border-gray-200 rounded px-3 py-2"
        value={theme || "system"}
        onChange={handleChange}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
