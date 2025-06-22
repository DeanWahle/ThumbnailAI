import { useState } from 'react'
import ChatInterface from './components/ChatInterface'

function App() {
  return (
    <div className="App">
      <h1>Thumbnail AI</h1>
      <p>Generate or edit YouTube thumbnails with AI</p>
      <ChatInterface />
    </div>
  )
}

export default App