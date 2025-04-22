function refererCheck(referer, env) {
    const allowedDomains = ['localhost', ...(env.ALLOWED_DOMAINS || '').split(',')];

    if (referer) {
        const domain = new URL(referer).hostname;
        return allowedDomains.includes(domain);
    }
    return false;  // 如果没有提供 referer，返回 false
}

export { refererCheck };
