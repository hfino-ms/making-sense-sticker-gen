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
      timestamp = new Date().toISOString(),
      // Optional: allow passing Supabase credentials in the request body as a fallback
      supabaseUrl: incomingSupabaseUrl,
      supabaseKey: incomingSupabaseKey
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
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || (req.connection && req.connection.remoteAddress) || null,
        referer: req.headers.referer || null
      }
    };

    // Log a summary of the submission (do not log secrets)
    console.log('User data submitted:', {
      nombre: userData.nombre,
      email: userData.email,
      timestamp: userData.timestamp,
      hasArchetype: !!userData.arquetipo,
      hasImage: !!userData.imagenGenerada,
      answersCount: Object.keys(userData.respuestas).length
    });

    // For this deployment we do not persist images server-side. The frontend must provide
    // a public URL for `imagenGenerada`. If a data URL is provided, we will drop it and log a warning.
    if (userData.imagenGenerada && String(userData.imagenGenerada).startsWith('data:')) {
      console.warn('Received image as data URL; server will not upload images. Please provide a public URL in imagenGenerada.');
      // Remove binary data to avoid sending large payloads to downstream services
      userData.imagenGenerada = null;
    }

    // Trigger external webhook (n8n) with the standardized payload. Use env var N8N_WEBHOOK_URL if provided,
    // otherwise pick test/prod defaults depending on NODE_ENV. This should not block the main response —
    // failures here are logged but we still return success to the client.
    const configuredN8n = process.env.N8N_WEBHOOK_URL || 'https://nano-ms.app.n8n.cloud/webhook-test/sticker-app';

    // Build survey payload expected by n8n: numeric keys question_1/answer_1 for the 5 known questions
    const surveyObj = {};
    try {
      // Explicit mapping to preserve order and friendly labels (text matches expected payload)
      const questionMap = [
        {
          id: 'decision_making',
          question: 'Which best describes your approach to making business decisions?',
          options: { data_driven: 'Data-driven', hybrid: 'Hybrid', balanced_mix: 'Balanced mix', intuition: 'Intuition' }
        },
        {
          id: 'tech_adoption',
          question: 'Which mindset do you most identify with when new technologies emerge?',
          options: { disruptor: 'Disruptor', tester: 'Tester', observer: 'Observer', late_adopter: 'Late Adopter' }
        },
        {
          id: 'risk_appetite',
          question: 'With new opportunities, how would you describe your risk tolerance?',
          options: { high: 'High', moderate_high: 'Moderate-High', moderate_low: 'Moderate-Low', low: 'Low' }
        },
        {
          id: 'team_dynamics',
          question: 'When working on a team project, which approach best describes your style?',
          options: { hands_on: 'Hands-on', collaborative: 'Collaborative', advisory: 'Advisory', delegative: 'Delegative' }
        },
        {
          id: 'growth_priorities',
          question: 'When defining your vision for the future, which area is your primary focus?',
          options: { operational_efficiency: 'Operational efficiency', market_expansion: 'Market expansion', innovation: 'Innovation', talent_strengthening: 'Talent strengthening' }
        }
      ];

      questionMap.forEach((qm, idx) => {
        const slot = idx + 1;
        surveyObj[`question_${slot}`] = qm.question;
        const ansObj = (userData.respuestas || {})[qm.id];
        if (!ansObj) {
          surveyObj[`answer_${slot}`] = '';
          return;
        }
        // ansObj expected shape: { choice: 'option_id', intensity?: number }
        if (typeof ansObj === 'object') {
          const choice = ansObj.choice ?? String(ansObj);
          // Map choice id to friendly label if available, otherwise stringify
          surveyObj[`answer_${slot}`] = qm.options[choice] || String(choice);
        } else {
          surveyObj[`answer_${slot}`] = String(ansObj);
        }
      });
    } catch (e) {
      console.warn('Failed to build survey object for webhook:', e);
    }

    const webhookPayload = {
      email: userData.email,
      name: userData.nombre,
      timestamp: userData.timestamp,
      sticker: userData.imagenGenerada || null,
      photo: req.body.photo || null,
      archetype: userData.arquetipo || null,
      survey: surveyObj
    };

    (async () => {
      try {
        if (!configuredN8n) {
          console.warn('No n8n webhook URL configured; skipping webhook call');
          return;
        }
        const resp = await fetch(configuredN8n, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
          // allow a short timeout by using AbortController if desired
        });
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          console.warn('n8n webhook responded with non-OK status', resp.status, resp.statusText, txt);
        } else {
          console.log('n8n webhook called successfully');
        }
      } catch (e) {
        console.error('Failed to call n8n webhook:', e?.message || e);
      }
    })();

    return res.status(200).json({
      success: true,
      message: 'User data submitted successfully',
      submissionId: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      data: userData
    });

  } catch (error) {
    console.error('Error submitting user data:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: String(error.message || error)
    });
  }
}
