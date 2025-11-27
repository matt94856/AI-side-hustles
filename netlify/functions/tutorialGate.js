const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Use service role so we can securely check purchases server-side
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Map tutorial HTML names to numeric course IDs used in Supabase
const TUTORIAL_ID_MAP = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: 'Method Not Allowed',
    };
  }

  try {
    const user = context.clientContext && context.clientContext.user;

    // If not authenticated, send to login with a safe return_to param
    if (!user || !user.sub) {
      const returnTo = encodeURIComponent(event.path + (event.rawQuery ? `?${event.rawQuery}` : ''));
      return {
        statusCode: 302,
        headers: {
          ...headers,
          Location: `/login.html?return_to=${returnTo}`,
        },
        body: '',
      };
    }

    // Determine which tutorial file is being requested from the :splat parameter
    const qs = event.queryStringParameters || {};
    const rawPath = qs.path || '';

    // Only allow access to tutorial HTML files
    if (!rawPath.startsWith('tutorial') || !rawPath.endsWith('.html')) {
      return {
        statusCode: 400,
        headers,
        body: 'Invalid tutorial path',
      };
    }

    // Extract tutorial number from paths like "tutorial2.html" or "tutorial2-module3.html"
    const match = rawPath.match(/^tutorial(\d+)/);
    const tutorialNumber = match ? parseInt(match[1], 10) : NaN;

    if (!tutorialNumber || !TUTORIAL_ID_MAP[tutorialNumber]) {
      return {
        statusCode: 404,
        headers,
        body: 'Tutorial not found',
      };
    }

    const tutorialId = TUTORIAL_ID_MAP[tutorialNumber];

    // Check purchases: allow if user has all_access or this specific tutorial_id
    const { data: allAccess, error: allAccessError } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.sub || user.id)
      .eq('all_access', true)
      .maybeSingle();

    if (allAccessError && allAccessError.code !== 'PGRST116') {
      console.error('Error checking all_access:', allAccessError);
    }

    let hasAccess = !!allAccess;

    if (!hasAccess) {
      const { data: coursePurchase, error: courseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.sub || user.id)
        .eq('tutorial_id', tutorialId)
        .maybeSingle();

      if (courseError && courseError.code !== 'PGRST116') {
        console.error('Error checking course access:', courseError);
      }

      hasAccess = !!coursePurchase;
    }

    if (!hasAccess) {
      // Not purchased – send back to marketing page with a soft paywall signal
      return {
        statusCode: 302,
        headers: {
          ...headers,
          Location: `/index.html`,
        },
        body: '',
      };
    }

    // Resolve the tutorial file on disk (relative to repo root)
    const safeRelativePath = rawPath.replace(/(\.\.[/\\])/g, '');
    const filePath = path.join(__dirname, '..', '..', safeRelativePath);

    if (!fs.existsSync(filePath)) {
      return {
        statusCode: 404,
        headers,
        body: 'Tutorial file not found',
      };
    }

    const html = fs.readFileSync(filePath, 'utf8');

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: html,
    };
  } catch (error) {
    console.error('tutorialGate error:', error);
    return {
      statusCode: 500,
      headers,
      body: 'Internal Server Error',
    };
  }
};


