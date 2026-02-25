import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

function App() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [links, setLinks] = useState([]); 
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [activeLinkName, setActiveLinkName] = useState(""); // Fixes "History for both" confusion
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

  const checkLink = async (id) => {
    setLoading(true);
    try {
      await axios.post(`${API}/links/${id}/check`);
      alert("AI Check Complete!");
      fetchLinks();
    } catch (err) {
      console.error("Check Error:", err);
      alert("AI check failed. Check Render Environment Variables.");
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (id, linkTitle) => {
    try {
      const res = await axios.get(`${API}/links/${id}/history`);
      setSelectedHistory(Array.isArray(res.data) ? res.data : []);
      setActiveLinkName(linkTitle || "Untitled Link"); // Set the name here
      
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
    <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Web Monitor AI</h1>

      {error && <div style={{ color: "red", padding: "10px", border: "1px solid red" }}>{error}</div>}

      <div className="card" style={{ padding: "20px", marginBottom: "20px", border: "1px solid #ddd" }}>
        <h2>Add New Link</h2>
        <input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", marginBottom: "10px" }} />
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: "10px" }} />
        <input placeholder="Tags" value={tags} onChange={(e) => setTags(e.target.value)} style={{ width: "100%", marginBottom: "10px" }} />
        <button onClick={addLink}>Add Link</button>
      </div>

      <div className="links-grid">
        {links.map((link) => (
          <div key={link._id} className="card" style={{ padding: "15px", marginBottom: "10px", border: "1px solid #eee" }}>
            <strong>{link.title || "Untitled"}</strong>
            <p style={{ fontSize: "0.8em", color: "#666" }}>{link.url}</p>
            <button onClick={() => checkLink(link._id)} disabled={loading}>
              {loading ? "Checking..." : "Check Now"}
            </button>
            <button className="secondary" style={{ marginLeft: "10px" }} onClick={() => viewHistory(link._id, link.title)}>
              View History
            </button>
          </div>
        ))}
      </div>

      {selectedHistory && (
        <div id="history-results" style={{ marginTop: "30px", padding: "20px", background: "#f9f9f9" }}>
          <h2>History for: {activeLinkName}</h2>
          <button onClick={() => setSelectedHistory(null)}>Close History</button>
          <hr />
          {selectedHistory.length > 0 ? (
            selectedHistory.map((item) => (
              <div key={item._id} style={{ marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
                <p><strong>AI Summary:</strong> {item.summary || "No summary available."}</p>
                <details>
                  <summary style={{ color: "blue", cursor: "pointer" }}>View Technical Changes</summary>
                  <pre style={{ fontSize: "0.8em", background: "#eee", padding: "5px" }}>{item.diff}</pre>
                </details>
                {/* THE DATE FIX: Using createdAt instead of checkedAt */}
                <p><small>Checked on: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Invalid Date"}</small></p>
              </div>
            ))
          ) : (
            <p>No history found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;