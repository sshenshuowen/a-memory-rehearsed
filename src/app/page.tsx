import MonitorView from "./components/MonitorView";

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  return <MonitorView baseUrl={baseUrl} />;
}
