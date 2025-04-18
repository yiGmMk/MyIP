import { isValidIP } from '../../common/valid-ip.js';

export async function onRequest({ request, env }) {

    console.log('request.url', request.url, 'env', env);

    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    // if (!refererCheck(referer)) {
    //     return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    // }

    // 从请求中获取 IP 地址
    const url = new URL(request.url);
    const ipAddress = url.searchParams.get('ip');
    if (!ipAddress) {
        return new Response(JSON.stringify({ error: 'No IP address provided' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // 检查 IP 地址是否合法
    if (!isValidIP(ipAddress)) {
        return new Response(JSON.stringify({ error: 'Invalid IP address' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    const key = env.IPCHECKING_API_KEY;

    if (!key) {
        return new Response(JSON.stringify({ error: 'API key is missing' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // 构建请求
    const lang = url.searchParams.get('lang') || 'en';
    const apiEndpoint = env.IPCHECKING_API_ENDPOINT;
    const apiUrl = new URL(`${apiEndpoint}/ipinfo?key=${key}&ip=${ipAddress}&lang=${lang}`);

    try {
        const apiResponse = await fetch(apiUrl, {
            headers: {
                ...request.headers,
            }
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
    } catch (error) {
        console.error("Error during API request:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
