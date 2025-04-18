// 创建一个用于设置 headers 的通用函数
function createFetchOptions(env) {
    return {
        headers: {
            'Authorization': `Bearer ${env.CLOUDFLARE_API}`,
            'Content-Type': 'application/json'
        }
    };
}

// 通用的 fetch 请求函数
async function fetchFromCloudflare(endpoint, env) {
    const url = `https://api.cloudflare.com/client/v4${endpoint}`;
    const headers = createFetchOptions(env).headers;
    const options = { headers };
    const response = await fetch(url, options);
    return response.json();
}

// ASN 信息
async function getASNInfo(asn, env) {
    try {
        return await fetchFromCloudflare(`/radar/entities/asns/${asn}`, env);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN info');
    }
};

// IP 版本分布
async function getASNIPVersion(asn, env) {
    try {
        return await fetchFromCloudflare(`/radar/http/summary/ip_version?asn=${asn}&dateRange=7d`, env);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN IP version');
    }
};

// HTTP 协议分布
async function getASNHTTPProtocol(asn, env) {
    try {
        return await fetchFromCloudflare(`/radar/http/summary/http_protocol?asn=${asn}&dateRange=7d`, env);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN HTTP protocol');
    }
};

// 设备分布
async function getASNDeviceType(asn, env) {
    try {
        return await fetchFromCloudflare(`/radar/http/summary/device_type?asn=${asn}&dateRange=7d`, env);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN device type');
    }
};

// 机器人分布
async function getASNBotType(asn, env) {
    try {
        return await fetchFromCloudflare(`/radar/http/summary/bot_class?asn=${asn}&dateRange=7d`, env);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch ASN bot type');
    }
};

// 使用 Promise.all 进行并行请求
async function getAllASNData(asn, env) {
    try {
        const [asnInfo, ipVersion, httpProtocol, deviceType, botType] = await Promise.all([
            getASNInfo(asn, env),
            getASNIPVersion(asn, env),
            getASNHTTPProtocol(asn, env),
            getASNDeviceType(asn, env),
            getASNBotType(asn, env)
        ]);
        return { asnInfo, ipVersion, httpProtocol, deviceType, botType };
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch all ASN data');
    }
}

// 验证 asn 是否合法
function isValidASN(asn) {
    return /^[0-9]+$/.test(asn);
};

// 格式化输出

function formatData(data) {
    const { asnName, asnOrgName, estimatedUsers, IPv4_Pct, IPv6_Pct, HTTP_Pct, HTTPS_Pct, Desktop_Pct, Mobile_Pct, Bot_Pct, Human_Pct } = data;
    const formattedData = {
        asnName,
        asnOrgName,
        estimatedUsers: parseFloat(estimatedUsers).toLocaleString(),
        IPv4_Pct: `${parseFloat(IPv4_Pct).toFixed(2)}%`,
        IPv6_Pct: `${parseFloat(IPv6_Pct).toFixed(2)}%`,
        HTTP_Pct: `${parseFloat(HTTP_Pct).toFixed(2)}%`,
        HTTPS_Pct: `${parseFloat(HTTPS_Pct).toFixed(2)}%`,
        Desktop_Pct: `${parseFloat(Desktop_Pct).toFixed(2)}%`,
        Mobile_Pct: `${parseFloat(Mobile_Pct).toFixed(2)}%`,
        Bot_Pct: `${parseFloat(Bot_Pct).toFixed(2)}%`,
        Human_Pct: `${parseFloat(Human_Pct).toFixed(2)}%`
    };

    return formattedData;

}

// 过滤不存在的字段
function filterData(data) {
    for (const key in data) {
        if (data[key] === 'NaN' || data[key] === 'NaN%') {
            delete data[key];
        }
    }
    return data;
}

// 导出函数
export function onRequest({ request, params, env }) {
    console.log('env', env);


    // 限制只能从指定域名访问
    // const referer = request.headers.get('Referer');
    // const headers = createFetchOptions(env).headers;
    // if (!refererCheck(referer)) {
    //     return new Response(JSON.stringify({ error: 'Invalid referer' }), {
    //         status: 403,
    //         headers: {
    //             'Content-Type': 'application/json'
    //         }
    //     });
    // }

    const asn = params.asn;
    if (!asn) {
        return new Response(JSON.stringify({ error: 'No ASN provided' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    if (!isValidASN(asn)) {
        return new Response(JSON.stringify({ error: 'Invalid ASN' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    try {
        const { asnInfo, ipVersion, httpProtocol, deviceType, botType } = getAllASNData(asn, env);

        // 清洗数据
        function cleanUpResponseData(data) {
            return {
                asnName: data.asnInfo.result.asn.name,
                asnOrgName: data.asnInfo.result.asn.orgName,
                estimatedUsers: data.asnInfo.result.asn.estimatedUsers.estimatedUsers,
                IPv4_Pct: data.ipVersion.result.summary_0.IPv4,
                IPv6_Pct: data.ipVersion.result.summary_0.IPv6,
                HTTP_Pct: data.httpProtocol.result.summary_0.http,
                HTTPS_Pct: data.httpProtocol.result.summary_0.https,
                Desktop_Pct: data.deviceType.result.summary_0.desktop,
                Mobile_Pct: data.deviceType.result.summary_0.mobile,
                Bot_Pct: data.botType.result.summary_0.bot,
                Human_Pct: data.botType.result.summary_0.human
            };
        }

        const cleanedResponse = cleanUpResponseData({ asnInfo, ipVersion, httpProtocol, deviceType, botType });
        const finalResponse = formatData(cleanedResponse);
        filterData(finalResponse);

        return new Response(JSON.stringify(finalResponse), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
