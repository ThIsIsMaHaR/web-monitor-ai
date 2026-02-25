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
    const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
    
    try {
      await axios.post(`${API}/links`, {
        url: cleanUrl,
        title: title || "New Link",
        tags: tags.split(",").map((t) => t.trim()).filter(t => t !== "")
      });
      setUrl(""); setTitle(""); setTags("");
      fetchLinks();
    } catch (err) {
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
        <input placeholder="URL (e.g. google.com)" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "8px" }} />
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "8px" }} />
        <input placeholder="Tags" value={tags} onChange={(e) => setTags(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "8px" }} />
        <button onClick={addLink} style={{ padding: "10px 20px", cursor: "pointer", background: "#28a745", color: "white", border: "none" }}>Add Link</button>
      </div>

      <div className="links-grid">
        {links.map((link) => (
          <div key={link._id} className="card" style={{ padding: "15px", marginBottom: "10px", border: "1px solid #eee", borderRadius: "8px" }}>
            <strong>{link.title}</strong>
            <p style={{ fontSize: "0.8em", color: "#666" }}>{link.url}</p>
            <button onClick={() => checkLink(link._id, link.title)} disabled={loading}>{loading ? "Checking..." : "Check Now"}</button>
            <button onClick={() => viewHistory(link._id, link.title)} style={{ marginLeft: "10px" }}>History</button>
          </div>
        ))}
      </div>

      {selectedHistory && (
        <div id="history-results" style={{ marginTop: "30px", padding: "20px", background: "#f9f9f9", borderRadius: "8px" }}>
          <h2>History: {activeLinkName}</h2>
          {selectedHistory.length > 0 ? [...selectedHistory].reverse().map((item, index) => (
            <div key={item._id} style={{ marginBottom: "15px", borderBottom: "1px solid #ddd" }}>
              <p><strong>Summary:</strong> {item.summary}</p>
              <small>Time: {new Date(item.createdAt).toLocaleString()}</small>
            </div>
          )) : <p>No history yet.</p>}
        </div>
      )}
    </div>
  );
}
export default App;