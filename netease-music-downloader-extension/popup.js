// 网易云音乐下载器 - Popup脚本

document.addEventListener('DOMContentLoaded', function() {
    initializePopup();
});

// 初始化弹出窗口
async function initializePopup() {
    await checkCurrentPage();
    await loadDownloadHistory();
    await checkDarkModeStatus();
    bindEvents();
}

// 检查当前页面
async function checkCurrentPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const statusIcon = document.getElementById('statusIcon');
        const pageText = document.getElementById('pageText');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (tab.url && tab.url.includes('music.163.com')) {
            // 检查是否是歌曲页面
            if (tab.url.includes('/song?id=') || tab.url.includes('#/song?id=')) {
                statusIcon.textContent = '🟢';
                pageText.textContent = '检测到网易云音乐歌曲页面';
                downloadBtn.disabled = false;
                
                // 提取歌曲ID显示
                const songId = extractSongIdFromUrl(tab.url);
                if (songId) {
                    pageText.textContent = `歌曲页面 (ID: ${songId})`;
                }
            } else {
                statusIcon.textContent = '🟡';
                pageText.textContent = '网易云音乐页面，但不是歌曲页面';
                downloadBtn.disabled = true;
            }
        } else {
            statusIcon.textContent = '🔴';
            pageText.textContent = '请打开网易云音乐页面';
            downloadBtn.disabled = true;
        }
    } catch (error) {
        console.error('检查当前页面失败:', error);
        document.getElementById('statusIcon').textContent = '❌';
        document.getElementById('pageText').textContent = '检查页面失败';
    }
}

// 从URL提取歌曲ID
function extractSongIdFromUrl(url) {
    try {
        const match = url.match(/[?&]id=(\d+)/);
        return match ? match[1] : null;
    } catch (error) {
        return null;
    }
}

// 绑定事件
function bindEvents() {
    // 下载当前歌曲按钮
    document.getElementById('downloadBtn').addEventListener('click', downloadCurrentSong);
    
    // 手动下载按钮
    document.getElementById('manualDownloadBtn').addEventListener('click', manualDownload);
    
    // URL输入框回车事件
    document.getElementById('urlInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            manualDownload();
        }
    });
    
    // 清除历史按钮
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    
    // 帮助链接
    document.getElementById('helpLink').addEventListener('click', function(e) {
        e.preventDefault();
        showHelp();
    });
    
    // 反馈链接
    document.getElementById('feedbackLink').addEventListener('click', function(e) {
        e.preventDefault();
        showFeedback();
    });

    // 夜间模式切换按钮
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);

    // 清除历史按钮（如果存在）
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearAllHistory);
    }


}

// 下载当前歌曲
async function downloadCurrentSong() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const songId = extractSongIdFromUrl(tab.url);

        if (!songId) {
            showMessage('无法获取歌曲ID', 'error');
            return;
        }

        // 向content script请求歌曲信息
        chrome.tabs.sendMessage(tab.id, { action: 'getSongInfo' }, function(response) {
            const songInfo = response?.songInfo || {};
            const downloadUrl = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;

            // 生成文件名
            let filename = '';
            if (songInfo.songName && songInfo.artistName) {
                filename = `${songInfo.artistName} - ${songInfo.songName}`;
            } else if (songInfo.songName) {
                filename = songInfo.songName;
            } else if (songInfo.artistName) {
                filename = `${songInfo.artistName} - song_${songId}`;
            } else {
                filename = `song_${songId}`;
            }

            // 清理文件名
            filename = sanitizeFilename(filename) + '.mp3';

            // 发送下载请求
            chrome.runtime.sendMessage({
                action: 'download',
                url: downloadUrl,
                filename: filename,
                songId: songId,
                songInfo: songInfo
            }, function(response) {
                if (response && response.success) {
                    showMessage('下载已开始！', 'success');
                    // 刷新下载历史
                    setTimeout(loadDownloadHistory, 1000);
                } else {
                    showMessage('下载失败: ' + (response?.error || '未知错误'), 'error');
                }
            });
        });

    } catch (error) {
        console.error('下载失败:', error);
        showMessage('下载失败: ' + error.message, 'error');
    }
}

// 清理文件名的函数
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100);
}

// 手动下载
function manualDownload() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();

    if (!url) {
        showMessage('请输入歌曲链接', 'error');
        return;
    }

    const songId = extractSongIdFromUrl(url);
    if (!songId) {
        showMessage('无效的网易云音乐链接', 'error');
        return;
    }

    const downloadUrl = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
    const filename = `song_${songId}.mp3`;

    // 发送下载请求（手动下载时没有歌曲信息，使用默认文件名）
    chrome.runtime.sendMessage({
        action: 'download',
        url: downloadUrl,
        filename: filename,
        songId: songId,
        songInfo: {}
    }, function(response) {
        if (response && response.success) {
            showMessage('下载已开始！', 'success');
            urlInput.value = ''; // 清空输入框
            // 刷新下载历史
            setTimeout(loadDownloadHistory, 1000);
        } else {
            showMessage('下载失败: ' + (response?.error || '未知错误'), 'error');
        }
    });
}

// 加载下载历史
async function loadDownloadHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        chrome.runtime.sendMessage({ action: 'getDownloadHistory' }, function(response) {
            if (response && response.success) {
                displayHistory(response.history);
            } else {
                historyList.innerHTML = '<div class="empty">加载历史失败</div>';
            }
        });
    } catch (error) {
        console.error('加载下载历史失败:', error);
        historyList.innerHTML = '<div class="empty">加载历史失败</div>';
    }
}

// 显示下载历史
function displayHistory(history) {
    const historyList = document.getElementById('historyList');

    if (!history || history.length === 0) {
        historyList.innerHTML = '<div class="empty">暂无下载记录</div>';
        return;
    }

    const historyHTML = history.map(item => {
        // 显示歌曲信息或文件名
        let displayName = item.filename;
        if (item.songInfo && item.songInfo.songName) {
            if (item.songInfo.artistName) {
                displayName = `${item.songInfo.artistName} - ${item.songInfo.songName}`;
            } else {
                displayName = item.songInfo.songName;
            }
        }

        return `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-filename" title="${item.filename}">${displayName}</div>
                    <div class="history-date">${item.date}</div>
                </div>
                <div class="history-actions">
                    <button onclick="redownload('${item.songId}', '${item.filename}', ${JSON.stringify(item.songInfo || {}).replace(/"/g, '&quot;')})">重新下载</button>
                </div>
            </div>
        `;
    }).join('');

    historyList.innerHTML = historyHTML;
}

// 重新下载
function redownload(songId, filename, songInfo) {
    const downloadUrl = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;

    // 如果没有传入文件名，使用默认格式
    if (!filename) {
        filename = `song_${songId}.mp3`;
    }

    // 如果没有传入歌曲信息，使用空对象
    if (!songInfo) {
        songInfo = {};
    }

    chrome.runtime.sendMessage({
        action: 'download',
        url: downloadUrl,
        filename: filename,
        songId: songId,
        songInfo: songInfo
    }, function(response) {
        if (response && response.success) {
            showMessage('重新下载已开始！', 'success');
        } else {
            showMessage('重新下载失败: ' + (response?.error || '未知错误'), 'error');
        }
    });
}

// 清除历史
function clearHistory() {
    if (confirm('确定要清除所有下载历史吗？')) {
        chrome.runtime.sendMessage({ action: 'clearDownloadHistory' }, function(response) {
            if (response && response.success) {
                showMessage('历史已清除', 'success');
                loadDownloadHistory();
            } else {
                showMessage('清除历史失败', 'error');
            }
        });
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(messageEl);
    
    // 3秒后移除
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 3000);
}

// 显示帮助
function showHelp() {
    alert(`网易云音乐下载器使用帮助：

1. 在网易云音乐歌曲页面点击插件图标或下载按钮
2. 也可以手动粘贴歌曲链接进行下载
3. 支持的链接格式：
   - https://music.163.com/#/song?id=123456
   - https://music.163.com/song?id=123456

注意事项：
- 请确保遵守版权法律
- 仅用于个人学习和研究
- 某些歌曲可能因版权限制无法下载`);
}

// 显示反馈
function showFeedback() {
    alert('如有问题或建议，请联系开发者。\n\n感谢您的使用！');
}

// 夜间模式切换
async function toggleDarkMode() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // 发送切换夜间模式的消息
        chrome.tabs.sendMessage(tab.id, { action: 'toggleDarkMode' }, function(response) {
            if (response && response.success) {
                updateDarkModeButton(response.darkMode);
                showMessage(response.darkMode ? '夜间模式已开启' : '夜间模式已关闭', 'success');
            } else {
                showMessage('切换夜间模式失败', 'error');
            }
        });
    } catch (error) {
        console.error('切换夜间模式失败:', error);
        showMessage('切换夜间模式失败', 'error');
    }
}

// 更新夜间模式按钮
function updateDarkModeButton(isDarkMode) {
    const button = document.getElementById('darkModeBtn');
    if (button) {
        button.textContent = isDarkMode ? '🌞 日间模式' : '🌙 夜间模式';
        button.title = isDarkMode ? '切换到日间模式' : '切换到夜间模式';
    }
}

// 检查当前夜间模式状态
async function checkDarkModeStatus() {
    try {
        const result = await chrome.storage.local.get(['darkMode']);
        updateDarkModeButton(result.darkMode || false);
    } catch (error) {
        console.error('检查夜间模式状态失败:', error);
    }
}

// 清除所有历史记录
async function clearAllHistory() {
    if (confirm('确定要清除所有下载历史吗？此操作不可撤销。')) {
        try {
            await chrome.storage.local.set({ downloadHistory: [] });
            showMessage('下载历史已清除', 'success');
            await loadDownloadHistory(); // 重新加载历史
        } catch (error) {
            console.error('清除历史失败:', error);
            showMessage('清除历史失败', 'error');
        }
    }
}


