import { useEffect, useState } from "react";
import axios from "axios";

// --- SMART API URL ---
// If VITE_API_URL isn't set, we use an empty string. 
// This means it will call 'https://your-site.onrender.com/links'
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
      // Logic: If API is "", this calls "/links"
      const res = await axios.get(`${API}/links`);
      setLinks(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Server connection failed. Check if backend is running.");
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

  const checkLink = async (id, linkTitle) => {
    setLoading(true);
    // This constructs the URL. Example: /links/123/check
    const checkUrl = `${API}/links/${id}/check`;
    console.log("🚀 ATTEMPTING CHECK AT:", checkUrl);

    try {
      await axios.post(checkUrl);
      
      // Refresh both lists to show the new 'Latest' scan
      await fetchLinks();
      await viewHistory(id, linkTitle); 
      
      alert("Scan Successful!");
    } catch (err) {
      console.error("Check Error Detail:", err.response || err);
      alert(`Check failed (Status: ${err.response?.status || 'Unknown'}). Check Render logs.`);
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (id, linkTitle) => {
    try {
      const res = await axios.get(`${API}/links/${id}/history`);
      setSelectedHistory(Array.isArray(res.data) ? res.data : []);
      setActiveLinkName(linkTitle || "Untitled Link"); 
      
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
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#333" }}>Web Monitor AI</h1>
        <p style={{ color: "#666" }}>Monitoring your sites with Gemini AI</p>
      </header>

      {error && <div style={{ color: "red", padding: "15px", border: "1px solid red", borderRadius: "8px", background: "#fff5f5", marginBottom: "20px" }}>{error}</div>}

      <div className="card" style={{ padding: "20px", marginBottom: "20px", border: "1px solid #ddd", borderRadius: "8px", background: "#fff" }}>
        <h2 style={{ marginTop: 0 }}>Add New Link</h2>
        <input placeholder="URL (include https://)" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
        <input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
        <button onClick={addLink} style={{ padding: "10px 20px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>+ Add Link</button>
      </div>

      <div className="links-grid">
        {links.length === 0 && !error && <p style={{ textAlign: "center", color: "#888" }}>No links added yet.</p>}
        {links.map((link) => (
          <div key={link._id} className="card" style={{ padding: "20px", marginBottom: "15px", border: "1px solid #eee", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", background: "#fff" }}>
            <div style={{ marginBottom: "15px" }}>
              <strong style={{ fontSize: "1.2em", display: "block" }}>{link.title || "Untitled"}</strong>
              <code style={{ fontSize: "0.85em", color: "#007bff" }}>{link.url}</code>
            </div>
            
            <button 
              onClick={() => checkLink(link._id, link.title)} 
              disabled={loading}
              style={{ padding: "8px 16px", background: loading ? "#ccc" : "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "AI is Scanning..." : "Check Now"}
            </button>
            
            <button 
              style={{ marginLeft: "10px", padding: "8px 16px", background: "white", color: "#333", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }} 
              onClick={() => viewHistory(link._id, link.title)}
            >
              View History
            </button>
          </div>
        ))}
      </div>

      {selectedHistory && (
        <div id="history-results" style={{ marginTop: "40px", padding: "25px", background: "#f8f9fa", borderRadius: "12px", border: "1px solid #e9ecef" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Results for: {activeLinkName}</h2>
            <button onClick={() => setSelectedHistory(null)} style={{ background: "none", border: "none", fontSize: "1.5em", cursor: "pointer" }}>&times;</button>
          </div>
          <hr style={{ margin: "20px 0", border: "0.5px solid #dee2e6" }} />
          
          {selectedHistory.length > 0 ? (
            [...selectedHistory].reverse().map((item, index) => ( 
              <div key={item._id} style={{ marginBottom: "25px", background: "white", padding: "15px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <p style={{ marginTop: 0 }}>
                  <strong>AI Summary:</strong> 
                  <span style={{ marginLeft: "10px", lineHeight: "1.5" }}>{item.summary || "Summary generation failed."}</span>
                  {index === 0 && <span style={{ background: "#d4edda", color: "#155724", padding: "3px 8px", borderRadius: "12px", fontSize: "0.75em", marginLeft: "10px", fontWeight: "bold" }}>LATEST</span>}
                </p>
                
                <details style={{ margin: "15px 0" }}>
                  <summary style={{ color: "#6c757d", cursor: "pointer", fontSize: "0.9em" }}>🔍 View Raw Data Changes</summary>
                  <pre style={{ fontSize: "0.8em", background: "#1e1e1e", color: "#d4d4d4", padding: "15px", borderRadius: "6px", overflowX: "auto", marginTop: "10px" }}>
                    {item.diff || "No changes found."}
                  </pre>
                </details>
                
                <p style={{ margin: 0, textAlign: "right" }}>
                  <small style={{ color: "#adb5bd" }}>
                    Scan Time: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
                  </small>
                </p>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", color: "#888" }}>No history found. Click 'Check Now' to start.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;