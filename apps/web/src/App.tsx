import { useState, useEffect } from 'react'

function App() {
    const [health, setHealth] = useState<string>("Checking API...")

    useEffect(() => {
        // Test connection to API via Nginx
        fetch('/api/health')
            .then(res => res.json())
            .then(data => setHealth(JSON.stringify(data)))
            .catch(err => setHealth("API Connection Failed"))
    }, [])

    return (
        <div style={{ padding: '2rem' }}>
            <h1>OmniOrder MVP - Phase 1</h1>
            <hr />
            <h3>Current Host: {window.location.host}</h3>
            <h3>API Status: {health}</h3>
        </div>
    )
}

export default App