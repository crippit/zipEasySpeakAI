const ALLOWED_ORIGINS = [
  'https://zipeasyspeakai.pages.dev',
  'https://easyspeakai.zipsolutions.org',
];

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    return true;
  }

  // Block private/link-local IPv4 ranges and cloud metadata IPs
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    ) {
      return true;
    }
  }

  // Block IPv6 ULA / link-local
  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) {
    return true;
  }

  return false;
}

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  const origin = request.headers.get('Origin');
  const fetchSite = request.headers.get('Sec-Fetch-Site');

  // 1. Handle CORS Preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'null';
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 2. Restrict HTTP methods
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // 3. Validate: Target URL exists
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // 4. Security: Origin & Same-Origin Check
  if (fetchSite === 'cross-site') {
    return new Response('Forbidden: Cross-Site Request', { status: 403 });
  }
  const isAllowedOrigin = origin ? ALLOWED_ORIGINS.includes(origin) : fetchSite === 'same-origin';
  if (!isAllowedOrigin) {
    return new Response('Forbidden: Invalid Origin', { status: 403 });
  }

  try {
    const targetObj = new URL(targetUrl);

    // 5. Security: Protocol & Private Host Check (Prevent SSRF/Local Network Scanning)
    if (targetObj.protocol !== 'https:') {
      return new Response('Forbidden: Only HTTPS URLs allowed', { status: 400 });
    }
    if (isBlockedHost(targetObj.hostname)) {
      return new Response('Forbidden: Target host not allowed', { status: 403 });
    }

    const isOpenSymbolsAPI =
      targetObj.hostname === 'www.opensymbols.org' || targetObj.hostname === 'api.opensymbols.org';

    // 6. Fetch the resource
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'ZipEasySpeak/1.0',
        ...(isOpenSymbolsAPI && request.headers.get('Authorization')
          ? { Authorization: request.headers.get('Authorization') }
          : {}),
      },
    });

    // 7. Security: Content-Type Check (Anti-Abuse)
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const isImage = contentType.startsWith('image/');
    const isJson = contentType.includes('application/json');

    if (isOpenSymbolsAPI) {
      if (!isJson && !isImage) {
        return new Response('Forbidden: Invalid content type from OpenSymbols.', { status: 403 });
      }
    } else if (!isImage) {
      return new Response('Forbidden: Proxy only allows image content.', { status: 403 });
    }

    // 8. Return Response with safe headers
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', origin || ALLOWED_ORIGINS[0]);
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('X-Content-Type-Options', 'nosniff');
    if (contentType.includes('svg+xml')) {
      headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return new Response('Proxy fetch failed', { status: 502 });
  }
}
