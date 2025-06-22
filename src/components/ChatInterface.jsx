import { useState, useRef } from 'react'
import { generateImage, editImage } from '../services/openai'

const ChatInterface = () => {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage({
          file: file,
          preview: e.target.result
        })
      }
      reader.readAsDataURL(file)
      setError('')
    } else {
      setError('Please select a valid image file')
    }
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText,
      image: uploadedImage?.preview || null
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError('')

    try {
      let result
      if (uploadedImage) {
        result = await editImage(uploadedImage.file, inputText)
      } else {
        result = await generateImage(`YouTube thumbnail: ${inputText}`)
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: uploadedImage ? 'Here\'s your edited thumbnail:' : 'Here\'s your generated thumbnail:',
        image: result.imageUrl
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      setError(err.message || 'Failed to process image')
    } finally {
      setIsLoading(false)
      setInputText('')
      setUploadedImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Thumbnail Generator</h2>
        <p>Type a description to generate, or upload an image to edit</p>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-bubble">
              {message.text}
            </div>
            {message.image && (
              <img 
                src={message.image} 
                alt="Generated thumbnail" 
                className="message-image"
              />
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot">
            <div className="message-bubble">
              <div className="loading">
                <div className="spinner"></div>
                {uploadedImage ? 'Editing your thumbnail...' : 'Generating your thumbnail...'}
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="chat-input">
        <div className="input-container">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="file-upload-btn"
            >
              Upload Image
            </button>
            {uploadedImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img 
                  src={uploadedImage.preview} 
                  alt="Uploaded" 
                  className="uploaded-image" 
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="file-upload-btn"
                  style={{ background: '#dc3545' }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={uploadedImage ? "Describe how to edit the image..." : "Describe your YouTube thumbnail..."}
            className="text-input"
            rows="2"
          />
          
          {error && <div className="error">{error}</div>}
        </div>
        
        <button 
          type="submit" 
          disabled={!inputText.trim() || isLoading}
          className="send-btn"
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ChatInterface