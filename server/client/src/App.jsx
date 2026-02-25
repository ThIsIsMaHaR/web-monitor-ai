import { useEffect, useState } from "react";
import axios from "axios";

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
    try {
      await axios.post(`${API}/links`, {
        url,
        title,
        tags: tags.split(",").map((t) => t.trim()).filter(t => t !== "")
      });
      setUrl(""); setTitle(""); setTags("");
      fetchLinks();
    } catch (err) {
      alert("Error adding link.");
    }
  };

  // UPDATED: Now accepts linkTitle to refresh the view immediately
  const checkLink = async (id, linkTitle) => {
    setLoading(true);
    try {
      await axios.post(`${API}/links/${id}/check`);
      
      // 1. Refresh the top-level link list (for metadata/tags)
      await fetchLinks();
      
      // 2. Refresh the history view immediately so the new check appears
      await viewHistory(id, linkTitle); 
      
      alert("AI Check Complete!");
    } catch (err) {
      console.error("Check Error:", err);
      alert("AI check failed. Check Render Environment Variables / Region.");
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (id, linkTitle) => {
    try {
      const res = await axios.get(`${API}/links/${id}/history`);
      setSelectedHistory(Array.isArray(res.data) ? res.data : []);
      setActiveLinkName(linkTitle || "Untitled Link"); 
      
      // Smooth scroll to results
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
      <h1>Web Monitor AI</h1>

      {error && <div style={{ color: "red", padding: "10px", border: "1px solid red", marginBottom: "10px" }}>{error}</div>}

      <div className="card" style={{ padding: "20px", marginBottom: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2>Add New Link</h2>
        <input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "8px" }} />
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "8px" }} />
        <input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "8px" }} />
        <button onClick={addLink} style={{ padding: "10px 20px", cursor: "pointer" }}>Add Link</button>
      </div>

      <div className="links-grid">
        {links.map((link) => (
          <div key={link._id} className="card" style={{ padding: "15px", marginBottom: "10px", border: "1px solid #eee", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ marginBottom: "10px" }}>
              <strong style={{ fontSize: "1.1em" }}>{link.title || "Untitled"}</strong>
              <p style={{ fontSize: "0.8em", color: "#666", margin: "4px 0" }}>{link.url}</p>
            </div>
            
            <button 
              onClick={() => checkLink(link._id, link.title)} 
              disabled={loading}
              style={{ padding: "6px 12px", cursor: "pointer" }}
            >
              {loading ? "AI Working..." : "Check Now"}
            </button>
            
            <button 
              className="secondary" 
              style={{ marginLeft: "10px", padding: "6px 12px", cursor: "pointer" }} 
              onClick={() => viewHistory(link._id, link.title)}
            >
              View History
            </button>
          </div>
        ))}
      </div>

      {selectedHistory && (
        <div id="history-results" style={{ marginTop: "30px", padding: "20px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>History for: {activeLinkName}</h2>
            <button onClick={() => setSelectedHistory(null)} style={{ cursor: "pointer" }}>Close</button>
          </div>
          <hr style={{ margin: "20px 0" }} />
          
          {selectedHistory.length > 0 ? (
            [...selectedHistory].reverse().map((item, index) => ( // Show newest first
              <div key={item._id} style={{ marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
                <p>
                  <strong>AI Summary:</strong> 
                  <span style={{ marginLeft: "8px" }}>{item.summary || "No summary available."}</span>
                  {index === 0 && <span style={{ background: "#e1f5fe", color: "#0288d1", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7em", marginLeft: "10px" }}>LATEST</span>}
                </p>
                
                <details style={{ margin: "10px 0" }}>
                  <summary style={{ color: "#007bff", cursor: "pointer", fontSize: "0.9em" }}>View Technical Changes</summary>
                  <pre style={{ 
                    fontSize: "0.8em", 
                    background: "#2d2d2d", 
                    color: "#ccc", 
                    padding: "10px", 
                    borderRadius: "4px", 
                    overflowX: "auto",
                    marginTop: "5px"
                  }}>
                    {item.diff || "No structural changes detected."}
                  </pre>
                </details>
                
                <p style={{ margin: 0 }}>
                  <small style={{ color: "#888" }}>
                    Checked on: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date Unknown"}
                  </small>
                </p>
              </div>
            ))
          ) : (
            <p>No history entries found for this link.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;