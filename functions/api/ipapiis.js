import { isValidIP } from '../../common/valid-ip.js';

export async function onRequest({ request, params, env }) {
    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    // if (!refererCheck(referer)) {
    //     return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    // }


    // 从请求中获取 IP 地址
    const reqUrl = new URL(request.url);
    const ipAddress = reqUrl.searchParams.get('ip');
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

    const keys = (env.IPAPIIS_API_KEY).split(',');
    const key = keys[Math.floor(Math.random() * keys.length)];
    const url = `https://api.ipapi.is?q=${ipAddress}&key=${key}`;

    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {
            throw new Error(`API responded with status: ${apiResponse.status}`);
        }
        const json = await apiResponse.json();
        const modifiedJson = modifyJsonForIPAPI(json);
        return new Response(JSON.stringify(modifiedJson), {
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
};

function modifyJsonForIPAPI(json) {
    let asn = json.asn || {};
    const { ip, location, is_datacenter, is_proxy, is_vpn, is_tor } = json;

    return {
        ip: ip,
        city: location.city || 'N/A',
        region: location.state || 'N/A',
        country: location.country_code || 'N/A',
        country_name: location.country || 'N/A',
        country_code: location.country_code || 'N/A',
        latitude: location.latitude || 'N/A',
        longitude: location.longitude || 'N/A',
        asn: asn.asn === undefined ? 'N/A' : 'AS' + asn.asn,
        org: asn.org || 'N/A',
        isHosting: is_datacenter || false,
        isProxy: is_proxy || is_vpn || is_tor || false
    };
}
