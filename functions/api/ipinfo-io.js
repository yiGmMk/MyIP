import { isValidIP } from '../../common/valid-ip.js';
import countryLookup from 'country-code-lookup';

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

    // 构建请求 ipinfo.io 的 URL
    const tokens = (env.IPINFO_API_TOKEN || '').split(',');
    const token = tokens[Math.floor(Math.random() * tokens.length)];

    const url_hasToken = `https://ipinfo.io/${ipAddress}?token=${token}`;
    const url_noToken = `https://ipinfo.io/${ipAddress}`;
    const url = token ? url_hasToken : url_noToken;

    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {
            throw new Error(`API responded with status: ${apiResponse.status}`);
        }
        const json = await apiResponse.json();
        const modifiedJson = modifyJson(json);
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

function modifyJson(json) {
    const { ip, city, region, country, loc, org } = json;

    const countryName = countryLookup.byIso(country).country || 'Unknown Country';

    const [latitude, longitude] = loc.split(',').map(Number);
    const [asn, ...orgName] = org.split(' ');
    const modifiedOrg = orgName.join(' ');

    return {
        ip,
        city,
        region,
        country,
        country_name: countryName,
        country_code: country,
        latitude,
        longitude,
        asn,
        org: modifiedOrg
    };
}
