import { isValidIP } from '../../common/valid-ip.js';

export async function onRequest({ request, params, env }) {
    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    // if (!refererCheck(referer)) {
    //     return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    // }


    // 从请求中获取 IP 地址
    const ipAddress = params.ip;
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

    const keys = (env.IP2LOCATION_API_KEY).split(',');
    const key = keys[Math.floor(Math.random() * keys.length)];
    const url = `https://api.ip2location.io/?ip=${ipAddress}&key=${key}`;

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
    const { ip, country_code, country_name, region_name, city_name, latitude, longitude, as } = json;

    return {
        ip: ip,
        city: city_name || 'N/A',
        region: region_name || 'N/A',
        country: country_code || 'N/A',
        country_name: country_name || 'N/A',
        country_code: country_code || 'N/A',
        latitude: latitude || 'N/A',
        longitude: longitude || 'N/A',
        asn: asn === undefined || asn === null ? 'N/A' : 'AS' + asn,
        org: as || 'N/A',
    };
}
