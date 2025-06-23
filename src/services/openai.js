const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file')
}

const OPENAI_BASE_URL = 'https://api.openai.com/v1'

export const generateImage = async (prompt, conversationHistory = []) => {
  // Build context from conversation history
  let contextPrompt = ''
  let previousDescriptions = []
  
  if (conversationHistory.length > 0) {
    // Get conversation context
    const previousMessages = conversationHistory.slice(-6) // Get last 6 messages (3 exchanges)
    
    previousMessages.forEach((msg, index) => {
      if (msg.type === 'user' && msg.text) {
        const nextMsg = previousMessages[index + 1]
        if (nextMsg && nextMsg.type === 'bot' && nextMsg.image) {
          previousDescriptions.push(`- ${msg.text}`)
        }
      }
    })
    
    if (previousDescriptions.length > 0) {
      contextPrompt = `
    CONTEXT: This appears to be a follow-up request in an ongoing conversation.
    Previous image requests in this session:
${previousDescriptions.join('\n')}
    
    Current request: "${prompt}"
    
    If this is meant to build upon or relate to previous images, incorporate those elements.
    Otherwise, create a fresh image based on the current request.
    `
    }
  }

  const systemPrompt = `
    You are a thumbnail-design assistant.  
    TASK:
    — Create a **1920 x 1080 px (16:9)** image ≤ 2 MB for YouTube.  
    — Base the concept on: “<USER_PROMPT>”.  
    — Follow every guideline below.  
${contextPrompt}
    GUIDELINES  
    1. **Instant clarity (0.3-s test)**  
      • One obvious focal point; no clutter.  
      • High contrast between subject and background; avoid busy patterns.  

    2. **Show the payoff**  
      • Make the image visually promise what happens in the first few seconds of the video.  
      • Emotional faces or before/after comparisons beat generic stills.  

    3. **Readable on a phone**  
      • Use bold, sans-serif font ≥ 120 pt in the full-size file.  
      • Test legibility at 200 × 112 px; everything important must still be clear.  

    <USER_PROMPT>
    ${prompt}
    </USER_PROMPT>
  `
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: systemPrompt,
        n: 1,
        size: '1536x1024',
        quality: 'high'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      throw new Error('Invalid response format from OpenAI API')
    }

    const base64Image = data.data[0].b64_json
    const imageUrl = `data:image/png;base64,${base64Image}`
    
    return {
      imageUrl,
      usage: data.usage
    }
  } catch (error) {
    console.error('Error generating image:', error)
    throw new Error(`Failed to generate image: ${error.message}`)
  }
}

export const editImage = async (imageFile, prompt, conversationHistory = []) => {
  try {
    // Build detailed context from conversation history
    let contextPrompt = prompt
    let previousDescriptions = []
    
    if (conversationHistory.length > 0) {
      // Get conversation context
      const previousMessages = conversationHistory.slice(-6) // Get last 6 messages (3 exchanges)
      
      previousMessages.forEach((msg, index) => {
        if (msg.type === 'user' && msg.text) {
          const nextMsg = previousMessages[index + 1]
          if (nextMsg && nextMsg.type === 'bot' && nextMsg.image) {
            previousDescriptions.push(`Previous request: "${msg.text}"`)
          }
        }
      })
      
      if (previousDescriptions.length > 0) {
        contextPrompt = `${prompt}

IMPORTANT CONTEXT - This is a follow-up edit request. The image being edited contains:
${previousDescriptions.join('\n')}

The user is now asking to: "${prompt}"
Please edit the existing image to add/modify based on this new request while keeping all previous elements intact.`
      }
    }

    const formData = new FormData()
    
    // Only append the single image to edit (OpenAI edit endpoint expects one image)
    formData.append('image', imageFile)
    formData.append('prompt', contextPrompt)
    formData.append('model', 'gpt-image-1')
    formData.append('n', '1')
    formData.append('size', '1536x1024')
    formData.append('quality', 'high')

    const response = await fetch(`${OPENAI_BASE_URL}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      throw new Error('Invalid response format from OpenAI API')
    }

    const base64Image = data.data[0].b64_json
    const imageUrl = `data:image/png;base64,${base64Image}`
    
    return {
      imageUrl,
      usage: data.usage
    }
  } catch (error) {
    console.error('Error editing image:', error)
    throw new Error(`Failed to edit image: ${error.message}`)
  }
}