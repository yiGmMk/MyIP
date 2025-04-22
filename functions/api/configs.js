import { refererCheck } from '../../common/referer-checkv1.js';

// 验证环境变量是否存在，以进行前端功能的开启和关闭
export function onRequest({ request, env }) {
    // 限制请求方法
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');

    console.log('referer', referer);

    let hostname = "";
    if (referer !== null) {
        hostname = referer ? new URL(referer).hostname : '';
        if (!refererCheck(referer, env)) {
            return new Response(JSON.stringify({ error: 'Access denied' }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    }
    const allowedHostnames = ['ipcheck.ing', 'www.ipcheck.ing', 'localtest.ipcheck.ing'];
    const originalSite = allowedHostnames.includes(hostname);

    const envConfigs = {
        map: env.GOOGLE_MAP_API_KEY,
        ipInfo: env.IPINFO_API_TOKEN,
        ipChecking: env.IPCHECKING_API_KEY,
        ip2location: env.IP2LOCATION_API_KEY,
        originalSite,
        cloudFlare: env.CLOUDFLARE_API,
        ipapiis: env.IPAPIIS_API_KEY,
    };
    let result = {};
    for (const key in envConfigs) {
        result[key] = !!envConfigs[key];
    }
    return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
