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

    // 构建请求 ip-api.com 的 URL
    const lang = reqUrl.searchParams.get('lang') || 'en';
    const url = `http://ip-api.com/json/${ipAddress}?fields=66842623&lang=${lang}`;

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
    const { query, country, countryCode, regionName, city, lat, lon, isp, as } = json;
    const asn = as ? as.split(" ")[0] : '';

    return {
        ip: query,
        city,
        region: regionName,
        country: countryCode,
        country_name: country,
        country_code: countryCode,
        latitude: lat,
        longitude: lon,
        asn,
        org: isp
    };
}
