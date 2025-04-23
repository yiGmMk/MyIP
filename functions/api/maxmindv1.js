import { isValidIP } from '../../common/valid-ip.js';

export async function onRequest({ request, params, env }) {

    console.log('params', params, 'env', env);

    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    // if (!refererCheck(referer)) {
    //     return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    // }

    const reqUrl = new URL(request.url);
    const ip = reqUrl.searchParams.get('ip');
    if (!ip) {
        return new Response(JSON.stringify({ error: 'No IP address provided' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // 检查 IP 地址是否合法
    if (!isValidIP(ip)) {
        return new Response(JSON.stringify({ error: 'Invalid IP address' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // 获取请求语言
    const lang = params.lang === 'zh-CN' || params.lang === 'en' || params.lang === 'fr' ? params.lang : 'en';

    return new Response(JSON.stringify({ error: 'Maxmind lookups are temporarily disabled' }), {
        status: 500,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

// function modifyJson(ip, lang, city, asn) {
//     city = city || {};
//     asn = asn || {};
//     return {
//         ip,
//         city: city.city ? city.city.names[lang] || city.city.names.en : "N/A",
//         region: city.subdivisions ? city.subdivisions[0].names[lang] || city.subdivisions[0].names.en : "N/A",
//         country: city.country ? city.country.iso_code : "N/A",
//         country_name: city.country ? city.country.names[lang] : "N/A",
//         country_code: city.country ? city.country.iso_code : "N/A",
//         latitude: city.location ? city.location.latitude : "N/A",
//         longitude: city.location ? city.location.longitude : "N/A",
//         asn: asn.autonomous_system_number ? "AS" + asn.autonomous_system_number : "N/A",
//         org: asn.autonomous_system_organization ? asn.autonomous_system_organization : "N/A"
//     };
// };
