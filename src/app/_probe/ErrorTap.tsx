"use client";
import { useEffect } from "react";

export default function ErrorTap() {
  useEffect(() => {
    const onErr = (e: ErrorEvent) => console.error("[window.onerror]", e.error || e.message);
    const onRej = (e: PromiseRejectionEvent) => console.error("[unhandledrejection]", e.reason);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);
  return null;
}