export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing "url" query parameter', { status: 400 });
  }

  // SECURITY: Whitelist allowed domains to prevent open proxy abuse
  const allowedDomains = [
    'www.opensymbols.org',
    'api.opensymbols.org',
    'images.weserv.nl'
  ];

  try {
    const target = new URL(targetUrl);
    if (!allowedDomains.includes(target.hostname)) {
      return new Response('Forbidden: Domain not allowed', { status: 403 });
    }
  } catch (e) {
    return new Response('Invalid URL', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'zipEasySpeak-Proxy/1.0',
      },
    });

    // SECURITY: Content-Type restriction
    // We strictly allow only Images (for symbols) and JSON (for search API results).
    // This prevents the proxy from being used to serve HTML (phishing/XSS) or other malicious types.
    const contentType = response.headers.get('content-type') || '';
    const isImage = contentType.startsWith('image/');
    const isJson = contentType.includes('application/json');

    if (!isImage && !isJson) {
      return new Response(`Forbidden: Content-Type '${contentType}' not allowed. Only images and JSON are permitted.`, { status: 403 });
    }

    const headers = new Headers(response.headers);

    // SECURITY: Ideally restrict this to your specific app domain in production
    // e.g. headers.set('Access-Control-Allow-Origin', 'https://your-app.pages.dev');
    headers.set('Access-Control-Allow-Origin', '*');

    // Optional: Cache control headers if needed
    // headers.set('Cache-Control', 'public, max-age=3600'); 

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  } catch (error) {
    return new Response(`Error fetching URL: ${error.message}`, { status: 500 });
  }
}