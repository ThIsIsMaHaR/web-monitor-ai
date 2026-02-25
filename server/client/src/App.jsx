import { useEffect, useState } from "react";
import axios from "axios";

/**
 * API CONFIGURATION:
 * On Render, since we serve the frontend from the backend,
 * using a relative path like "" ensures the browser calls 
 * the same domain it's currently on.
 */
const API = import.meta.env.VITE_API_URL || "";

function App() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [links, setLinks] = useState([]); 
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [activeLinkName, setActiveLinkName] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`${API}/links`);
      setLinks(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Cannot connect to server. Check Render logs.");
    }
  };

  const addLink = async () => {
    if (!url) return alert("URL is required");
    
    // Auto-fix URL protocol if user forgets it
    const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
    
    try {
      await axios.post(`${API}/links`, {
        url: cleanUrl,
        title: title || "New Link",
        tags: tags.split(",").map((t) => t.trim()).filter(t => t !== "")
      });
      setUrl(""); setTitle(""); setTags("");
      fetchLinks(); // Refresh the list
    } catch (err) {
      console.error("Post Error:", err);
      alert("Error adding link. Check if server is live.");
    }
  };

  const checkLink = async (id, linkTitle) => {
    setLoading(true);
    try {
      await axios.post(`${API}/links/${id}/check`);
      await fetchLinks();
      await viewHistory(id, linkTitle); 
      alert("AI Check Complete!");
    } catch (err) {
      console.error("Check Error:", err);
      alert("AI check failed. Check Render logs for Gemini API errors.");
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (id, linkTitle) => {
    try {
      const res = await axios.get(`${API}/links/${id}/history`);
      setSelectedHistory(Array.isArray(res.data) ? res.data : []);
      setActiveLinkName(linkTitle || "Untitled Link"); 
      
      // Smooth scroll to history section
      setTimeout(() => {
        const element = document.getElementById("history-results");
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      alert("Could not load history");
    }
  };

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>Web Monitor AI</h1>
      
      {error && (
        <div style={{ color: "red", padding: "10px", border: "1px solid red", borderRadius: "8px", background: "#fff5f5", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: "20px", marginBottom: "20px", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginTop: 0 }}>Add New Link</h2>
        <input placeholder="URL (e.g. google.com)" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", boxSizing: "border-box" }} />
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", boxSizing: "border-box" }} />
        <input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", boxSizing: "border-box" }} />
        <button onClick={addLink} style={{ padding: "10px 20px", cursor: "pointer", background: "#28a745", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>Add Link</button>
      </div>

      <div className="links-grid">
        {links.length === 0 ? <p style={{ textAlign: "center", color: "#666" }}>No links found. Add one above!</p> : (
          links.map((link) => (
            <div key={link._id} className="card" style={{ padding: "15px", marginBottom: "15px", border: "1px solid #eee", borderRadius: "8px", background: "#fff" }}>
              <strong>{link.title}</strong>
              <p style={{ fontSize: "0.85em", color: "#666", wordBreak: "break-all" }}>{link.url}</p>
              <button 
                onClick={() => checkLink(link._id, link.title)} 
                disabled={loading}
                style={{ padding: "8px 15px", cursor: "pointer", background: "#007bff", color: "white", border: "none", borderRadius: "4px" }}
              >
                {loading ? "Checking..." : "Check Now"}
              </button>
              <button 
                onClick={() => viewHistory(link._id, link.title)} 
                style={{ marginLeft: "10px", padding: "8px 15px", cursor: "pointer", background: "#6c757d", color: "white", border: "none", borderRadius: "4px" }}
              >
                History
              </button>
            </div>
          ))
        )}
      </div>

      {selectedHistory && (
        <div id="history-results" style={{ marginTop: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
          <h2>History: {activeLinkName}</h2>
          <hr />
          {selectedHistory.length > 0 ? [...selectedHistory].reverse().map((item) => (
            <div key={item._id} style={{ marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              <p><strong>Summary:</strong> {item.summary}</p>
              <small style={{ color: "#888" }}>Checked: {new Date(item.createdAt).toLocaleString()}</small>
            </div>
          )) : <p>No history yet.</p>}
          <button onClick={() => setSelectedHistory(null)} style={{ marginTop: "10px", cursor: "pointer" }}>Close History</button>
        </div>
      )}
    </div>
  );
}

export default App;