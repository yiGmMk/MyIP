export async function onRequest({ request, params, env }) {

    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    // if (!refererCheck(referer)) {
    //     return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    // }

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
    const apiEndpoint = env.IPCHECKING_API_ENDPOINT;
    const url = new URL(`${apiEndpoint}/userinfo?key=${key}`);

    try {
        const apiResponse = await fetch(url, {
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
