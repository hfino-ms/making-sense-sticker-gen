export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { 
      nombre, 
      email, 
      respuestas, 
      arquetipo, 
      imagenGenerada,
      timestamp = new Date().toISOString()
    } = req.body || {};
    
    // Validate required fields
    if (!nombre || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: nombre and email are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }
    
    // Prepare the complete user data object
    const userData = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      respuestas: respuestas || {},
      arquetipo: arquetipo || null,
      imagenGenerada: imagenGenerada || null,
      timestamp,
      // Add metadata
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        referer: req.headers.referer
      }
    };
    
    // Log the submission (in production, you might want to store this in a database)
    console.log('User data submitted:', {
      nombre: userData.nombre,
      email: userData.email,
      timestamp: userData.timestamp,
      hasArchetype: !!userData.arquetipo,
      hasImage: !!userData.imagenGenerada,
      answersCount: Object.keys(userData.respuestas).length
    });
    
    // TODO: Here you can integrate with your preferred storage solution:
    // - Send to a database (MongoDB, PostgreSQL, etc.)
    // - Send to a webhook
    // - Send to a CRM (HubSpot, Salesforce, etc.)
    // - Send to an email marketing platform (Mailchimp, SendGrid, etc.)
    // - Store in a file system
    // - Send to analytics platforms
    
    // For now, we'll just return success
    // In the future, you might want to:
    // await sendToDatabase(userData);
    // await sendToWebhook(userData);
    // await sendToCRM(userData);
    
    return res.status(200).json({ 
      success: true, 
      message: 'User data submitted successfully',
      submissionId: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
  } catch (error) {
    console.error('Error submitting user data:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
