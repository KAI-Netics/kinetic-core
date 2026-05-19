const API_BASE = "http://localhost:3030";

export async function fetchMissions() {
  const res = await fetch(`${API_BASE}/missions`);

  if (!res.ok) {
    throw new Error("Failed to load missions");
  }

  return res.json();
}