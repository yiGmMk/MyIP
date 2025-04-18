// 如果长度不等于 28 且不是字母与数字的组合，则返回 false
function isValidUserID(userID) {
    if (typeof userID !== 'string') {
        console.error("Invalid type for userID");
        return false;
    }
    if (userID.length !== 28 || !/^[a-zA-Z0-9]+$/.test(userID)) {
        console.error("Invalid userID format");
        return false;
    }
    return true;
}

export async function onRequest({ request, params, env }) {

    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    // if (!refererCheck(referer)) {
    //     return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    // }

    const id = params.id;
    if (!id) {
        return new Response(JSON.stringify({ error: 'No ID provided' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // 检查 IP 地址是否合法
    if (!isValidUserID(id)) {
        return new Response(JSON.stringify({ error: 'Invalid ID' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    const apikey = env.IPCHECKING_API_KEY;

    if (!apikey) {
        return new Response(JSON.stringify({ error: 'API key is missing' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    const apiEndpoint = env.IPCHECKING_API_ENDPOINT;
    const url = new URL(`${apiEndpoint}/getpdresult/${id}?apikey=${apikey}`);

    try {
        const apiResponse = await fetch(url, {
            headers: {
                ...request.headers,
            }
        });

        // 捕捉上游错误
        if (!apiResponse.ok) {
            let errorDetail = '';
            try {
                const errorData = await apiResponse.json();
                errorDetail = errorData.message || JSON.stringify(errorData);
            } catch {
                errorDetail = apiResponse.statusText;
            }
            throw new Error(`API responded with status: ${apiResponse.status} - ${errorDetail}`);
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

};
