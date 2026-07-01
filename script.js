let tabCount = 0;
let activeTabId = null;
let isIncognito = false;

// Хранилище истории для каждой вкладки
let tabHistory = {}; 

function createNewTab() {
    tabCount++;
    const tabId = 'tab-' + tabCount;
    
    tabHistory[tabId] = {
        urls: [],
        currentIndex: -1
    };

    const tabButton = document.createElement('div');
    tabButton.className = 'tab';
    tabButton.id = 'btn-' + tabId;
    tabButton.onclick = () => switchTab(tabId);
    tabButton.innerHTML = `Новая вкладка <span class="close-tab" onclick="closeTab(event, '${tabId}')">×</span>`;

    const tabsBar = document.getElementById('tabsBar');
    tabsBar.insertBefore(tabButton, tabsBar.lastElementChild);

    const contentContainer = document.getElementById('browserContent');
    
    const tabContent = document.createElement('div');
    tabContent.id = 'content-' + tabId;
    tabContent.style.height = '100%';

    tabContent.innerHTML = `
        <div class="search-home" id="home-${tabId}">
            <div class="logo">Veloftis</div>
            <div class="search-box">
                <input type="text" class="search-input" id="search-in-${tabId}" placeholder="Поиск в сети..." onkeydown="if(event.key === 'Enter') tabSearch('${tabId}')">
                <button class="search-btn" onclick="tabSearch('${tabId}')">Найти</button>
            </div>
        </div>
        <!-- Заменили капризный iframe на стабильный внутренний контейнер -->
        <div class="web-view" id="frame-${tabId}" style="padding: 40px 20px; overflow-y: auto; background: var(--panel-bg); color: var(--text-color);"></div>
    `;

    contentContainer.appendChild(tabContent);
    switchTab(tabId);
    updateCloseButtonsVisibility();
}

function switchTab(tabId) {
    activeTabId = tabId;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#browserContent > div').forEach(c => c.style.display = 'none');

    const currentTab = document.getElementById('btn-' + tabId);
    if(currentTab) currentTab.classList.add('active');
    
    const currentContent = document.getElementById('content-' + tabId);
    if(currentContent) currentContent.style.display = 'block';

    const frame = document.getElementById('frame-' + tabId);
    const addressBar = document.getElementById('addressBar');
    if (frame && frame.dataset.originalSrc) {
        addressBar.value = frame.dataset.originalSrc;
    } else {
        addressBar.value = '';
    }
    
    updateForwardButtonVisibility();
}

function closeTab(event, tabId) {
    event.stopPropagation();
    
    const remainingTabsBefore = document.querySelectorAll('.tab');
    if (remainingTabsBefore.length <= 1) return;

    document.getElementById('btn-' + tabId).remove();
    document.getElementById('content-' + tabId).remove();
    delete tabHistory[tabId];

    if (activeTabId === tabId) {
        const remainingTabs = document.querySelectorAll('.tab');
        const nextTabId = remainingTabs[remainingTabs.length - 1].id.replace('btn-', '');
        switchTab(nextTabId);
    }
    
    updateCloseButtonsVisibility();
}

function updateCloseButtonsVisibility() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        const closeBtn = tab.querySelector('.close-tab');
        if (closeBtn) {
            closeBtn.style.display = tabs.length > 1 ? 'inline' : 'none';
        }
    });
}

function tabSearch(tabId) {
    const query = document.getElementById(`search-in-${tabId}`).value;
    processInput(query, tabId);
}

function loadUrl(input) {
    if (activeTabId) {
        processInput(input, activeTabId);
    }
}

// ВСТРОЕННЫЙ ПОИСКОВОЙ ДВИЖОК VELOFTIS SEARCH (БЕЗ ИИ-ТЕКСТА, ОДНОТОННЫЙ ДИЗАЙН)
function processInput(input, tabId, isNavigating = false) {
    if (!input) return;

    let text = input.trim();
    const homeContainer = document.getElementById(`home-${tabId}`);
    const frame = document.getElementById(`frame-${tabId}`);
    const tabButton = document.getElementById(`btn-${tabId}`);

    if (!isNavigating) {
        const hist = tabHistory[tabId];
        hist.urls = hist.urls.slice(0, hist.currentIndex + 1);
        hist.urls.push(text);
        hist.currentIndex = hist.urls.length - 1;
    }

    homeContainer.classList.add('hidden');
    frame.classList.add('active');
    
    frame.dataset.originalSrc = text; 
    
    // Генерируем чистую выдачу, ссылки открываются в новой вкладке по клику
    frame.innerHTML = `
        <div style="max-width: 700px; margin: 0 auto; font-family: sans-serif; animation: fadeIn 0.4s ease;">
            <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 4px; color: var(--text-color);">Результаты по запросу: ${text}</h2>
            <p style="color: #888; font-size: 13px; margin-bottom: 24px;">Поисковая система Veloftis</p>
            
            <div style="margin-bottom: 20px; background: var(--input-bg); padding: 18px; border-radius: 12px; transition: transform 0.2s;">
                <a href="https://yandex.ru{encodeURIComponent(text)}" target="_blank" style="color: var(--accent-color); font-size: 18px; text-decoration: none; font-weight: 500; display: block; margin-bottom: 4px;">Искать "${text}" в Яндексе</a>
                <span style="color: #2ec4b6; font-size: 12px; display: block; margin-bottom: 6px;">yandex.ru</span>
                <p style="font-size: 14px; line-height: 1.5; color: var(--text-color); opacity: 0.8;">Открыть прямую страницу глобального поиска по вашему запросу на серверах Яндекса.</p>
            </div>

            <div style="margin-bottom: 20px; background: var(--input-bg); padding: 18px; border-radius: 12px; transition: transform 0.2s;">
                <a href="https://google.com{encodeURIComponent(text)}" target="_blank" style="color: var(--accent-color); font-size: 18px; text-decoration: none; font-weight: 500; display: block; margin-bottom: 4px;">Смотреть выдачу в Google</a>
                <span style="color: #2ec4b6; font-size: 12px; display: block; margin-bottom: 6px;">google.com</span>
                <p style="font-size: 14px; line-height: 1.5; color: var(--text-color); opacity: 0.8;">Перейти к результатам поиска мирового поискового сервиса в отдельном безопасном окне.</p>
            </div>

            <div style="margin-bottom: 20px; background: var(--input-bg); padding: 18px; border-radius: 12px; transition: transform 0.2s;">
                <a href="https://wikipedia.org{encodeURIComponent(text)}" target="_blank" style="color: var(--accent-color); font-size: 18px; text-decoration: none; font-weight: 500; display: block; margin-bottom: 4px;">Найти статью в Википедии</a>
                <span style="color: #2ec4b6; font-size: 12px; display: block; margin-bottom: 6px;">wikipedia.org</span>
                <p style="font-size: 14px; line-height: 1.5; color: var(--text-color); opacity: 0.8;">Проверить наличие свободной энциклопедической статьи и исторических справок по теме.</p>
            </div>
        </div>
    `;
    
    tabButton.firstChild.textContent = text.substring(0, 12) + '... ';
    document.getElementById('addressBar').value = text;
    
    updateForwardButtonVisibility();
}

function goBack() {
    if (activeTabId) {
        const hist = tabHistory[activeTabId];
        
        if (hist.currentIndex > 0) {
            hist.currentIndex--;
            const previousUrl = hist.urls[hist.currentIndex];
            processInput(previousUrl, activeTabId, true);
        } else if (hist.currentIndex === 0) {
            hist.currentIndex = -1;
            document.getElementById(`home-${activeTabId}`).classList.remove('hidden');
            const frame = document.getElementById(`frame-${activeTabId}`);
            frame.classList.remove('active');
            frame.innerHTML = '';
            document.getElementById(`btn-${activeTabId}`).firstChild.textContent = 'Новая вкладка ';
            document.getElementById('addressBar').value = '';
            updateForwardButtonVisibility();
        }
    }
}

function goForward() {
    if (activeTabId) {
        const hist = tabHistory[activeTabId];
        
        if (hist.currentIndex < hist.urls.length - 1) {
            hist.currentIndex++;
            const nextUrl = hist.urls[hist.currentIndex];
            processInput(nextUrl, activeTabId, true);
        }
    }
}

function updateForwardButtonVisibility() {
    const forwardBtn = document.getElementById('forwardBtn');
    if (!forwardBtn) return;

    if (activeTabId && tabHistory[activeTabId]) {
        const hist = tabHistory[activeTabId];
        if (hist.currentIndex < hist.urls.length - 1 && hist.urls.length > 0) {
            forwardBtn.classList.remove('hidden-arrow');
        } else {
            forwardBtn.classList.add('hidden-arrow');
        }
    } else {
        forwardBtn.classList.add('hidden-arrow');
    }
}

function toggleTheme() {
    if (isIncognito) return;
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
}

function toggleIncognito() {
    const html = document.documentElement;
    const btn = document.getElementById('incognitoBtn');
    
    isIncognito = !isIncognito;
    
    if (isIncognito) {
        html.setAttribute('data-theme', 'incognito');
        btn.classList.add('active');
        btn.textContent = 'Инкогнито: ВКЛ';
    } else {
        html.setAttribute('data-theme', 'light');
        btn.classList.remove('active');
        btn.textContent = 'Инкогнито';
    }
}

createNewTab();
