// PUBLIC_INTERFACE
/**
 * API Helper for notes backend.
 * All functions return Promises and auto-detect API_BASE_URL (from REACT_APP_NOTES_API_URL) or fallback.
 * Use these to perform CRUD if backend is present.
 */

const API_BASE_URL = process.env.REACT_APP_NOTES_API_URL || null;

export async function fetchNotes() {
  if (!API_BASE_URL) throw new Error("No backend configured.");
  const res = await fetch(`${API_BASE_URL}/notes`);
  if (!res.ok) throw new Error("Failed to fetch notes.");
  return res.json();
}

export async function createNote(note) {
  if (!API_BASE_URL) throw new Error("No backend configured.");
  const res = await fetch(`${API_BASE_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error("Failed to create note.");
  return res.json();
}

export async function updateNote(id, changes) {
  if (!API_BASE_URL) throw new Error("No backend configured.");
  const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error("Failed to update note.");
  return res.json();
}

export async function deleteNote(id) {
  if (!API_BASE_URL) throw new Error("No backend configured.");
  const res = await fetch(`${API_BASE_URL}/notes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note.");
  return true;
}
