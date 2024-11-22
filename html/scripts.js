// scripts.js
class RSSGenerator {
    constructor() {
        this.container = document.getElementById('inputContainer');
        this.output = document.getElementById('resultList');
        this.initializeDefaultBoard();
        this.loadSavedData();  // 생성자에서 데이터 로드
    }

    initializeDefaultBoard() {
        if (!this.getBoardByCategory('없음')) {
            this.createBoard({ category: '없음' });
        }
    }

    loadSavedData() {
        const saved = JSON.parse(localStorage.getItem(RssDataKey));
        if (!saved) return;
        
        // 기존 보드 모두 제거
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        // 저장된 데이터로 보드 다시 생성
        Object.entries(saved).forEach(([category, items]) => {
            this.createBoard({ category });
            const board = this.getBoardByCategory(category);
            if (board && items && Array.isArray(items)) {
                items.forEach(item => this.addCard(board, item));
            }
        });
    }

    getBoardByCategory(category) {
        return Array.from(this.container.querySelectorAll('.board'))
            .find(board => board.querySelector('.board-title').textContent === category);
    }

    createBoard(data = { category: '' }) {
        const { category } = data;

        if (this.getBoardByCategory(category)) return;

        const board = document.createElement('div');
        board.className = 'board';

        board.innerHTML = `
            <div class="board-title">${category || '대분류'}</div>
            <button class="btn add-card-btn">키워드 추가</button>
        `;

        board.querySelector('.add-card-btn').onclick = () => this.addCard(board);
        this.container.appendChild(board);
        return board;
    }

    addCard(board, item = {}) {
        const card = document.createElement('div');
        card.className = 'card';

        const { query = '', title = '', engines = item.engines || ['naver'] } = item;

        card.innerHTML = `
            <input type="text" placeholder="키워드를 입력하세요" value="${query}">
            <input type="text" placeholder="제목을 입력하세요 (옵셔널)" value="${title}" ${query ? '' : 'disabled'}>
            <div class="search-engine-checkboxes">
                ${this.createEngineCheckbox('naver', '네이버', engines.includes('naver'))}
                ${this.createEngineCheckbox('google', '구글', engines.includes('google'))}
            </div>
            <button class="delete-card">×</button>
        `;

        const keywordInput = card.querySelector('input[type="text"]:first-child');
        const titleInput = card.querySelector('input[type="text"]:nth-child(2)');
        const deleteButton = card.querySelector('.delete-card');
        const checkboxes = card.querySelectorAll('.search-engine-checkboxes input[type="checkbox"]');

        keywordInput.addEventListener('input', () => {
            titleInput.disabled = !keywordInput.value.trim();
            if (!titleInput.disabled) {
                titleInput.value = '';
            }
            this.saveData();
        });

        [titleInput, ...checkboxes].forEach(element =>
            element.addEventListener('input', () => {
                this.ensureMinimumOneCheckbox(checkboxes);
                this.saveData();
            })
        );

        deleteButton.onclick = () => {
            board.removeChild(card);
            this.saveData();
        };

        board.insertBefore(card, board.querySelector('.add-card-btn'));
    }

    createEngineCheckbox(value, label, isChecked) {
        return `
            <label>
                <input type="checkbox" value="${value}" ${isChecked ? 'checked' : ''}>
                <span>${label}</span>
            </label>
        `;
    }

    ensureMinimumOneCheckbox(checkboxes) {
        const checkedBoxes = Array.from(checkboxes).filter(checkbox => checkbox.checked);
        if (checkedBoxes.length === 0) {
            checkboxes[0].checked = true;
        }
    }

    collectData() {
        const data = {};
        this.container.querySelectorAll('.board').forEach(board => {
            const category = board.querySelector('.board-title').textContent;
            const cards = board.querySelectorAll('.card');

            if (category && cards.length > 0) {
                data[category] = Array.from(cards).map(card => ({
                    query: card.querySelector('input[type="text"]:first-child').value,
                    title: card.querySelector('input[type="text"]:nth-child(2)').value,
                    engines: Array.from(card.querySelectorAll('.search-engine-checkboxes input[type="checkbox"]:checked'))
                        .map(checkbox => checkbox.value)
                }));
            }
        });
        return data;
    }

    saveData() {
        localStorage.setItem(RssDataKey, JSON.stringify(this.collectData()));
    }
}

// 전역 변수 설정
let rssGenerator;
const RssDataKey = 'rssData';

window.onload = () => {
    rssGenerator = new RSSGenerator();
};

window.addBoard = () => {
    const categoryName = prompt("대분류 이름을 입력하세요:");
    if (categoryName) {
        rssGenerator.createBoard({ category: categoryName });
        rssGenerator.saveData();
    }
};

window.genOPML = () => exportOPML();
window.genRSS = () => exportRSS();