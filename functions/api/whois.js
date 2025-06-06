export async function onRequest({ request, params, env }) {

    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    console.log('referer', referer, 'env', env);

    if (!refererCheck(referer, env)) {
        return new Response(JSON.stringify({ error: referer ? 'Access denied' : 'What are you doing?' }), {
            status: 403,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // 从请求中获取 IP 地址
    const reqUrl = new URL(request.url);
    const query = reqUrl.searchParams.get('q');
    if (!query) {
        return new Response(JSON.stringify({ error: 'No address provided' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }

    // 检查 IP 地址是否合法
    if (!isValidIP(query) && !isValidDomain(query)) {
        return new Response(JSON.stringify({ error: 'Invalid IP or address' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    const whoisApiUrl = 'https://myipapi.programnotes.cn/api/whois';

    try {
        const apiUrl = `${whoisApiUrl}?q=${query}`;
        const headers = {
            'Content-Type': 'application/json',
            "Referer": "https://ip.programnotes.cn/"
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: headers
        });

        if (!apiResponse.ok) {
            const tip = await apiResponse.json();
            throw new Error(`API responded with status: ${apiResponse.status} ${JSON.stringify(tip)}`);
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

function isValidDomain(domain) {
    const domainPattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainPattern.test(domain);
}

// 验证IP地址是否合法
function isValidIP(ip) {
    const ipv4Pattern =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Pattern =
        /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){0,6}([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:){0,6}([0-9a-fA-F]{1,4})?))$/;
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
};

function refererCheck(referer, env) {
    const allowedDomains = ['localhost', 'client', ...(env.ALLOWED_DOMAINS || '').split(',')];

    if (referer) {
        const domain = new URL(referer).hostname;
        return allowedDomains.includes(domain);
    }
    return false;  // 如果没有提供 referer，返回 false
}
