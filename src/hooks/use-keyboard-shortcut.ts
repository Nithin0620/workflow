import { useEffect } from "react";

type KeyCombo = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMetaOrCtrl = combo.metaKey
        ? event.metaKey || event.ctrlKey
        : true;
      const matchesKey = event.key.toLowerCase() === combo.key.toLowerCase();
      const matchesShift =
        combo.shiftKey === undefined || event.shiftKey === combo.shiftKey;
      const matchesAlt =
        combo.altKey === undefined || event.altKey === combo.altKey;

      if (isMetaOrCtrl && matchesKey && matchesShift && matchesAlt) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [combo, callback, enabled]);
}
