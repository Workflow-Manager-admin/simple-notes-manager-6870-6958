import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

// ***** CONFIGURE BACKEND URL HERE, fallback is null for local in-memory *****
const API_BASE_URL = process.env.REACT_APP_NOTES_API_URL || null;

// PUBLIC_INTERFACE
function App() {
  // STATE
  const [notes, setNotes] = useState([]); // {id, title, content, updated_at}
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [theme] = useState("light"); // always light as per request
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Memo: filter notes for search
  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    );
  }, [notes, search]);

  // Selected note logic
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // Effect: fetch notes on load if API exists
  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line
  }, []);

  // Load notes from backend or fallback to localStorage/in-memory
  async function loadNotes() {
    setLoading(true);
    setErr("");
    try {
      // Try REST API
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/notes`);
        if (!res.ok) throw new Error("Failed to fetch notes");
        const data = await res.json();
        setNotes(data);
        setLoading(false);
        return;
      }
    } catch (e) {
      setErr(e.message);
    }
    // Fallback: local browser storage (demo)
    const local = localStorage.getItem("notes_app_notes");
    if (local) {
      setNotes(JSON.parse(local));
    } else {
      setNotes([]);
    }
    setLoading(false);
  }

  // Helper: persist locally if no backend
  function persistLocal(newNotes) {
    if (!API_BASE_URL) {
      localStorage.setItem("notes_app_notes", JSON.stringify(newNotes));
    }
  }

  // PUBLIC_INTERFACE
  async function handleCreate() {
    // Make a blank new note (default)
    const note = {
      title: "Untitled Note",
      content: "",
      updated_at: new Date().toISOString(),
    };
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(note),
        });
        if (!res.ok) throw new Error("Failed to create note");
        const created = await res.json();
        await loadNotes();
        setSelectedNoteId(created.id);
        setEditing(true);
        return;
      }
      // Local fallback
      const id = Date.now().toString();
      const newNotes = [
        ...notes,
        { ...note, id },
      ];
      setNotes(newNotes);
      persistLocal(newNotes);
      setSelectedNoteId(id);
      setEditing(true);
    } catch (e) {
      setErr(e.message);
    }
  }

  // PUBLIC_INTERFACE
  async function handleDelete(noteId) {
    if (!window.confirm("Delete this note?")) return;
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete.");
        await loadNotes();
        setSelectedNoteId(null);
        setEditing(false);
        return;
      }
      const newNotes = notes.filter((n) => n.id !== noteId);
      setNotes(newNotes);
      persistLocal(newNotes);
      setSelectedNoteId(null);
      setEditing(false);
    } catch (e) {
      setErr(e.message);
    }
  }

  // PUBLIC_INTERFACE
  async function handleSave(noteId, noteData) {
    noteData.updated_at = new Date().toISOString();
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(noteData),
        });
        if (!res.ok) throw new Error("Failed to save note");
        await loadNotes();
        setEditing(false);
        return;
      }
      // Update local
      const newNotes = notes.map((n) =>
        n.id === noteId ? { ...noteData, id: noteId } : n
      );
      setNotes(newNotes);
      persistLocal(newNotes);
      setEditing(false);
    } catch (e) {
      setErr(e.message);
    }
  }

  // PUBLIC_INTERFACE
  function handleSelect(noteId) {
    setSelectedNoteId(noteId);
    setEditing(false);
  }

  // PUBLIC_INTERFACE
  function handleSearch(e) {
    setSearch(e.target.value);
  }

  // ----- UI COMPONENTS -----

  // Sidebar: shows title, new, search, nav
  function Sidebar() {
    return (
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="app-icon">📝</span>
          <span className="app-title">Notes</span>
        </div>
        <button className="btn btn-accent" onClick={handleCreate}>
          + New Note
        </button>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={handleSearch}
          />
        </div>
        <nav className="notes-list">
          {loading && <div className="notes-loading">Loading…</div>}
          {filteredNotes.length === 0 && !loading && (
            <div className="notes-empty">No notes found</div>
          )}
          {filteredNotes.map((n) => (
            <div
              key={n.id}
              className={
                "note-list-item" +
                (selectedNoteId === n.id ? " selected" : "")
              }
              onClick={() => handleSelect(n.id)}
            >
              <div className="note-title">{n.title || "Untitled"}</div>
              <div className="note-mod">
                {n.updated_at
                  ? new Date(n.updated_at).toLocaleDateString()
                  : ""}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    );
  }

  // Header with app title/branding
  function Header() {
    return (
      <header className="main-header">
        <div className="header-title">Simple Notes</div>
      </header>
    );
  }

  // Main area for displaying and/or editing a note
  function MainArea() {
    if (!selectedNote) {
      return (
        <main className="main-area main-empty">
          <div className="empty-message">Select or create a note to begin</div>
        </main>
      );
    }
    if (editing) {
      return (
        <NoteEditor
          note={selectedNote}
          onSave={(changes) => handleSave(selectedNote.id, changes)}
          onCancel={() => setEditing(false)}
        />
      );
    }
    return (
      <main className="main-area">
        <div className="main-noteheader">
          <div className="main-title">{selectedNote.title || "Untitled"}</div>
          <div>
            <button
              className="btn btn-primary"
              style={{ marginRight: 8 }}
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleDelete(selectedNote.id)}
            >
              Delete
            </button>
          </div>
        </div>
        <div className="main-content">
          <pre className="note-content">{selectedNote.content}</pre>
        </div>
        <div className="main-updated">
          Last updated:{" "}
          {selectedNote.updated_at
            ? new Date(selectedNote.updated_at).toLocaleString()
            : "--"}
        </div>
      </main>
    );
  }

  return (
    <div className="app-wrapper" data-theme={theme}>
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        {err && <div className="err-banner">{err}</div>}
        <MainArea />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({ note, onSave, onCancel }) {
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  // Save on Enter in title
  function onEnter(e) {
    if (e.key === "Enter") e.target.blur();
  }
  // PUBLIC_INTERFACE
  function handleSubmit(e) {
    e.preventDefault();
    onSave({ title: title.trim(), content });
  }

  return (
    <main className="main-area">
      <form className="note-editor" onSubmit={handleSubmit}>
        <input
          className="edit-title"
          type="text"
          aria-label="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onEnter}
          autoFocus
          required
        />
        <textarea
          className="edit-content"
          aria-label="Note content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          required
        />
        <div className="editor-actions">
          <button className="btn btn-primary" type="submit">
            Save
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

export default App;
