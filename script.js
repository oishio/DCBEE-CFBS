// 全局错误处理
window.onerror = function(msg, url, line) {
    console.error(`Error: ${msg}\nURL: ${url}\nLine: ${line}`);
    return false;
};

// 检查本地存储
function checkLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        console.error('本地存储不可用:', e);
        return false;
    }
}

// 获取球员列表
async function getPlayers() {
    try {
        const trainingDate = document.getElementById('trainingDate').value;
        if (!trainingDate) {
            throw new Error('未选择训练日期');
        }

        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, `signups/${trainingDate}`));
        const players = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                players.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }
        
        return players;
    } catch (error) {
        console.error('获取球员列表失败:', error);
        throw error;
    }
}

// 删除报名球员
async function deletePlayer(playerId, playerName, date) {
    try {
        // 检查是否是管理员模式
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        // 获取当前登录用户
        const currentUser = localStorage.getItem('currentUser');
        
        // 如果不是管理员，检查是否是本人
        if (!isAdmin) {
            if (currentUser !== playerName) {
                alert('您只能删除自己的报名信息 / Sie können nur Ihre eigene Anmeldung löschen');
                return;
            }
            if (!confirm('确定要删除您的报名记录吗？/ Sind Sie sicher, dass Sie Ihre Anmeldung löschen möchten?')) {
                return;
            }
        }

        // 如果提供了日期，则从历史记录中删除
        if (date) {
            await firebaseFunctions.remove(firebaseFunctions.ref(database, `signups/${date}/${playerId}`));
        } else {
            // 否则从当前训练日期中删除
            const trainingDate = document.getElementById('trainingDate').value;
            await firebaseFunctions.remove(firebaseFunctions.ref(database, `signups/${trainingDate}/${playerId}`));
        }

        // 更新显示
        await displayPlayers();
        await displayHistory();
        await displayAllHistory();
        
        alert('删除成功 / Löschen erfolgreich');
    } catch (error) {
        console.error('删除球员失败:', error);
        alert('删除失败，请重试 / Löschen fehlgeschlagen, bitte versuchen Sie es erneut');
    }
}

// 表单提交处理
document.getElementById('playerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const playerData = {
        name: document.getElementById('playerName').value,
        age: document.getElementById('age').value,
        experience: document.getElementById('experience').value,
        skillLevel: document.getElementById('skillLevel').value,
        preferredFoot: document.getElementById('preferredFoot').value,
        position1: document.getElementById('position1').value,
        position2: document.getElementById('position2').value,
        position3: document.getElementById('position3').value,
        trainingDate: document.getElementById('trainingDate').value,
        signUpTime: new Date().toISOString()
    };
    
    try {
        // 验证必填字段
        if (!playerData.name || !playerData.trainingDate) {
            alert('请填写姓名和选择训练日期 / Bitte geben Sie Ihren Namen ein und wählen Sie ein Trainingsdatum');
            return;
        }

        // 保存到Firebase
        const trainingDate = playerData.trainingDate;
        const newPlayerRef = firebaseFunctions.push(firebaseFunctions.ref(database, `signups/${trainingDate}`));
        await firebaseFunctions.set(newPlayerRef, playerData);
        
        // 保存球员信息到本地存储
        if (checkLocalStorage()) {
            savePlayerData(playerData);
        }
        
        // 更新显示
        await displayPlayers();
        await displayHistory();
        await displayAllHistory();
        
        // 清空表单
        this.reset();
        
        alert('报名成功 / Anmeldung erfolgreich');
    } catch (error) {
        console.error('报名失败:', error);
        alert('报名失败，请重试 / Anmeldung fehlgeschlagen, bitte versuchen Sie es erneut');
    }
});

// 等待Firebase连接成功后再初始化页面
window.addEventListener('firebaseConnected', function() {
    updateTrainingDates();
    displayPlayers();
    displayHistory();
    displayAllHistory();
});

// 生成分组
async function generateTeams() {
    const groupType = document.getElementById('generateTeams').value;
    if (!groupType) return;

    try {
        const players = await getPlayers();
        
        // 检查是否是管理员模式
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        
        // 如果不是管理员且报名人数不足，则提示错误
        if (!isAdmin && players.length < 8) {
            alert('报名人数不足，无法进行分组 / Nicht genügend Spieler für die Teamerstellung');
            return;
        }

        // 计算每个队伍需要的球员数量
        const playersPerTeam = parseInt(groupType);
        const numTeams = Math.floor(players.length / playersPerTeam);
        const remainingPlayers = players.length % playersPerTeam;

        // 如果是管理员模式且没有报名球员，创建空队伍
        if (isAdmin && players.length === 0) {
            const teams = Array(2).fill().map(() => []); // 默认创建2个空队伍
            displayTeams(teams, [], playersPerTeam);
            return;
        }

        // 按评分排序
        players.sort((a, b) => b.rating - a.rating);

        // 初始化队伍
        const teams = Array(numTeams).fill().map(() => []);
        const substitutes = [];

        // 分配球员到队伍
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            
            // 如果剩余球员数量不足以组成完整队伍，放入替补席
            if (i >= numTeams * playersPerTeam) {
                substitutes.push(player);
                continue;
            }

            // 计算应该分配到哪个队伍
            const teamIndex = i % numTeams;
            teams[teamIndex].push(player);
        }

        // 为每个队伍分配位置
        teams.forEach(team => {
            // 根据队伍人数确定位置分配
            const positions = getPositionsForTeamSize(playersPerTeam);
            
            // 按评分排序
            team.sort((a, b) => b.rating - a.rating);
            
            // 分配位置
            team.forEach((player, index) => {
                if (index < positions.length) {
                    player.assignedPosition = positions[index];
                }
            });
        });

        // 显示分组结果
        displayTeams(teams, substitutes, playersPerTeam);

    } catch (error) {
        console.error('分组失败:', error);
        alert('分组失败，请重试 / Teamerstellung fehlgeschlagen, bitte versuchen Sie es erneut');
    }
}

// 根据队伍人数获取位置配置
function getPositionsForTeamSize(teamSize) {
    switch(teamSize) {
        case 5:
            return ['striker', 'winger', 'pivot', 'defender', 'goalkeeper'];
        case 6:
            return ['striker6', 'winger6', 'midfielder6', 'defender6', 'sweeper6', 'goalkeeper6'];
        case 7:
            return ['striker6', 'winger6', 'midfielder6', 'midfielder6', 'defender6', 'sweeper6', 'goalkeeper6'];
        case 8:
            return ['striker6', 'winger6', 'winger6', 'midfielder6', 'midfielder6', 'defender6', 'sweeper6', 'goalkeeper6'];
        default:
            return [];
    }
}

// 更新训练日期选项
function updateTrainingDates() {
    const trainingDateSelect = document.getElementById('trainingDate');
    if (!trainingDateSelect) return;

    // 清空现有选项
    trainingDateSelect.innerHTML = '<option value="">选择训练日期 / Trainingsdatum</option>';

    // 获取当前日期
    const today = new Date();
    
    // 存储所有训练日期
    const trainingDates = [];
    
    // 生成从今天开始到2025年底的所有训练日期
    const endDate = new Date('2025-12-31');
    
    for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
        // 只添加周三和周六的日期
        if (date.getDay() === 3 || date.getDay() === 6) {
            trainingDates.push(new Date(date));
        }
    }
    
    // 只显示最近的6次训练日期
    const recentDates = trainingDates.slice(0, 6);
    
    // 添加日期选项
    recentDates.forEach(date => {
        const option = document.createElement('option');
        const dateStr = date.toISOString().split('T')[0];
        const formattedDate = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
        });
        option.value = dateStr;
        option.textContent = `${formattedDate} / ${date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
        })}`;
        trainingDateSelect.appendChild(option);
    });

    // 添加日期选择事件监听器
    trainingDateSelect.addEventListener('change', function() {
        highlightTrainingSession(this.value);
    });

    // 自动选择最近的训练日期
    if (recentDates.length > 0) {
        const nearestDate = recentDates[0];
        const dateStr = nearestDate.toISOString().split('T')[0];
        trainingDateSelect.value = dateStr;
        highlightTrainingSession(dateStr);
    }
}

// 高亮显示训练时间
function highlightTrainingSession(dateStr) {
    // 移除所有高亮
    document.getElementById('wednesdaySession').classList.remove('active-session');
    document.getElementById('saturdaySession').classList.remove('active-session');

    if (dateStr) {
        const selectedDate = new Date(dateStr);
        const dayOfWeek = selectedDate.getDay();

        // 根据选择的日期高亮对应的训练时间
        if (dayOfWeek === 3) { // 周三
            document.getElementById('wednesdaySession').classList.add('active-session');
        } else if (dayOfWeek === 6) { // 周六
            document.getElementById('saturdaySession').classList.add('active-session');
        }
    }
}

// 显示已报名球员列表
async function displayPlayers() {
    const playersList = document.getElementById('playersList');
    if (!playersList) return;

    try {
        const players = await getPlayers();
        playersList.innerHTML = '';

        // 显示报名人数统计
        const totalPlayers = players.length;
        const statsHtml = `<div class="total-players">当前报名人数 / Aktuelle Anmeldungen: ${totalPlayers}</div>`;
        playersList.innerHTML = statsHtml;

        // 检查是否是管理员模式
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        // 获取当前登录用户
        const currentUser = localStorage.getItem('currentUser');

        // 显示每个球员的信息
        players.forEach(player => {
            const li = document.createElement('li');
            // 只有管理员或球员本人才能看到删除按钮
            const canDelete = isAdmin || (currentUser && currentUser === player.name);
            li.innerHTML = `
                <div class="player-info">
                    <span>${player.name}</span>
                    <span class="attendance-rate">Level ${player.skillLevel}</span>
                </div>
                ${canDelete ? `
                    <button class="delete-btn ${isAdmin ? 'admin-delete-btn' : ''}" onclick="deletePlayer('${player.id}', '${player.name}', '')">
                        ${isAdmin ? '管理员删除 / Admin Löschen' : '删除 / Löschen'}
                    </button>
                ` : ''}
            `;
            playersList.appendChild(li);
        });

        // 如果是管理员模式，始终显示分组按钮
        const generateTeamsSelect = document.getElementById('generateTeams');
        if (generateTeamsSelect) {
            generateTeamsSelect.style.display = isAdmin || totalPlayers > 0 ? 'block' : 'none';
        }
    } catch (error) {
        console.error('显示球员列表失败:', error);
    }
}

// 显示报名历史记录
async function displayHistory() {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;

    try {
        // 获取所有报名记录
        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'signups'));
        const historyData = snapshot.val() || {};
        
        // 按日期分组
        const dateGroups = {};
        Object.entries(historyData).forEach(([date, players]) => {
            if (!dateGroups[date]) {
                dateGroups[date] = [];
            }
            Object.entries(players).forEach(([playerId, player]) => {
                dateGroups[date].push({
                    id: playerId,
                    ...player
                });
            });
        });

        // 清空历史记录列表
        historyList.innerHTML = '';

        // 按日期倒序排列
        const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(b) - new Date(a));

        // 显示每个日期的报名记录
        sortedDates.forEach(date => {
            const players = dateGroups[date];
            const dateGroup = document.createElement('div');
            dateGroup.className = 'history-date-group';
            
            // 格式化日期
            const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                weekday: 'long'
            });
            
            // 创建日期组标题
            const header = document.createElement('div');
            header.className = 'history-header';
            header.innerHTML = `
                <div class="header-content">
                    <h3>${formattedDate}</h3>
                    <span class="player-count">${players.length} 人</span>
                </div>
                <span class="toggle-icon">▼</span>
            `;
            
            // 创建球员列表
            const content = document.createElement('div');
            content.className = 'history-content';
            const playersList = document.createElement('ul');
            playersList.className = 'history-players-list';
            
            players.forEach(player => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="player-info">
                        <span>${player.name}</span>
                        <span class="attendance-rate">Level ${player.skillLevel}</span>
                    </div>
                    <div class="player-details">
                        <span>${player.position1}</span>
                        <span>${player.age}岁</span>
                        <span>${player.experience}年球龄</span>
                    </div>
                `;
                playersList.appendChild(li);
            });
            
            content.appendChild(playersList);
            dateGroup.appendChild(header);
            dateGroup.appendChild(content);
            historyList.appendChild(dateGroup);
            
            // 添加点击事件，展开/折叠历史记录
            header.addEventListener('click', () => {
                content.classList.toggle('collapsed');
                header.querySelector('.toggle-icon').textContent = 
                    content.classList.contains('collapsed') ? '▶' : '▼';
            });
        });

        // 更新导出日期选项
        updateExportDateOptions(sortedDates);

    } catch (error) {
        console.error('加载历史记录失败:', error);
        alert('加载历史记录失败，请重试 / Fehler beim Laden der Historie, bitte versuchen Sie es erneut');
    }
}

// 更新导出日期选项
function updateExportDateOptions(dates) {
    const exportDateSelect = document.getElementById('exportDate');
    if (!exportDateSelect) return;

    // 清空现有选项
    exportDateSelect.innerHTML = '<option value="">选择导出日期 / Datum auswählen</option>';

    // 添加日期选项
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
        });
        exportDateSelect.appendChild(option);
    });
}

// 导出PDF
document.getElementById('exportPDF').addEventListener('click', async function() {
    const selectedDate = document.getElementById('exportDate').value;
    if (!selectedDate) {
        alert('请选择要导出的日期 / Bitte wählen Sie ein Datum aus');
        return;
    }

    try {
        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, `signups/${selectedDate}`));
        const players = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                players.push(childSnapshot.val());
            });
        }

        // 创建PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 设置中文字体
        doc.addFont('NotoSansSC-Regular', 'NotoSansSC', 'normal');
        doc.setFont('NotoSansSC');

        // 添加标题
        const title = `报名记录 - ${new Date(selectedDate).toLocaleDateString('zh-CN')}`;
        doc.setFontSize(16);
        doc.text(title, 14, 20);

        // 添加表格数据
        const tableData = players.map(player => [
            player.name,
            player.skillLevel,
            player.age,
            player.experience,
            player.position1
        ]);

        // 创建表格
        doc.autoTable({
            head: [['姓名', '技术等级', '年龄', '球龄', '位置']],
            body: tableData,
            startY: 30,
            theme: 'grid',
            styles: {
                font: 'NotoSansSC',
                fontSize: 10
            },
            headStyles: {
                fillColor: [76, 175, 80],
                textColor: 255
            }
        });

        // 保存PDF
        doc.save(`报名记录_${selectedDate}.pdf`);

    } catch (error) {
        console.error('导出PDF失败:', error);
        alert('导出失败，请重试 / Export fehlgeschlagen, bitte versuchen Sie es erneut');
    }
});

// 获取所有历史报名信息
async function getAllSignups() {
    try {
        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'signups'));
        const allSignups = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((dateSnapshot) => {
                const date = dateSnapshot.key;
                dateSnapshot.forEach((playerSnapshot) => {
                    const playerData = playerSnapshot.val();
                    allSignups.push({
                        date: date,
                        id: playerSnapshot.key,
                        ...playerData
                    });
                });
            });
        }
        
        return allSignups;
    } catch (error) {
        console.error('获取历史报名信息失败:', error);
        throw error;
    }
}

// 显示所有历史报名信息
async function displayAllHistory() {
    try {
        const allSignups = await getAllSignups();
        const historyContainer = document.getElementById('historyContainer');
        if (!historyContainer) return;

        // 按日期排序
        allSignups.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 按日期分组
        const groupedSignups = allSignups.reduce((groups, signup) => {
            const date = signup.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(signup);
            return groups;
        }, {});

        let html = '<h2>所有历史报名记录 / Alle Anmeldungen</h2>';
        
        // 显示每个日期的报名信息
        Object.entries(groupedSignups).forEach(([date, players]) => {
            const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            
            html += `
                <div class="history-date-group">
                    <div class="history-header">
                        <h3>${formattedDate} (${players.length}人)</h3>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="history-content">
                        <table class="history-players">
                            <thead>
                                <tr>
                                    <th>姓名 / Name</th>
                                    <th>年龄 / Alter</th>
                                    <th>球龄 / Erfahrung</th>
                                    <th>技术等级 / Level</th>
                                    <th>惯用脚 / Bevorzugter Fuß</th>
                                    <th>位置选择 / Position</th>
                                    <th>报名时间 / Anmeldezeit</th>
                                    <th>操作 / Aktion</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${players.map(player => `
                                    <tr>
                                        <td>${player.name}</td>
                                        <td>${player.age}</td>
                                        <td>${player.experience}年</td>
                                        <td>${player.skillLevel}</td>
                                        <td>${player.preferredFoot}</td>
                                        <td>${player.position1}, ${player.position2}, ${player.position3}</td>
                                        <td>${new Date(player.signUpTime).toLocaleString('zh-CN')}</td>
                                        <td>
                                            <button class="delete-btn" onclick="deletePlayer('${player.id}', '${player.name}', '${date}')">
                                                删除 / Löschen
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        historyContainer.innerHTML = html;

        // 添加展开/折叠功能
        document.querySelectorAll('.history-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const icon = header.querySelector('.toggle-icon');
                content.classList.toggle('collapsed');
                icon.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
            });
        });

    } catch (error) {
        console.error('显示历史记录失败:', error);
        alert('获取历史记录失败，请重试 / Fehler beim Laden der Historie, bitte versuchen Sie es erneut');
    }
}

// 保存球员信息到本地存储
function savePlayerData(playerData) {
    const playerName = playerData.name;
    if (playerName) {
        // 只保存基本信息，不包含训练日期和报名时间
        const dataToSave = {
            name: playerData.name,
            age: playerData.age,
            experience: playerData.experience,
            skillLevel: playerData.skillLevel,
            preferredFoot: playerData.preferredFoot,
            position1: playerData.position1,
            position2: playerData.position2,
            position3: playerData.position3
        };
        localStorage.setItem(`player_${playerName}`, JSON.stringify(dataToSave));
    }
}

// 从本地存储加载球员信息
function loadPlayerData(playerName) {
    if (!playerName) return null;
    const savedData = localStorage.getItem(`player_${playerName}`);
    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (error) {
            console.error('解析本地存储数据失败:', error);
            return null;
        }
    }
    return null;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    updateTrainingDates();
    displayPlayers();
    displayHistory();
    displayAllHistory(); // 添加显示所有历史记录
    
    // 监听姓名输入框的变化
    const playerNameInput = document.getElementById('playerName');
    if (playerNameInput) {
        playerNameInput.addEventListener('input', function() {
            const playerName = this.value.trim();
            if (playerName) {
                const savedData = loadPlayerData(playerName);
                if (savedData) {
                    // 填充保存的数据
                    document.getElementById('age').value = savedData.age || '';
                    document.getElementById('experience').value = savedData.experience || '';
                    document.getElementById('skillLevel').value = savedData.skillLevel || '';
                    document.getElementById('preferredFoot').value = savedData.preferredFoot || '';
                    document.getElementById('position1').value = savedData.position1 || '';
                    document.getElementById('position2').value = savedData.position2 || '';
                    document.getElementById('position3').value = savedData.position3 || '';
                }
            }
        });
    }
});

