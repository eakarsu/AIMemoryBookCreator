import React, { useState } from 'react';

export default function HeritageGapFinder() {
  const [form, setForm] = useState({ eras: 'childhood', people: 'Ana,Sam', places: 'Izmir', artifacts: 'photo album' });
  const [result, setResult] = useState(null);
  const split = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

  const submit = async () => {
    const response = await fetch('/api/heritage-gap-finder/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      body: JSON.stringify({ eras: split(form.eras), people: split(form.people), places: split(form.places), artifacts: split(form.artifacts) }),
    });
    setResult(await response.json());
  };

  return (
    <div className="page">
      <h1>Heritage Gap Finder</h1>
      {Object.entries(form).map(([key, value]) => (
        <label key={key}>{key}<input value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>
      ))}
      <button onClick={submit}>Analyze gaps</button>
      {result && <div className="card"><h2>{result.completenessScore}/100 complete</h2><ul>{result.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul></div>}
    </div>
  );
}
