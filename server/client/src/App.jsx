import { useEffect, useState } from "react";
import axios from "axios";

// Using a relative path works best on Render
const API = ""; 

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
      // 1. Tell the backend to fetch the page and run AI summary
      const res = await axios.post(`${API}/links/${id}/check`);
      console.log("Check Result:", res.data);
      
      // 2. Refresh the UI
      await fetchLinks();
      
      // 3. Immediately show the new history entry
      await viewHistory(id, linkTitle); 
      
      alert("AI Check Complete!");
    } catch (err) {
      console.error("Check Error:", err);
      const msg = err.response?.data?.error || "AI check failed.";
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (id, linkTitle) => {
    try {
      const res = await axios.get(`${API}/links/${id}/history`);
      setSelectedHistory(Array.isArray(res.data) ? res.data : []);
      setActiveLinkName(linkTitle || "Untitled Link"); 
      
      // Scroll to the history section
      setTimeout(() => {
        const element = document.getElementById("history-results");
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      alert("Could not load history");
    }
  };

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: 'Segoe UI', color: "#333" }}>
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", color: "#2c3e50" }}>Web Monitor AI</h1>
        <p>Track website changes with Gemini AI</p>
      </header>

      {error && <div style={{ color: "red", padding: "10px", background: "#fee", border: "1px solid red", borderRadius: "5px", marginBottom: "20px" }}>{error}</div>}

      {/* ADD LINK FORM */}
      <div className="card" style={{ padding: "25px", marginBottom: "30px", border: "1px solid #ddd", borderRadius: "12px", background: "#fff", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <h2 style={{ marginTop: 0 }}>Add New Link</h2>
        <input placeholder="URL (e.g. google.com)" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }} />
        <input placeholder="Title (e.g. My Website)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }} />
        <input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} style={{ width: "100%", marginBottom: "15px", padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }} />
        <button onClick={addLink} style={{ width: "100%", padding: "12px", cursor: "pointer", background: "#2ecc71", color: "white", border: "none", borderRadius: "6px", fontSize: "1rem", fontWeight: "bold" }}>+ Add to Monitor</button>
      </div>

      {/* LINKS LIST */}
      <div className="links-grid">
        {links.length === 0 ? <p style={{textAlign: 'center', color: '#999'}}>No links being monitored yet.</p> : links.map((link) => (
          <div key={link._id} className="card" style={{ padding: "20px", marginBottom: "15px", border: "1px solid #eee", borderRadius: "10px", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ marginBottom: "15px" }}>
              <strong style={{ fontSize: "1.2rem" }}>{link.title}</strong>
              <p style={{ fontSize: "0.9rem", color: "#3498db", margin: "5px 0" }}>{link.url}</p>
            </div>
            <button 
              onClick={() => checkLink(link._id, link.title)} 
              disabled={loading} 
              style={{ padding: "10px 18px", cursor: "pointer", background: loading ? "#bdc3c7" : "#3498db", color: "white", border: "none", borderRadius: "5px", marginRight: "10px" }}
            >
              {loading ? "AI Checking..." : "Check Now"}
            </button>
            <button 
              onClick={() => viewHistory(link._id, link.title)} 
              style={{ padding: "10px 18px", cursor: "pointer", background: "#95a5a6", color: "white", border: "none", borderRadius: "5px" }}
            >
              View History
            </button>
          </div>
        ))}
      </div>

      {/* HISTORY RESULTS SECTION */}
      {selectedHistory && (
        <div id="history-results" style={{ marginTop: "40px", padding: "25px", background: "#fdfdfd", borderRadius: "12px", border: "2px solid #3498db" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>History: {activeLinkName}</h2>
            <button onClick={() => setSelectedHistory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✖</button>
          </div>
          <hr style={{ margin: "20px 0", border: "0.5px solid #eee" }} />
          
          {selectedHistory.length > 0 ? [...selectedHistory].reverse().map((item, index) => (
            <div key={item._id} style={{ marginBottom: "20px", padding: "15px", background: index === 0 ? "#e8f4fd" : "white", borderRadius: "8px", border: "1px solid #eee" }}>
              <p style={{ margin: "0 0 10px 0", lineHeight: "1.5" }}><strong>AI Summary:</strong> {item.summary}</p>
              <small style={{ color: "#7f8c8d" }}>📅 {new Date(item.createdAt).toLocaleString()}</small>
              {index === 0 && <span style={{ marginLeft: "10px", background: "#3498db", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem" }}>LATEST</span>}
            </div>
          )) : <p>No check history found. Click "Check Now" to start.</p>}
        </div>
      )}
    </div>
  );
}

export default App;