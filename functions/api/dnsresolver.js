// api/dnsresolver.js

// 普通 DNS 服务器列表
const dnsServers = {
    'Google': 'https://dns.google/resolve?',
    'Cloudflare': 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&',
    'OpenDNS': 'https://doh.opendns.com/dns-query?',
    'Quad9': 'https://dns.quad9.net/dns-query?',
    'ControlD': 'https://controld.com/api/doh/resolve?',
    'AdGuard': 'https://dns.adguard.com/dns-query?',
    'AliDNS': 'https://dns.alidns.com/resolve?',
};

const resolveDns = async (hostname, type, name, url) => {
    try {
        const response = await fetch(`${url}name=${hostname}&type=${type}`, {
            headers: { 'Accept': 'application/dns-json' }
        });
        const data = await response.json();
        let addresses = [];
        if (data.Answer) {
            addresses = data.Answer.map(answer => answer.data);
        }
        if (addresses.length === 0) {
            return { [name]: `N/A` };
        }
        return { [name]: addresses };
    } catch (error) {
        console.log(error.message);
        return { [name]: `N/A` };
    }
};

export async function onRequest({ request, params, env }) {

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
    // if (!refererCheck(referer)) {
    //     return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    // }

    // 从请求中获取 IP 地址
    const reqUrl = new URL(request.url);
    const hostname = reqUrl.searchParams.get('hostname');
    const type = reqUrl.searchParams.get('type');

    if (typeof hostname !== 'string') {
        return new Response(JSON.stringify({ error: 'Hostname parameter must be a string' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    if (!hostname) {
        return new Response(JSON.stringify({ error: 'Missing hostname parameter' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    if (!hostname.includes('.')) {
        return new Response(JSON.stringify({ error: 'Invalid hostname' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    const dnsPromises = Object.entries(dnsServers).map(([name, url]) => resolveDns(hostname, type, name, url));

    try {
        // 并行执行所有 DNS 查询

        const result_dns = await Promise.all(dnsPromises);

        return new Response(JSON.stringify({
            hostname,
            result_dns,
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
