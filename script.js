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
        <iframe class="web-view" id="frame-${tabId}"></iframe>
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

// НАДЕЖНЫЙ ОБРАБОТЧИК ПОИСКА ДЛЯ GITHUB PAGES
function processInput(input, tabId, isNavigating = false) {
    if (!input) return;

    let text = input.trim();
    const homeContainer = document.getElementById(`home-${tabId}`);
    const frame = document.getElementById(`frame-${tabId}`);
    const tabButton = document.getElementById(`btn-${tabId}`);

    // Используем защищенную HTML-версию DuckDuckGo, которая идеально работает на GitHub Pages
    let targetUrl = 'https://duckduckgo.com' + encodeURIComponent(text);

    if (!isNavigating) {
        const hist = tabHistory[tabId];
        hist.urls = hist.urls.slice(0, hist.currentIndex + 1);
        hist.urls.push(text);
        hist.currentIndex = hist.urls.length - 1;
    }

    homeContainer.classList.add('hidden');
    frame.classList.add('active');
    
    frame.dataset.originalSrc = text; 
    frame.src = targetUrl;
    
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
            frame.src = '';
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
