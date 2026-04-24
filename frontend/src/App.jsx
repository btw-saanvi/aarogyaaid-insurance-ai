import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ShieldPlus, Activity, Send, RefreshCw, User, ClipboardList, Wallet, MapPin, Upload, Trash2 } from 'lucide-react';

function App() {
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
  
  // Admin / Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRecommendation(null);
    try {
      // Map conditions string to list as backend expects
      const payload = {
        ...formData,
        conditions: formData.conditions.split(',').map(c => c.trim())
      };
      
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload-policy', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed");
      alert("Policy uploaded and indexed successfully!");
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const clearAllPolicies = async () => {
    if (!window.confirm("Are you sure you want to clear all policy data?")) return;
    try {
      const response = await fetch('http://localhost:5000/admin/clear-all', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa('admin:password123') // Simple basic auth for demo
        }
      });
      if (response.ok) alert("All policies cleared.");
    } catch (err) {
      alert("Clear error: " + err.message);
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
          user_profile: {
            ...formData,
            conditions: formData.conditions.split(',').map(c => c.trim())
          }
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
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <h1><Activity style={{ verticalAlign: 'middle', marginRight: '10px' }} /> AarogyaAid AI</h1>
            <p>Personalized Health Insurance Recommendations</p>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: 'auto', background: 'rgba(255,255,255,0.1)' }}
            onClick={() => setIsAdminOpen(!isAdminOpen)}
          >
            {isAdminOpen ? "Close Admin" : "Admin Panel"}
          </button>
        </div>
      </header>

      {isAdminOpen && (
        <section className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--secondary)' }}>
          <h2 style={{ marginBottom: '1rem' }}><Upload /> Admin: Upload Policy Documents</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload} 
              disabled={uploadLoading}
              style={{ padding: '0.5rem' }}
            />
            {uploadLoading && <div className="loading-spinner"></div>}
            <button onClick={clearAllPolicies} className="btn-primary" style={{ width: 'auto', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444' }}>
              <Trash2 size={16} /> Clear Store
            </button>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Upload PDFs of insurance policies to populate the recommendation engine.
          </p>
        </section>
      )}

      <main className="main-content">
        <section className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList className="text-secondary" /> Your Profile
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><User size={14} /> Full Name</label>
              <input 
                type="text" 
                required 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Age</label>
                <input 
                  type="number" 
                  required 
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  placeholder="25"
                />
              </div>
              <div>
                <label>Lifestyle</label>
                <select 
                  value={formData.lifestyle}
                  onChange={(e) => setFormData({...formData, lifestyle: e.target.value})}
                >
                  <option>Sedentary</option>
                  <option>Moderate</option>
                  <option>Active</option>
                  <option>Athlete</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Pre-existing Conditions (comma separated)</label>
              <input 
                type="text" 
                value={formData.conditions}
                onChange={(e) => setFormData({...formData, conditions: e.target.value})}
                placeholder="Diabetes, Hypertension or None"
              />
            </div>
            <div className="form-group">
              <label><Wallet size={14} /> Monthly Income Bracket</label>
              <select 
                value={formData.income}
                onChange={(e) => setFormData({...formData, income: e.target.value})}
              >
                <option>under 3L</option>
                <option>3-8L</option>
                <option>8-15L</option>
                <option>15L+</option>
              </select>
            </div>
            <div className="form-group">
              <label><MapPin size={14} /> City</label>
              <select 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              >
                <option>Metro</option>
                <option>Tier-2</option>
                <option>Tier-3</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="loading-spinner"></div> : <><RefreshCw size={18} /> Generate Recommendation</>}
            </button>
          </form>
        </section>

        <section className="glass-card recommendation-output">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity className="text-accent" /> AI Analysis
          </h2>
          {recommendation ? (
            <div className="markdown-content">
              <h3>Recommendation Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>Premium</th>
                    <th>Coverage</th>
                    <th>Waiting</th>
                    <th>Suitability</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendation.comparison_table.map((p, i) => (
                    <tr key={i}>
                      <td>{p.policy_name} ({p.insurer})</td>
                      <td>{p.premium}</td>
                      <td>{p.cover_amount}</td>
                      <td>{p.waiting_period}</td>
                      <td>{p.suitability_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '2rem' }}>
                <h4>Why this recommendation?</h4>
                <p style={{ fontStyle: 'italic', color: '#cbd5e1' }}>{recommendation.why_this_policy}</p>
              </div>

              <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '1rem' }}>
                <h4>Key Inclusions</h4>
                <p>{recommendation.coverage_details.inclusions}</p>
              </div>
              
              <div className="chat-section">
                <h3>Ask about these policies</h3>
                <div className="chat-history">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`chat-msg ${msg.role}`}>
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="chat-msg ai">AI is analyzing Documents...</div>}
                </div>
                <div className="chat-input">
                  <input 
                    type="text" 
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder="Ask about waiting periods, coverage..."
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  />
                  <button onClick={handleChat} className="btn-primary" style={{ width: 'auto' }}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20%' }}>
              <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Upload a policy document in Admin Panel, then complete your profile to see personalized recommendations </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
