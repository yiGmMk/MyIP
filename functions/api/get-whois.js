import whoiser from 'whoiser';
import { isValidIP } from '../../common/valid-ip.js';

function isValidDomain(domain) {
    const domainPattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainPattern.test(domain);
}

export async function onRequest({ request, params, env }) {

    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    // if (!refererCheck(referer)) {
    //     return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    // }


    const query = params.q;
    if (!query) {
        return new Response(JSON.stringify({ error: 'No address provided' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
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

    if (isValidIP(query)) {
        try {
            const ipinfo = await whoiser.ip(query, { timeout: 5000, raw: true });
            return new Response(JSON.stringify(ipinfo), {
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
    } else {
        try {
            const domaininfo = await whoiser.domain(query, { ignorePrivacy: false, timeout: 5000, follow: 2, raw: true });
            return new Response(JSON.stringify(domaininfo), {
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
}
