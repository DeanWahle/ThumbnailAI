import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import FileDropzone from './FileDropzone'
import { generateImage, editImage } from '../services/openai'

const ChatInterface = () => {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const handleFileUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage({
        file: file,
        preview: e.target.result
      })
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText,
      image: uploadedImage?.preview || null,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError('')

    setTimeout(scrollToBottom, 100)

    try {
      let result
      
      // Check if this is a follow-up edit request without an uploaded image
      const lastBotMessage = messages.filter(msg => msg.type === 'bot' && msg.image).pop()
      const isEditRequest = lastBotMessage && !uploadedImage && 
        (inputText.toLowerCase().includes('edit') || 
         inputText.toLowerCase().includes('change') || 
         inputText.toLowerCase().includes('modify') ||
         inputText.toLowerCase().includes('add') ||
         inputText.toLowerCase().includes('remove') ||
         inputText.toLowerCase().includes('make it') ||
         inputText.toLowerCase().includes('give it'))
      
      if (uploadedImage) {
        result = await editImage(uploadedImage.file, inputText, messages)
      } else if (isEditRequest && lastBotMessage.image) {
        // Convert the last generated image to a file for editing
        const response = await fetch(lastBotMessage.image)
        const blob = await response.blob()
        const file = new File([blob], 'last-generated.png', { type: 'image/png' })
        result = await editImage(file, inputText, messages)
      } else {
        result = await generateImage(`YouTube thumbnail: ${inputText}`, messages)
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: uploadedImage || isEditRequest ? 'Here\'s your edited thumbnail:' : 'Here\'s your generated thumbnail:',
        image: result.imageUrl,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      setError(err.message || 'Failed to process image')
    } finally {
      setIsLoading(false)
      setInputText('')
      setUploadedImage(null)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl shadow-2xl overflow-hidden h-[70vh] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-400 to-pink-400 p-2 rounded-xl">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
            <p className="text-white/60 text-sm">Ready to create amazing thumbnails</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-300 pulse-slow" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Start Creating</h3>
              <p className="text-white/60 max-w-md mx-auto">
                Describe your YouTube thumbnail idea or upload an image to edit. I'll help you create something amazing!
              </p>
            </motion.div>
          )}

          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={clsx(
                "flex items-start space-x-3",
                message.type === 'user' ? "flex-row-reverse space-x-reverse" : ""
              )}
            >
              {/* Avatar */}
              <div className={clsx(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                message.type === 'user' 
                  ? "bg-gradient-to-br from-blue-400 to-cyan-400" 
                  : "bg-gradient-to-br from-purple-400 to-pink-400"
              )}>
                {message.type === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={clsx(
                "flex-1 max-w-sm",
                message.type === 'user' ? "text-right" : ""
              )}>
                <div className={clsx(
                  "glass rounded-2xl p-4 shadow-lg",
                  message.type === 'user' 
                    ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20" 
                    : "bg-white/5"
                )}>
                  <p className="text-white leading-relaxed">{message.text}</p>
                  
                  {message.image && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-3"
                    >
                      <img 
                        src={message.image} 
                        alt="Generated thumbnail" 
                        className="w-full rounded-xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer"
                        onClick={() => window.open(message.image, '_blank')}
                      />
                    </motion.div>
                  )}
                </div>
                
                <p className="text-white/40 text-xs mt-2 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Loading Message */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start space-x-3"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="glass rounded-2xl p-4 shadow-lg bg-white/5">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-white">
                    {uploadedImage ? 'Editing your thumbnail...' : 'Generating your thumbnail...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/10">
        <FileDropzone
          uploadedImage={uploadedImage}
          onFileUpload={handleFileUpload}
          onRemoveImage={handleRemoveImage}
        />
        
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={uploadedImage ? "Describe how to edit the image..." : "Describe your YouTube thumbnail..."}
              className="w-full glass rounded-2xl p-4 text-white placeholder-white/50 resize-none outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
              rows="2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl"
              >
                <p className="text-red-200 text-sm">{error}</p>
              </motion.div>
            )}
          </div>
          
          <motion.button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={clsx(
              "px-6 py-4 rounded-2xl font-medium transition-all shadow-lg",
              !inputText.trim() || isLoading
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-2xl"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}

export default ChatInterface