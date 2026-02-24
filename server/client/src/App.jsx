import { useEffect, useState } from "react";
import axios from "axios";

// FIX: In production, Express serves the frontend, so we use relative paths.
// If VITE_API_URL is missing, it defaults to an empty string (relative).
const API = import.meta.env.VITE_API_URL || "";

function App() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [links, setLinks] = useState([]); // Initialized as array
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`${API}/links`);
      // SAFETY CHECK: Ensure data is an array before setting state
      if (Array.isArray(res.data)) {
        setLinks(res.data);
        setError(null);
      } else {
        setLinks([]);
        console.error("Expected array but got:", res.data);
      }
    } catch (err) {
      setError("Failed to fetch links. Make sure backend is running.");
      setLinks([]); 
    }
  };

  const addLink = async () => {
    if (!url) {
      alert("URL is required");
      return;
    }
    try {
      await axios.post(`${API}/links`, {
        url,
        title,
        tags: tags.split(",").map((t) => t.trim())
      });
      setUrl("");
      setTitle("");
      setTags("");
      fetchLinks();
    } catch (err) {
      alert("Error adding link");
    }
  };

  const checkLink = async (id) => {
    setLoading(true);
    try {
      await axios.post(`${API}/links/${id}/check`);
      alert("Check completed!");
      fetchLinks();
    } catch (err) {
      alert("Check failed");
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (id) => {
    try {
      const res = await axios.get(`${API}/links/${id}/history`);
      setSelectedHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert("Could not load history");
    }
  };

  return (
    <div className="container">
      <h1>Web Monitor AI</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="card">
        <h2>Add New Link</h2>
        <input
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <button onClick={addLink}>Add Link</button>
      </div>

      <h2>Saved Links</h2>

      {/* RENDER GUARD: Use Array.isArray to prevent "map is not a function" error */}
      {Array.isArray(links) && links.length > 0 ? (
        links.map((link) => (
          <div key={link._id} className="card">
            <strong>{link.title || link.url}</strong>
            <p>{link.url}</p>
            <p><small>Tags: {link.tags?.join(", ")}</small></p>

            <button onClick={() => checkLink(link._id)} disabled={loading}>
              {loading ? "Checking..." : "Check Now"}
            </button>

            <button
              className="secondary"
              style={{ marginLeft: 10 }}
              onClick={() => viewHistory(link._id)}
            >
              View History
            </button>
          </div>
        ))
      ) : (
        <p>No links found.</p>
      )}

      {selectedHistory && (
        <>
          <h2>Check History</h2>
          {selectedHistory.map((item) => (
            <div key={item._id} className="card">
              <p><strong>Summary:</strong></p>
              <p>{item.summary}</p>
              <details>
                <summary>View Diff</summary>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {item.diff}
                </pre>
              </details>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;