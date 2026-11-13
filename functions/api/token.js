const ALLOWED_ORIGINS = [
  'https://zipeasyspeakai.pages.dev',
  'https://easyspeakai.zipsolutions.org',
];

export async function onRequest(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  const corsOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'null',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (fetchSite === 'cross-site') {
    return new Response('Forbidden: Cross-Site Request', { status: 403 });
  }

  const isAllowedOrigin = origin ? ALLOWED_ORIGINS.includes(origin) : fetchSite === 'same-origin';
  if (!isAllowedOrigin) {
    return new Response('Forbidden: Invalid Origin', { status: 403 });
  }

  try {
    const formData = await request.formData();
    const clientSecret = formData.get('secret');
    const secret = (env && env.OPENSYMBOLS_SECRET) || (typeof clientSecret === 'string' ? clientSecret.trim() : '');

    if (!secret || secret.length > 512) {
      return new Response('Missing or invalid secret', { status: 400 });
    }

    const tokenResponse = await fetch('https://www.opensymbols.org/api/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ secret }),
    });

    if (!tokenResponse.ok) {
      return new Response(JSON.stringify({ error: 'Upstream authentication failed' }), {
        status: tokenResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin,
        },
      });
    }

    const data = await tokenResponse.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Token exchange failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
      },
    });
  }
}
