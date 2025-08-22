"use client";
import ErrorTap from "./ErrorTap";

export default function Probe() {
  return (
    <main style={{padding:16}}>
      <ErrorTap />
      <h1>Probe</h1>
      <button onClick={() => alert("client ok")}>Ping</button>
    </main>
  );
}