function updateResultSection(content, type) {
    const resultContainer = document.getElementById('resultContainer');
    if (!resultContainer) {
        console.error("resultContainer 요소가 없습니다!");
        return;
    }

    resultContainer.innerHTML = `   
        <h2>결과</h2>
        <div class="result-header">
            ${type === 'opml' ? 
                `<button onclick="saveToFile()" class="btn save-btn">
                    <span class="save-icon">💾</span> 파일 저장
                </button>` 
                : ''
            }
        </div>
        <pre id="resultList" class="output-box">${escapeHTML(content)}</pre>
    `;

    console.log(resultContainer.innerHTML)
}

function getFormattedDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    return `${year}${month}${day}_${hour}${minute}`;
}

function saveToFile() {
    const content = document.getElementById('resultList').textContent;
    const fileName = `rss_${getFormattedDateTime()}.opml`;

    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function genOPML(content) {
    updateResultSection(escapeHTML(content), 'opml');
}
function escapeHTML(content) {
    const div = document.createElement('div');
    div.textContent = content;
    return div.innerHTML;
}
