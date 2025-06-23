import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, Loader2, Download } from 'lucide-react'
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

  const downloadImage = async (imageUrl, messageId) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `thumbnail-${messageId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      setError('Failed to download image')
    }
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
    setInputText('')
    setUploadedImage(null)

    setTimeout(scrollToBottom, 100)

    try {
      let result
      
      // Check if this is a follow-up edit request
      const lastBotMessage = messages.filter(msg => msg.type === 'bot' && msg.image).pop()
      
      // Check if user is providing a style reference for the previously generated image
      const isStyleReference = uploadedImage && lastBotMessage && 
        (inputText.toLowerCase().includes('style') || 
         inputText.toLowerCase().includes('like this') || 
         inputText.toLowerCase().includes('similar to') ||
         inputText.toLowerCase().includes('in this style') ||
         inputText.toLowerCase().includes('reference'))
      
      const isEditRequest = lastBotMessage && 
        (inputText.toLowerCase().includes('edit') || 
         inputText.toLowerCase().includes('change') || 
         inputText.toLowerCase().includes('modify') ||
         inputText.toLowerCase().includes('add') ||
         inputText.toLowerCase().includes('remove') ||
         inputText.toLowerCase().includes('make it') ||
         inputText.toLowerCase().includes('give it') ||
         inputText.toLowerCase().includes('now') ||
         inputText.toLowerCase().includes('also'))
      
      if (uploadedImage && !isStyleReference && !lastBotMessage) {
        // First upload - use as base image to edit
        result = await editImage(uploadedImage.file, inputText, messages)
      } else if (uploadedImage && !isStyleReference && lastBotMessage) {
        // User uploaded image in ongoing conversation - assume they want to edit this new image
        result = await editImage(uploadedImage.file, inputText, messages)
      } else if ((isEditRequest || isStyleReference) && lastBotMessage && lastBotMessage.image) {
        // Convert the last generated image to a file for editing
        const response = await fetch(lastBotMessage.image)
        const blob = await response.blob()
        const file = new File([blob], 'last-generated.png', { type: 'image/png' })
        
        // If there's a style reference image, include it in the prompt
        let enhancedPrompt = inputText
        if (isStyleReference && uploadedImage) {
          enhancedPrompt = `${inputText}\n\nIMPORTANT: The user has uploaded a reference image. Apply the visual style, colors, mood, or aesthetic from the reference image to the existing generated image while maintaining the core subject and composition.`
        }
        
        result = await editImage(file, enhancedPrompt, messages)
      } else {
        result = await generateImage(`YouTube thumbnail: ${inputText}`, messages)
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: (uploadedImage && !isStyleReference) || isEditRequest || isStyleReference ? 'Here\'s your edited thumbnail:' : 'Here\'s your generated thumbnail:',
        image: result.imageUrl,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      setError(err.message || 'Failed to process image')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl shadow-2xl overflow-hidden h-[70vh] flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 border-b border-white/10">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                "flex items-start space-x-2",
                message.type === 'user' ? "flex-row-reverse space-x-reverse" : ""
              )}
            >
              {/* Avatar */}
              <div className={clsx(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                message.type === 'user' 
                  ? "bg-gradient-to-br from-blue-400 to-cyan-400" 
                  : "bg-gradient-to-br from-purple-400 to-pink-400"
              )}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={clsx(
                "flex-1 max-w-sm",
                message.type === 'user' ? "text-right" : ""
              )}>
                <div className={clsx(
                  "glass rounded-xl px-3 py-2 shadow-lg inline-block",
                  message.type === 'user' 
                    ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20" 
                    : "bg-white/5"
                )}>
                  <p className="text-white text-sm leading-relaxed">{message.text}</p>
                  
                  {message.image && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-2 relative group"
                    >
                      <img 
                        src={message.image} 
                        alt="Generated thumbnail" 
                        className="w-full rounded-xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer"
                        onClick={() => window.open(message.image, '_blank')}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadImage(message.image, message.id)
                        }}
                        className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/80"
                        title="Download full resolution"
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  )}
                </div>
                
                <p className="text-white/40 text-xs mt-1 px-1">
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
              className="flex items-start space-x-2"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="glass rounded-xl px-3 py-2 shadow-lg bg-white/5 inline-block">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-white text-sm">
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
      <div className="p-4 border-t border-white/10">
        <FileDropzone
          uploadedImage={uploadedImage}
          onFileUpload={handleFileUpload}
          onRemoveImage={handleRemoveImage}
        />
        
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={uploadedImage ? "Describe how to edit the image..." : "Describe your YouTube thumbnail..."}
              className="w-full glass rounded-xl p-3 text-white text-sm placeholder-white/50 resize-none outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
              rows="1"
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
                className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg"
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
              "p-3 rounded-xl font-medium transition-all shadow-lg",
              !inputText.trim() || isLoading
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-2xl"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}

export default ChatInterface