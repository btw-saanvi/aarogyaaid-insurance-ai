import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ShieldPlus, Activity, Send, RefreshCw, User, ClipboardList, Wallet, 
  MapPin, Upload, Trash2, LogIn, Database, ChevronRight, FileText,
  AlertCircle, CheckCircle2, Lock
} from 'lucide-react';

function App() {
  const [view, setView] = useState('user'); // 'user', 'admin', 'login'
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    lifestyle: 'Sedentary',
    conditions: 'None',
    income: 'under 3L',
    city: 'Metro'
  });

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Admin state
  const [adminAuth, setAdminAuth] = useState({ user: '', pass: '' });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [uploadData, setUploadData] = useState({ file: null, insurer: '', policyName: '' });
  const [uploadLoading, setUploadLoading] = useState(false);

  // Fetch policies when admin view is opened
  useEffect(() => {
    if (isAuthorized && view === 'admin') {
      fetchPolicies();
    }
  }, [isAuthorized, view]);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('http://localhost:5000/admin/policies', {
        headers: { 'Authorization': 'Basic ' + btoa(`${adminAuth.user}:${adminAuth.pass}`) }
      });
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    // In a real app, we'd verify with a challenge. 
    // Here we just set it and let the first API call fail if wrong.
    setIsAuthorized(true);
    setView('admin');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) return;

    setUploadLoading(true);
    const fd = new FormData();
    fd.append('file', uploadData.file);
    fd.append('insurer', uploadData.insurer);
    fd.append('policy_name', uploadData.policyName);

    try {
      const response = await fetch('http://localhost:5000/upload-policy', {
        method: 'POST',
        body: fd
      });
      if (!response.ok) throw new Error("Upload failed");
      alert("Policy uploaded successfully!");
      setUploadData({ file: null, insurer: '', policyName: '' });
      fetchPolicies();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const deletePolicy = async (filename) => {
    if (!window.confirm(`Delete ${filename}?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/admin/policy/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Basic ' + btoa(`${adminAuth.user}:${adminAuth.pass}`) }
      });
      if (response.ok) fetchPolicies();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRecommendation(null);
    try {
      const payload = { ...formData, conditions: formData.conditions.split(',').map(c => c.trim()) };
      const response = await fetch('http://localhost:5000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Server Error");
      setRecommendation(data);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatQuestion.trim()) return;
    const userMsg = chatQuestion;
    setChatQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMsg, 
          user_profile: { ...formData, conditions: formData.conditions.split(',').map(c => c.trim()) }
        })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (err) {
      alert("Chat error: " + err.message);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section" onClick={() => setView('user')} style={{ cursor: 'pointer' }}>
            <Activity className="logo-icon" />
            <div>
              <h1>AarogyaAid AI</h1>
              <p>Ground-Truth Insurance Intelligence</p>
            </div>
          </div>
          <nav>
            <button 
              className={`nav-btn ${view === 'user' ? 'active' : ''}`} 
              onClick={() => setView('user')}
            >
              <User size={18} /> User Portal
            </button>
            <button 
              className={`nav-btn ${view === 'admin' || view === 'login' ? 'active' : ''}`} 
              onClick={() => isAuthorized ? setView('admin') : setView('login')}
            >
              <Lock size={18} /> Admin Panel
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {view === 'login' && (
          <section className="login-screen">
            <div className="glass-card login-card">
              <h2><LogIn /> Admin Authentication</h2>
              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" value={adminAuth.user} onChange={e => setAdminAuth({...adminAuth, user: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={adminAuth.pass} onChange={e => setAdminAuth({...adminAuth, pass: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary">Authenticate</button>
              </form>
            </div>
          </section>
        )}

        {view === 'admin' && (
          <div className="admin-dashboard">
            <section className="glass-card upload-section">
              <h2><Upload /> Upload New Policy</h2>
              <form onSubmit={handleFileUpload} className="upload-grid">
                <input type="file" accept=".pdf" onChange={e => setUploadData({...uploadData, file: e.target.files[0]})} required />
                <input type="text" placeholder="Insurer (e.g. HDFC Ergo)" value={uploadData.insurer} onChange={e => setUploadData({...uploadData, insurer: e.target.value})} required />
                <input type="text" placeholder="Policy Name" value={uploadData.policyName} onChange={e => setUploadData({...uploadData, policyName: e.target.value})} required />
                <button type="submit" className="btn-primary" disabled={uploadLoading}>
                  {uploadLoading ? "Uploading..." : "Add to Knowledge Base"}
                </button>
              </form>
            </section>

            <section className="policies-list">
              <h2><Database /> Knowledge Base Dashboard</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Insurer</th>
                      <th>Policy</th>
                      <th>Uploaded At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.length > 0 ? policies.map((p, i) => (
                      <tr key={i}>
                        <td><div className="file-cell"><FileText size={14} /> {p.filename}</div></td>
                        <td>{p.insurer}</td>
                        <td>{p.policy_name}</td>
                        <td>{p.upload_date}</td>
                        <td>
                          <button onClick={() => deletePolicy(p.filename)} className="delete-btn">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No policies indexed yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {view === 'user' && (
          <div className="user-view">
            <section className="glass-card profile-form">
              <h2 className="section-title"><ClipboardList className="text-secondary" /> User Profile</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group grid-2">
                  <div>
                    <label><User size={14} /> Full Name</label>
                    <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                  </div>
                  <div>
                    <label>Age</label>
                    <input type="number" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                </div>
                <div className="form-group grid-2">
                  <div>
                    <label>Lifestyle</label>
                    <select value={formData.lifestyle} onChange={e => setFormData({...formData, lifestyle: e.target.value})}>
                      <option>Sedentary</option><option>Moderate</option><option>Active</option><option>Athlete</option>
                    </select>
                  </div>
                  <div>
                    <label><MapPin size={14} /> City</label>
                    <select value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
                      <option>Metro</option><option>Tier-2</option><option>Tier-3</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Pre-existing Conditions (comma separated)</label>
                  <input type="text" value={formData.conditions} onChange={e => setFormData({...formData, conditions: e.target.value})} />
                </div>
                <div className="form-group">
                  <label><Wallet size={14} /> Monthly Income Bracket</label>
                  <select value={formData.income} onChange={e => setFormData({...formData, income: e.target.value})}>
                    <option>under 3L</option><option>3-8L</option><option>8-15L</option><option>15L+</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <div className="loading-spinner"></div> : <><RefreshCw size={18} /> Generate Recommendation</>}
                </button>
              </form>
            </section>

            <section className="recommendation-output">
              {recommendation ? (
                <div className="glass-card result-card">
                  <h2 className="section-title"><CheckCircle2 className="text-accent" /> AI Recommended Policies</h2>
                  <div className="table-container peer-comparison">
                    <h3>6.1 Peer Comparison Table</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Policy Name</th>
                          <th>Insurer</th>
                          <th>Premium (Rs/yr)</th>
                          <th>Cover Amount</th>
                          <th>Waiting Period</th>
                          <th>Key Benefit</th>
                          <th>Suitability Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendation.comparison_table.map((p, i) => (
                          <tr key={i}>
                            <td><strong>{p.policy_name}</strong></td>
                            <td>{p.insurer}</td>
                            <td>{p.premium}</td>
                            <td>{p.cover_amount}</td>
                            <td>{p.waiting_period}</td>
                            <td>{p.key_benefit}</td>
                            <td><div className="score-badge">{p.suitability_score}%</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="table-container coverage-details">
                    <h3>6.2 Coverage Detail Table</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Inclusions</th>
                          <th>Exclusions</th>
                          <th>Sub-limits</th>
                          <th>Co-pay %</th>
                          <th>Claim Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{recommendation.coverage_details.inclusions}</td>
                          <td>{recommendation.coverage_details.exclusions}</td>
                          <td>{recommendation.coverage_details.sub_limits}</td>
                          <td>{recommendation.coverage_details.copay}</td>
                          <td>{recommendation.coverage_details.claim_type}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="analysis-box">
                    <h3>6.3 "Why This Policy" Explanation</h3>
                    <div className="explanation-content">
                      <ReactMarkdown>{recommendation.why_this_policy}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="chat-interface glass-inset">
                    <h3><Activity size={16} /> Need more clarity? Ask the Chat Explainer</h3>
                    <div className="chat-history">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`chat-bubble ${msg.role}`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ))}
                      {chatLoading && <div className="chat-bubble ai pulse">Analyzing Knowledge Base...</div>}
                    </div>
                    <div className="chat-input-row">
                      <input 
                        type="text" 
                        value={chatQuestion}
                        onChange={e => setChatQuestion(e.target.value)}
                        placeholder="Ground-truth data for your specific profile..."
                        onKeyDown={e => e.key === 'Enter' && handleChat()}
                      />
                      <button onClick={handleChat} className="send-btn"><Send size={18} /></button>
                    </div>
                    <p className="guardrail-note">Note: This AI provides policy comparisons only and does not offer medical advice.</p>
                  </div>
                </div>
              ) : (
                <div className="empty-state glass-card">
                  <ShieldPlus size={64} className="faded-icon" />
                  <h3>Complete your profile to unlock AI Ground-Truth Recommendations</h3>
                  <p>Our advisor analyzes indexed policies to find the perfect fit for your lifestyle and health history.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
