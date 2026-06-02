const ShortcutModal = ({ onClose }) => {
  const shortcuts = [
    { key: "Ctrl + K", action: "Open Command Palette" },
    { key: "Esc", action: "Close Modal / Search" },
    { key: "Ctrl + Enter", action: "Send Message" },
    { key: "Ctrl + P", action: "Pin Message" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-96">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="font-mono bg-slate-800 px-2 py-1 rounded text-blue-400">{s.key}</span>
              <span className="text-slate-300">{s.action}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg">Close</button>
      </div>
    </div>
  );
};

export default ShortcutModal;
