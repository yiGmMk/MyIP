export async function onRequest({ request, params, env }) {
    console.log('params', params, 'env', env);

    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: referer ? 'Access denied' : 'What are you doing?' }), {
            status: 403,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    const reqUrl = new URL(request.url);
    const ip = reqUrl.searchParams.get('ip');
    const lang = reqUrl.searchParams.get('lang') || 'zh-CN';
    if (!ip) {
        return new Response(JSON.stringify({ error: 'No IP address provided' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                "Referer": "https://ip.programnotes.cn/"
            }
        });
    }
    // 请求 https://myipapi.vercel.app/api/maxmind
    const api = 'https://myipapi.vercel.app/api/maxmind';

    try {
        const apiUrl = `${api}?ip=${ip}&lang=${lang}`;
        const headers = {
            'Content-Type': 'application/json',
            "Referer": "https://ip.programnotes.cn/"
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: headers
        });

        if (!apiResponse.ok) {
            throw new Error(`API responded with status: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

function refererCheck(referer, env) {
    const allowedDomains = ['localhost', 'client', ...(env.ALLOWED_DOMAINS || '').split(',')];

    if (referer) {
        const domain = new URL(referer).hostname;
        return allowedDomains.includes(domain);
    }
    return false;  // 如果没有提供 referer，返回 false
}
