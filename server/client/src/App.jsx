import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

function App() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [links, setLinks] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const res = await axios.get(`${API}/links`);
    setLinks(res.data);
  };

  const addLink = async () => {
    if (!url) {
      alert("URL is required");
      return;
    }

    await axios.post(`${API}/links`, {
      url,
      title,
      tags: tags.split(",").map((t) => t.trim())
    });

    setUrl("");
    setTitle("");
    setTags("");
    fetchLinks();
  };

  const checkLink = async (id) => {
    setLoading(true);
    await axios.post(`${API}/links/${id}/check`);
    setLoading(false);
    alert("Check completed!");
  };

  const viewHistory = async (id) => {
    const res = await axios.get(`${API}/links/${id}/history`);
    setSelectedHistory(res.data);
  };

  return (
    <div className="container">
      <h1>Web Monitor AI</h1>

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

      {links.map((link) => (
        <div key={link._id} className="card">
          <strong>{link.title || link.url}</strong>
          <p>{link.url}</p>
          <p><small>Tags: {link.tags?.join(", ")}</small></p>

          <button onClick={() => checkLink(link._id)}>
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
      ))}

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