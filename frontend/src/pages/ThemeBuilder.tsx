import React, { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

/** Utility to convert hex color to rgb components */
function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace(/^#/, "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

/** Apply custom colors to CSS variables */
function applyCustomTheme(colors: { primary?: string; accent?: string }) {
  const root = document.documentElement;
  if (colors.primary) {
    const [r, g, b] = hexToRgb(colors.primary);
    root.style.setProperty("--color-primary", `${r}, ${g}, ${b}`);
  }
  if (colors.accent) {
    const [r, g, b] = hexToRgb(colors.accent);
    root.style.setProperty("--color-accent", `${r}, ${g}, ${b}`);
  }
}

const ThemeBuilder: React.FC = () => {
  const [primary, setPrimary] = useState<string>("#00d9ff"); // default cyan
  const [accent, setAccent] = useState<string>("#ffa500"); // default orange

  // Load saved custom theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("custom-theme");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { primary?: string; accent?: string };
        if (parsed.primary) setPrimary(parsed.primary);
        if (parsed.accent) setAccent(parsed.accent);
        applyCustomTheme(parsed);
      } catch {}
    }
  }, []);

  const handleSave = () => {
    const payload = { primary, accent };
    localStorage.setItem("custom-theme", JSON.stringify(payload));
    applyCustomTheme(payload);
    alert("Custom theme saved and applied!");
  };

  const handleReset = () => {
    localStorage.removeItem("custom-theme");
    // Reset to defaults defined in design‑tokens.css by removing overrides
    const root = document.documentElement;
    root.style.removeProperty("--color-primary");
    root.style.removeProperty("--color-accent");
    setPrimary("#00d9ff");
    setAccent("#ffa500");
    alert("Custom theme reset to default.");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Custom Theme Builder</h1>
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-medium mb-2">Primary Color</h2>
          <HexColorPicker color={primary} onChange={setPrimary} />
          <div className="mt-2">
            <input
              type="text"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="border rounded p-1 w-32"
            />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-medium mb-2">Accent Color</h2>
          <HexColorPicker color={accent} onChange={setAccent} />
          <div className="mt-2">
            <input
              type="text"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="border rounded p-1 w-32"
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition"
          >
            Save Theme
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeBuilder;
