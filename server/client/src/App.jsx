import { useEffect, useState } from "react";
import axios from "axios";

// Relative path for production (Render serves both)
const API = import.meta.env.VITE_API_URL || "";

function App() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [links, setLinks] = useState([]); 
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`${API}/links`);
      if (Array.isArray(res.data)) {
        setLinks(res.data);
        setError(null);
      } else {
        setLinks([]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Cannot connect to the server. Check if backend is live.");
    }
  };

  const addLink = async () => {
    if (!url) return alert("URL is required");
    try {
      await axios.post(`${API}/links`, {
        url,
        title,
        tags: tags.split(",").map((t) => t.trim()).filter(t => t !== "")
      });
      setUrl(""); setTitle(""); setTags("");
      fetchLinks();
    } catch (err) {
      alert("Error adding link. Check console for details.");
    }
  };

  const checkLink = async (id) => {
    setLoading(true);
    try {
      await axios.post(`${API}/links/${id}/check`);
      alert("AI Summary generated!");
      fetchLinks();
    } catch (err) {
      console.error("Check Error:", err);
      alert("AI check failed. Ensure Gemini API Key is valid.");
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (id) => {
    try {
      const res = await axios.get(`${API}/links/${id}/history`);
      setSelectedHistory(Array.isArray(res.data) ? res.data : []);
      // Scroll to history section automatically
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (err) {
      alert("Could not load history");
    }
  };

  return (
    <div className="container">
      <h1>Web Monitor AI</h1>

      {error && (
        <div style={{ background: "#ffeeee", padding: "10px", borderRadius: "5px", color: "red", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card">
        <h2>Add New Link</h2>
        <input placeholder="URL (https://...)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <button onClick={addLink}>Add Link</button>
      </div>

      <h2>Saved Links</h2>
      <div className="links-grid">
        {links.length > 0 ? (
          links.map((link) => (
            <div key={link._id} className="card">
              <strong>{link.title || "Untitled"}</strong>
              <p style={{ fontSize: "0.8em", color: "#666", overflow: "hidden", textOverflow: "ellipsis" }}>{link.url}</p>
              {link.tags?.length > 0 && <p><small>Tags: {link.tags.join(", ")}</small></p>}

              <div style={{ marginTop: "10px" }}>
                <button onClick={() => checkLink(link._id)} disabled={loading}>
                  {loading ? "AI is thinking..." : "Check Now"}
                </button>
                <button className="secondary" style={{ marginLeft: 10 }} onClick={() => viewHistory(link._id)}>
                  View History
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No links saved yet. Add one above!</p>
        )}
      </div>

      {selectedHistory && (
        <div id="history-section" style={{ marginTop: "40px", borderTop: "2px solid #eee", paddingTop: "20px" }}>
          <h2>Check History</h2>
          {selectedHistory.length > 0 ? (
            selectedHistory.map((item) => (
              <div key={item._id} className="card" style={{ borderLeft: "5px solid #007bff" }}>
                <p><strong>AI Summary:</strong></p>
                <p>{item.summary || "No summary generated."}</p>
                <details>
                  <summary style={{ cursor: "pointer", color: "#007bff" }}>View Content Changes</summary>
                  <pre style={{ whiteSpace: "pre-wrap", background: "#f8f9fa", padding: "10px", fontSize: "0.85em" }}>
                    {item.diff || "No changes detected."}
                  </pre>
                </details>
                <p><small>Checked on: {new Date(item.checkedAt).toLocaleString()}</small></p>
              </div>
            ))
          ) : (
            <p>No history found for this link.</p>
          )}
          <button onClick={() => setSelectedHistory(null)} className="secondary">Close History</button>
        </div>
      )}
    </div>
  );
}

export default App;