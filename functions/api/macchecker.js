const isValidMAC = (address) => {
    const normalizedAddress = address.replace(/[:-]/g, '');
    return normalizedAddress.length >= 6 && normalizedAddress.length <= 12 && /^[0-9A-Fa-f]+$/.test(normalizedAddress);
}

export async function onRequest({ request, params, env }) {
    // 限制只能从指定域名访问
    const referer = request.headers.get('Referer');
    // if (!refererCheck(referer)) {
    //     return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    // }

    // 从请求中获取 IP 地址
    const reqUrl = new URL(request.url);
    let macAddress = reqUrl.searchParams.get('mac');
    if (!macAddress) {
        return new Response(JSON.stringify({ error: 'No MAC address provided' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } else {
        macAddress = macAddress.replace(/:/g, '').replace(/-/g, '');
    }

    // 检查 IP 地址是否合法
    if (!isValidMAC(macAddress)) {
        return new Response(JSON.stringify({ error: 'Invalid MAC address' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }


    const token = env.MAC_LOOKUP_API_KEY || '';

    const url_hasToken = `https://api.maclookup.app/v2/macs/${macAddress}?apiKey=${token}`;
    const url_noToken = `https://api.maclookup.app/v2/macs/${macAddress}`;
    const url = token ? url_hasToken : url_noToken;
    
    console.log(url);
    try {
        const apiResponse =await fetch(url, {
            method: 'GET'
        });
        if (!apiResponse.ok) {
            throw new Error(`API responded with status: ${apiResponse.status}`);
        }
        const originalJson = await apiResponse.json();
        if (originalJson.success !== true) {
            return new Response(JSON.stringify({ success: false, error: originalJson.error || 'Data not found' }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        const finalData = modifyData(originalJson);
        return new Response(JSON.stringify(finalData), {
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


const modifyData = (data) => {
    // 检查单播/多播以及本地/全球地址
    const firstByte = parseInt(data.macPrefix.substring(0, 2), 16);
    const isMulticast = (firstByte & 0x01) === 0x01;
    const isLocal = (firstByte & 0x02) === 0x02;

    data.isMulticast = isMulticast ? true : false;
    data.isLocal = isLocal ? true : false;
    data.isGlobal = !isLocal ? true : false;
    data.isUnicast = !isMulticast ? true : false;
    data.macPrefix = data.macPrefix ? data.macPrefix.match(/.{1,2}/g).join(':') : 'N/A';
    data.company = data.company ? data.company : 'N/A';
    data.country = data.country ? data.country : 'N/A';
    data.address = data.address ? data.address : 'N/A';
    data.updated = data.updated ? data.updated : 'N/A';
    data.blockStart = data.blockStart ? data.blockStart.match(/.{1,2}/g).join(':') : 'N/A';
    data.blockEnd = data.blockEnd ? data.blockEnd.match(/.{1,2}/g).join(':') : 'N/A';
    data.blockSize = data.blockSize ? data.blockSize : 'N/A';
    data.blockType = data.blockType ? data.blockType : 'N/A';

    return data;
}
