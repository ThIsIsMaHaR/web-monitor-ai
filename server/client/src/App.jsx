import { useEffect, useState } from "react";
import axios from "axios";

// Using a relative path is safest when hosted on the same server
const API = ""; 

function App() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [links, setLinks] = useState([]);
  const [error, setError] = useState(null);

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`${API}/links`);
      setLinks(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to load links.");
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const addLink = async () => {
    if (!url) return alert("Please enter a URL");
    try {
      console.log("Sending to:", `${API}/links`);
      const res = await axios.post(`${API}/links`, { 
        url, 
        title: title || "New Link",
        tags: [] 
      });
      console.log("Server Response:", res.data);
      setUrl(""); setTitle("");
      fetchLinks();
    } catch (err) {
      // THIS WILL TELL US THE TRUTH:
      const errorMsg = err.response?.data?.error || err.message;
      console.error("Full Error:", err);
      alert(`FAILED: ${errorMsg}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Web Monitor</h1>
      <input placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <button onClick={addLink}>Add Link</button>
      <hr />
      <ul>
        {links.map(l => <li key={l._id}>{l.title} - {l.url}</li>)}
      </ul>
    </div>
  );
}
export default App;