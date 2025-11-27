const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const requiredEnv = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'WEBHOOK_SECRET',
  ];

  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  let supabaseHealthy = false;
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      const { error } = await supabase.from('users').select('id').limit(1);
      if (!error) supabaseHealthy = true;
    }
  } catch (err) {
    supabaseHealthy = false;
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({
      ok: missingEnv.length === 0 && supabaseHealthy,
      env: {
        missing: missingEnv,
      },
      checks: {
        supabase: supabaseHealthy,
      },
      timestamp: new Date().toISOString(),
    }),
  };
};


