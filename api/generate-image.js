import OpenAI, { toFile } from 'openai';

const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.VITE_API_KEY_IMAGE_GENERATION;
const openai = new OpenAI({
  apiKey: OPENAI_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    console.log('🔑 OPENAI_KEY present:', !!OPENAI_KEY);
    console.log('🔑 OPENAI_KEY first 10 chars:', OPENAI_KEY?.substring(0, 10));
    
    if (!OPENAI_KEY) return res.status(500).json({ error: 'Server missing OPENAI key' });
    
    const { prompt, selfieDataUrl } = req.body || {};
    console.log('📝 Prompt received:', prompt?.substring(0, 100) + '...');
    console.log('📸 Selfie provided:', !!selfieDataUrl);
    
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    try {
      let result;
      
      if (selfieDataUrl) {
        // Use real image with images.edit()
        console.log('🚀 Using real image with OpenAI images.edit()...');
        
        // Convert data URL to buffer
        const match = selfieDataUrl.match(/^data:(.*);base64,(.*)$/);
        if (!match) {
          return res.status(400).json({ error: 'Invalid selfie data URL format' });
        }
        
        const mimeType = match[1];
        const base64Data = match[2];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        console.log('📷 Image buffer size:', imageBuffer.length, 'bytes');
        console.log('📷 Image MIME type:', mimeType);
        
        // Convert buffer to File using toFile
        const imageFile = await toFile(imageBuffer, 'selfie.jpg', {
          type: mimeType || 'image/jpeg'
        });
        
        console.log('📁 Created file object for OpenAI');
        
        // Create enhanced prompt for personalization
        const personalizedPrompt = `${prompt}. Transform this into a circular sticker design incorporating the person's appearance and features from the reference image. Make it creative and stylized while maintaining the person's recognizable characteristics.`;
        
        result = await openai.images.edit({
          model: "gpt-image-1",
          image: imageFile,
          prompt: personalizedPrompt,
          size: "1024x1024",
          n: 1
        });
        
        console.log('✅ OpenAI images.edit() success with real photo!');
        
      } else {
        // Use regular generation for no photo
        console.log('🚀 Using regular image generation...');
        
        result = await openai.images.generate({
          model: "gpt-image-1",
          prompt: prompt,
          size: "1024x1024",
          n: 1
        });
        
        console.log('✅ OpenAI images.generate() success!');
      }
      
      console.log('📊 Result structure keys:', Object.keys(result));
      console.log('📊 Result data length:', result.data?.length);
      console.log('📊 Has b64_json:', !!result.data?.[0]?.b64_json);
      console.log('📊 Has url:', !!result.data?.[0]?.url);
      
      // Return envelope format for compatibility
      return res.status(200).json({
        status: 200,
        ok: true,
        bodyText: JSON.stringify(result),
        bodyJson: result,
      });
      
    } catch (openaiErr) {
      console.error('❌ OpenAI API error:', openaiErr);
      console.error('❌ Error details:', {
        message: openaiErr.message,
        status: openaiErr.status,
        code: openaiErr.code,
        type: openaiErr.type
      });
      
      return res.status(502).json({ 
        status: openaiErr.status || 500,
        ok: false,
        bodyText: String(openaiErr?.message || openaiErr),
        bodyJson: null,
        error: String(openaiErr?.message || openaiErr) 
      });
    }
  } catch (err) {
    console.error('❌ General error:', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
