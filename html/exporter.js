function exportOPML() {
    const data = rssGenerator.collectData();
    let output = '<?xml version="1.0" encoding="UTF-8"?>\n';
    output += '<opml version="1.0">\n';
    output += '    <head>\n';
    output += '        <title>RSS Subscriptions</title>\n';
    output += '    </head>\n';
    output += '    <body>\n';

    for (const [category, items] of Object.entries(data)) {
        output += `        <outline text="${escapeXml(category)}">\n`;
        items.forEach(item => {
            const { query, title, engines } = item;
            const encodedQuery = encodeURIComponent(query);

            engines.forEach(engine => {
                const rssTitle = title || `[${engine === 'naver' ? 'N' : 'G'}] ${query}`;
                let rssUrl, htmlUrl;

                if (engine === 'naver') {
                    rssUrl = `http://127.0.0.1:1001/rss?q=${encodedQuery}&engine=naver`;
                    htmlUrl = `https://search.naver.com/search.naver?where=news&query=${encodedQuery}&start=1`;
                } else if (engine === 'google') {
                    rssUrl = `http://127.0.0.1:1001/rss?q=${encodedQuery}&engine=google`;
                    htmlUrl = `https://www.google.com/search?q=${encodedQuery}&tbm=nws`;
                }

                output += `            <outline htmlUrl="${escapeXml(htmlUrl)}" xmlUrl="${escapeXml(rssUrl)}" type="rss" description="뉴스 검색 결과 - 키워드: ${escapeXml(query)} (${engine})" text="${escapeXml(rssTitle)}"/>\n`;
            });
        });
        output += `        </outline>\n`;
    }

    output += '    </body>\n';
    output += '</opml>';

    updateResultSection(output, 'opml');
    rssGenerator.saveData();
}

function exportRSS() {
    const data = rssGenerator.collectData();
    let output = ``;
    for (const [category, items] of Object.entries(data)) {
        output += `# ${category}\n`;
        items.forEach(item => {
            const { query, engines } = item;
            engines.forEach(engine => {
                const encodedQuery = encodeURIComponent(query);
                const rssUrl = `http://127.0.0.1:1001/rss?q=${encodedQuery}&engine=${engine}`;
                output += `\t* ${query} (${engine}): ${rssUrl}\n`;
            });
        });
        output += `\n\n`;
    }
    document.getElementById('resultList').textContent = output;
    rssGenerator.saveData();
}

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
        }
    });
}