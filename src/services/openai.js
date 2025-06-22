const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file')
}

const OPENAI_BASE_URL = 'https://api.openai.com/v1'

export const generateImage = async (prompt) => {

  const systemPrompt = `
    You are a thumbnail-design assistant.  
    TASK:
    — Create a **1920 x 1080 px (16:9)** image ≤ 2 MB for YouTube.  
    — Base the concept on: “<USER_PROMPT>”.  
    — Follow every guideline below.  

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

export const editImage = async (imageFile, prompt) => {
  try {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('prompt', prompt)
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