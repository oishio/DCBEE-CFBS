// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyDOClS6MuNGaaTOeL4NGdh1jThCeur20J8",
  authDomain: "dcbee-cfbs.firebaseapp.com",
  databaseURL: "https://dcbee-cfbs-default-rtdb.firebaseio.com",
  projectId: "dcbee-cfbs",
  storageBucket: "dcbee-cfbs.firebasestorage.app",
  messagingSenderId: "571164317131",
  appId: "1:571164317131:web:084f26c6a9eb8e2e4e524e",
  measurementId: "G-XKWS0GJVPC"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 添加翻译对象
const translations = {
    team: {
        zh: '队伍',
        de: 'Team'
    },
    totalStrength: {
        zh: '队伍总实力',
        de: 'Gesamtstärke'
    },
    substitutes: {
        zh: '补位席',
        de: 'Ersatzbank'
    },
    delete: {
        zh: '删除',
        de: 'Löschen'
    },
    confirmDelete: {
        zh: '确定要删除这名球员吗？',
        de: 'Möchten Sie diesen Spieler wirklich löschen?'
    },
    signUpSuccess: {
        zh: '报名成功！',
        de: 'Erfolgreich angemeldet!'
    },
    signUpFailed: {
        zh: '报名失败，请重试',
        de: 'Anmeldung fehlgeschlagen, bitte erneut versuchen'
    },
    selectDate: {
        zh: '请选择训练日期！',
        de: 'Bitte Trainingsdatum auswählen!'
    },
    tooLateToModify: {
        zh: '距离训练开始不到15分钟，无法修改报名信息！',
        de: 'Weniger als 15 Minuten bis zum Training, Änderungen nicht mehr möglich!'
    },
    minPlayersRequired: {
        zh: '至少需要5名球员才能分组！',
        de: 'Mindestens 5 Spieler für Teamerstellung erforderlich!'
    },
    alreadyRegistered: {
        zh: '已经报名了这次训练！',
        de: 'hat sich bereits für dieses Training angemeldet!'
    }
};

// 添加管理员列表
const ADMIN_USERS = ['韩聪'];  // 可以添加更多管理员

// 获取位置名称的中德双语显示
function getPositionName(position) {
    const positionNames = {
        // 5人制
        'striker': '前锋(ST) / Stürmer(ST)',
        'winger': '边锋(LW/RW) / Flügel(LW/RW)',
        'pivot': '中场(MF) / Mittelfeld(MF)',
        'defender': '后卫(DF) / Verteidiger(DF)',
        'goalkeeper': '守门员(GK) / Torwart(GK)',
        
        // 6人制
        'striker6': '前锋(ST)',
        'winger6': '边锋(LW/RW)',
        'midfielder6': '中场(MF)',
        'defender6': '后卫(DF)',
        'sweeper6': '清道夫(SW)',
        'goalkeeper6': '守门员(GK)',
        
        // 默认值
        '': '未指定 / Nicht angegeben'
    };
    
    return positionNames[position] || position;
}

// 更新导出日期选择器
function updateExportDateSelect(sortedDates) {
    const exportDateSelect = document.getElementById('exportDate');
    exportDateSelect.innerHTML = '<option value="">选择导出日期 / Datum auswählen</option>';
    sortedDates.forEach(date => {
        const trainingDate = new Date(date);
        const dateStr = `${trainingDate.getFullYear()}年${trainingDate.getMonth() + 1}月${trainingDate.getDate()}日`;
        const dateStrDE = `${trainingDate.getDate()}.${trainingDate.getMonth() + 1}.${trainingDate.getFullYear()}`;
        exportDateSelect.innerHTML += `<option value="${date}">${dateStr} / ${dateStrDE}</option>`;
    });
}

// 修改数据读取函数
async function loadPlayers() {
    try {
        const selectedDate = document.getElementById('trainingDate').value;
        if (!selectedDate) return;

        // 获取所有数据
        const [playersSnapshot, historySnapshot] = await Promise.all([
            database.ref('players').once('value'),
            database.ref('signUpHistory').once('value')
        ]);
        
        const playersData = playersSnapshot.val() || {};
        const historyData = historySnapshot.val() || {};
        
        // 合并数据
        const allPlayers = {
            ...historyData,
            ...playersData  // 当前报名数据优先
        };
        
        // 过滤出当前日期的球员
        const playerMap = new Map(); // 用于去重
        
        Object.values(allPlayers).forEach(player => {
            if (!player || !player.trainingDate) return false;
            
            // 将两个日期转换为相同的格式进行比较
            const playerDate = new Date(player.trainingDate);
            const selectedDateObj = new Date(selectedDate);
            
            const isSameDate = playerDate.getFullYear() === selectedDateObj.getFullYear() &&
                   playerDate.getMonth() === selectedDateObj.getMonth() &&
                   playerDate.getDate() === selectedDateObj.getDate();
            
            // 如果是同一天的记录，使用最新的记录
            if (isSameDate) {
                const playerName = player.name || player.playerName;
                const existingPlayer = playerMap.get(playerName);
                
                // 如果没有该球员的记录，或者这是更新的记录，则更新Map
                if (!existingPlayer || new Date(player.signUpTime) > new Date(existingPlayer.signUpTime)) {
                    playerMap.set(playerName, player);
                }
            }
        });
        
        // 将Map转换为数组
        players = Array.from(playerMap.values());

        updatePlayersList();
        displaySignUpHistory();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// 更新球员列表显示
async function updatePlayersList() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    // 使用 Promise.all 并行获取所有球员的出场率
    const playersWithAttendance = await Promise.all(players.map(async player => {
        const { attendanceRate } = await getPlayerLastRecord(player.name || player.playerName);
        return { ...player, attendanceRate };
    }));
    
    playersWithAttendance.forEach(player => {
        const li = document.createElement('li');
        const position1Text = getPositionName(player.position1 || player.positions?.[0] || '');
        const position2Text = player.position2 ? ` / ${getPositionName(player.position2)}` : '';
        
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';
        
        // 添加出场率信息
        const attendanceText = `(${player.attendanceRate}%)`;
        // 获取拼音名字
        const pinyinName = getPinyinName(player.name || player.playerName);
        
        playerInfo.innerHTML = `
            <span>${player.name || player.playerName} (${pinyinName}) - ${position1Text}${position2Text}</span>
            ${attendanceText}
        `;
        
        // 获取当前用户名（从输入框或者本地存储）
        const currentUser = document.getElementById('playerName').value || localStorage.getItem('currentUser') || '';
        const registeredBy = player.registeredBy || player.name || player.playerName;
        
        // 如果是管理员或报名者本人，显示删除按钮
        if (ADMIN_USERS.includes(currentUser) || currentUser === registeredBy) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            // 为管理员添加特殊样式
            if (ADMIN_USERS.includes(currentUser)) {
                deleteBtn.classList.add('admin-delete-btn');
            }
            deleteBtn.textContent = translations.delete.zh + ' / ' + translations.delete.de;
            deleteBtn.onclick = () => deletePlayer(player);
            li.appendChild(deleteBtn);
        }
        
        li.appendChild(playerInfo);
        playersList.appendChild(li);
    });
}

// 获取拼音名字
function getPinyinName(chineseName) {
    try {
        if (!chineseName) return '';
        
        // 检查是否包含中文字符
        const hasChinese = /[\u4e00-\u9fa5]/.test(chineseName);
        if (!hasChinese) {
            // 如果不包含中文，直接返回原名
            return chineseName;
        }
        
        // 使用 pinyin-pro 库生成拼音
        const pinyinArray = pinyinPro.pinyin(chineseName, {
            toneType: 'none',    // 不带声调
            type: 'array',       // 返回数组
            capitalize: true     // 首字母大写
        });
        
        // 姓氏总是第一个字
        const surname = pinyinArray[0];
        
        // 名字是剩余的所有字连在一起
        const givenName = pinyinArray.slice(1)
            .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
            .join('');
        
        // 返回 "名字 姓氏" 格式
        return givenName + ' ' + surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
    } catch (error) {
        console.error('生成拼音失败:', error);
        return chineseName;  // 如果转换失败，返回原名
    }
}

// 删除球员
async function deletePlayer(player) {
    if (!confirm(translations.confirmDelete.zh + '\n' + translations.confirmDelete.de)) {
        return;
    }

    try {
        // 检查是否是当前报名还是历史记录
        const [playersSnapshot, historySnapshot] = await Promise.all([
            database.ref('players').once('value'),
            database.ref('signUpHistory').once('value')
        ]);
        
        const playersData = playersSnapshot.val() || {};
        const historyData = historySnapshot.val() || {};
        
        // 生成键名
        const dateKey = `${new Date(player.trainingDate).toDateString()}_${player.name || player.playerName}`;
        
        // 检查并删除记录
        if (Object.keys(playersData).includes(dateKey)) {
            // 从当前报名中删除
            await database.ref('players').child(dateKey).remove();
        } else if (Object.keys(historyData).includes(dateKey)) {
            // 从历史记录中删除
            await database.ref('signUpHistory').child(dateKey).remove();
        }
        
        await loadPlayers();
        alert('删除成功！\nErfolgreich gelöscht!');
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('删除失败，请重试！\nLöschen fehlgeschlagen, bitte erneut versuchen!');
    }
}

// 显示历史记录
async function displaySignUpHistory() {
    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = '';

    try {
        // 获取所有数据
        const [playersSnapshot, historySnapshot] = await Promise.all([
            database.ref('players').once('value'),
            database.ref('signUpHistory').once('value')
        ]);
        
        const playersData = playersSnapshot.val() || {};
        const historyData = historySnapshot.val() || {};
        
        // 获取当前时间
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        // 按日期分组历史记录
        const groupedHistory = new Map();
        
        // 只处理历史记录数据
        for (const [key, record] of Object.entries(historyData)) {
            if (!record || !record.trainingDate) continue;
            
            // 检查是否是过去的训练
            const trainingDate = new Date(record.trainingDate);
            if (trainingDate >= now) continue;  // 跳过未来的训练
            
            const date = record.trainingDate;
            if (!groupedHistory.has(date)) {
                groupedHistory.set(date, []);
            }
            
            const processedRecord = {
                playerName: record.name || record.playerName || '未知',
                position1: record.position1 || record.positions?.[0] || '',
                position2: record.position2 || record.positions?.[1] || '',
                position3: record.position3 || record.positions?.[2] || '',
                trainingDate: date,
                signUpTime: record.signUpTime || new Date().toISOString()
            };
            
            // 检查是否已存在相同球员的记录
            const existingPlayer = groupedHistory.get(date)
                .find(p => p.playerName === processedRecord.playerName);
            if (!existingPlayer) {
                groupedHistory.get(date).push(processedRecord);
            }
        }

        // 按日期倒序排序
        const sortedDates = Array.from(groupedHistory.keys()).sort((a, b) => 
            new Date(b) - new Date(a)
        );

        sortedDates.forEach(date => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'history-date-group';
            
            const header = document.createElement('div');
            header.className = 'history-header';
            
            const trainingDate = new Date(date);
            const dateStr = `${trainingDate.getFullYear()}年${trainingDate.getMonth() + 1}月${trainingDate.getDate()}日训练`;
            const playerCount = groupedHistory.get(date).length;
            
            header.innerHTML = `
                <div class="header-content">
                    <h3>${dateStr}</h3>
                    <span class="player-count">共 ${playerCount} 人报名</span>
                </div>
                <span class="toggle-icon">▼</span>
            `;
            
            const content = document.createElement('div');
            content.className = 'history-content collapsed';
            
            const playersList = document.createElement('ul');
            playersList.className = 'history-players-list';
            
            // 按姓名排序并显示球员列表
            const sortedPlayers = groupedHistory.get(date)
                .sort((a, b) => a.playerName.localeCompare(b.playerName));
            
            // 去重处理
            const uniquePlayers = new Map();
            sortedPlayers.forEach(player => {
                uniquePlayers.set(player.playerName, player);
            });
            
            // 显示去重后的球员列表
            Array.from(uniquePlayers.values()).forEach(record => {
                const playerItem = document.createElement('li');
                const position1Text = getPositionName(record.position1 || '');
                const position2Text = record.position2 ? ` / ${getPositionName(record.position2)}` : '';
                playerItem.textContent = `${record.playerName} - ${position1Text}${position2Text}`;
                playersList.appendChild(playerItem);
            });

            content.appendChild(playersList);
            dateGroup.appendChild(header);
            dateGroup.appendChild(content);
            historyList.appendChild(dateGroup);

            // 添加点击事件处理
            header.addEventListener('click', () => {
                content.classList.toggle('collapsed');
                const toggleIcon = header.querySelector('.toggle-icon');
                toggleIcon.textContent = content.classList.contains('collapsed') ? '▼' : '▲';
            });
        });

        // 保存历史数据到全局变量，供导出功能使用
        window.historyData = groupedHistory;

        // 更新导出日期选择器
        updateExportDateSelect(sortedDates);
    } catch (error) {
        console.error('获取历史记录失败:', error);
        historyList.innerHTML = '<p class="error-message">获取历史记录失败</p>';
    }
}

// 生成训练日期选项
function generateTrainingDates() {
    const dateSelect = document.getElementById('trainingDate');
    dateSelect.innerHTML = '<option value="">选择训练日期 / Trainingsdatum</option>';
    
    // 获取当前时间
    const now = new Date();
    now.setHours(0, 0, 0, 0);  // 设置为当天0点
    
    // 固定的训练日期
    const trainingDates = [
        { date: '2024-12-11', displayDate: '2024年12月11日', displayDateDE: '11.12.2024', time: '20:00' }, // 周三
        { date: '2024-12-14', displayDate: '2024年12月14日', displayDateDE: '14.12.2024', time: '18:00' }, // 周六
        { date: '2024-12-18', displayDate: '2024年12月18日', displayDateDE: '18.12.2024', time: '20:00' }, // 周三
        { date: '2025-01-08', displayDate: '2025年1月8日', displayDateDE: '08.01.2025', time: '20:00' },   // 周三
        { date: '2025-01-11', displayDate: '2025年1月11日', displayDateDE: '11.01.2025', time: '18:00' },  // 周六
        { date: '2025-01-15', displayDate: '2025年1月15日', displayDateDE: '15.01.2025', time: '20:00' },  // 周三
        { date: '2025-01-18', displayDate: '2025年1月18日', displayDateDE: '18.01.2025', time: '18:00' },  // 周六
        { date: '2025-01-22', displayDate: '2025年1月22日', displayDateDE: '22.01.2025', time: '20:00' },  // 周三
        { date: '2025-01-25', displayDate: '2025年1月25日', displayDateDE: '25.01.2025', time: '18:00' },  // 周六
        { date: '2025-01-29', displayDate: '2025年1月29日', displayDateDE: '29.01.2025', time: '20:00' },  // 周三
        { date: '2025-02-01', displayDate: '2025年2月1日', displayDateDE: '01.02.2025', time: '18:00' },   // 周六
        { date: '2025-02-05', displayDate: '2025年2月5日', displayDateDE: '05.02.2025', time: '20:00' },   // 周三
        { date: '2025-02-08', displayDate: '2025年2月8日', displayDateDE: '08.02.2025', time: '18:00' },   // 周六
        { date: '2025-02-12', displayDate: '2025年2月12日', displayDateDE: '12.02.2025', time: '20:00' },  // 周三
        { date: '2025-02-15', displayDate: '2025年2月15日', displayDateDE: '15.02.2025', time: '18:00' },  // 周六
        { date: '2025-02-19', displayDate: '2025年2月19日', displayDateDE: '19.02.2025', time: '20:00' },  // 周三
        { date: '2025-02-22', displayDate: '2025年2月22日', displayDateDE: '22.02.2025', time: '18:00' },  // 周六
        { date: '2025-02-26', displayDate: '2025年2月26日', displayDateDE: '26.02.2025', time: '20:00' }   // 周三
    ];
    
    // 只显示未来的训练日期
    const futureDates = trainingDates
        .filter(training => new Date(training.date) >= now);
    
    // 为每个训练添加结束时间
    futureDates.forEach(training => {
        const isWednesday = new Date(training.date).getDay() === 3;
        const endTime = isWednesday ? '22:00' : '20:00';
        dateSelect.innerHTML += `<option value="${training.date}">
            ${training.displayDate} ${training.time}-${endTime} / ${training.displayDateDE} ${training.time}-${endTime}
        </option>`;
    });
    
    // 自动选择最近的训练日期
    if (futureDates.length > 0) {
        const nearestDate = futureDates[0].date;
        dateSelect.value = nearestDate;
        // 高亮显示对应的场地信息
        highlightTrainingInfo(nearestDate);
    }
}

// 检查报名状态
function checkRegistrationStatus() {
    const selectedDate = document.getElementById('trainingDate').value;
    if (!selectedDate) return;

    const trainingDate = new Date(selectedDate);
    const now = new Date();
    
    // 获训练时间
    const isWednesday = trainingDate.getDay() === 3;
    const trainingHour = isWednesday ? 20 : 18; // 周三20点，周六18点
    
    // 设置训练开始时间
    trainingDate.setHours(trainingHour, 0, 0, 0);
    
    // 如果距离训练开始不到15分钟，禁用删除按钮
    const timeDiff = trainingDate.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        if (minutesDiff <= 15) {
            button.disabled = true;
            button.title = translations.tooLateToModify.zh + '\n' + translations.tooLateToModify.de;
        } else {
            button.disabled = false;
            button.title = '';
        }
    });
}

// 高亮显示选中的训练场地信息
function highlightTrainingInfo(date) {
    // 重置所有场地信息的样式
    document.getElementById('wednesdaySession').classList.remove('active-session');
    document.getElementById('saturdaySession').classList.remove('active-session');
    
    if (!date) return;
    
    // 获取选中日期是周几
    const trainingDate = new Date(date);
    const dayOfWeek = trainingDate.getDay();
    
    // 高亮显示对应的场地信息
    if (dayOfWeek === 3) {
        document.getElementById('wednesdaySession').classList.add('active-session');
    } else if (dayOfWeek === 6) {
        document.getElementById('saturdaySession').classList.add('active-session');
    }
}

// 导入12月11日的历史记录
async function importHistoricalData() {
    try {
        // 从 Firebase 读取现有数据
        const historyRef = database.ref('signUpHistory');
        const snapshot = await historyRef.once('value');
        const existingData = snapshot.val() || {};
        
        // 检查是否已经有 12 月 11 日的记录
        const hasHistoricalData = Object.values(existingData).some(
            record => record.trainingDate === '2023-12-11'
        );
        
        if (!hasHistoricalData) {
            // 从 players 节点读取数据
            const playersRef = database.ref('players');
            const playersSnapshot = await playersRef.once('value');
            const playersData = playersSnapshot.val() || {};
  
            // 过滤出 12 月 11 日的记录
            const dec11Records = Object.entries(playersData)
                .filter(([_, record]) => record.trainingDate === '2023-12-11')
                .reduce((acc, [key, value]) => ({...acc, [key]: value}), {});
            
            if (Object.keys(dec11Records).length > 0) {
                // 将数据保存到历史记录中
                await historyRef.update(dec11Records);
                console.log('历史数据导入成功');
            }
        }
        
        // 刷新显示
        await loadPlayers();
    } catch (error) {
        console.error('导入历史数据失败:', error);
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    generateTrainingDates();
    await importHistoricalData();  // 导入历史数据
    await loadPlayers();
});

// 设置定时器
setInterval(checkRegistrationStatus, 60000);  // 每分钟检查一次状态
setInterval(loadPlayers, 10000);  // 每10秒刷新一次
setInterval(moveToHistory, 60000);  // 每分钟检查是否需要移动到历史记录

// 1. 添加日期选择事件监听
document.getElementById('trainingDate').addEventListener('change', function(e) {
    highlightTrainingInfo(e.target.value);
});

// 从历史记录中获取球员最近的报名信息
async function getPlayerLastRecord(name) {
    try {
        // 获取所有历史记录
        const [playersSnapshot, historySnapshot] = await Promise.all([
            database.ref('players').once('value'),
            database.ref('signUpHistory').once('value')
        ]);
        
        const playersData = playersSnapshot.val() || {};
        const historyData = historySnapshot.val() || {};
        
        // 合并数据
        const allRecords = {
            ...historyData,
            ...playersData
        };
        
        // 获取所有训练记录
        const allTrainings = Object.values(allRecords)
            .filter(record => record.name === name || record.playerName === name)
            .sort((a, b) => new Date(b.trainingDate) - new Date(a.trainingDate));
        
        // 获取过去的所有训练日期
        const pastTrainings = Object.values(allRecords)
            .filter(record => new Date(record.trainingDate) <= new Date())
            .map(record => record.trainingDate)
            .filter((date, index, self) => self.indexOf(date) === index)  // 去重
            .sort((a, b) => new Date(b) - new Date(a))
            .slice(0, 10);  // 最多取最近10场
        
        // 计算该球员在这些训练中的出场次数
        const playerAttendance = pastTrainings.filter(date => 
            allTrainings.some(record => record.trainingDate === date)
        ).length;
        
        // 计算出场率
        const totalGames = pastTrainings.length;
        const attendanceRate = totalGames > 0 
            ? Math.round((playerAttendance / totalGames) * 100)
            : 0;
        
        // 返回最近的记录和出场率
        return {
            lastRecord: allTrainings[0] || null,
            attendanceRate
        };
    } catch (error) {
        console.error('获取球员历史记录失败:', error);
        return { lastRecord: null, attendanceRate: 0 };
    }
}

// 自动填充表单
function autoFillForm(record, attendanceRate) {
    if (!record) return;
    
    // 填充位置信息
    document.getElementById('position1').value = record.position1 || record.positions?.[0] || '';
    document.getElementById('position2').value = record.position2 || record.positions?.[1] || '';
    document.getElementById('position3').value = record.position3 || record.positions?.[2] || '';
    
    // 填充其他信息
    document.getElementById('age').value = record.age || '';
    document.getElementById('experience').value = record.experience || '';
    document.getElementById('preferredFoot').value = record.preferredFoot || '';
    document.getElementById('skillLevel').value = record.skillLevel || '';
    
    // 显示出场率
    const attendanceDiv = document.getElementById('attendanceRate');
    const attendanceValue = document.getElementById('attendanceValue');
    if (attendanceDiv && attendanceValue) {
        attendanceValue.textContent = `${attendanceRate}%`;
        attendanceValue.style.color = attendanceRate >= 70 ? '#28a745' : '#dc3545';
    }
}

// 4. 姓名输入事件
document.getElementById('playerName').addEventListener('input', async function(e) {
    const name = e.target.value;
    if (!name) return;
    
    // 获取并填充历史记录
    const { lastRecord, attendanceRate } = await getPlayerLastRecord(name);
    if (lastRecord) {
        autoFillForm(lastRecord, attendanceRate);
    }
});

// 在分组锁定后将数据移动到历史记录
async function moveToHistory() {
    try {
        const now = new Date();
        const playersRef = database.ref('players');
        const historyRef = database.ref('signUpHistory');
        
        // 获取当前报名数据
        const snapshot = await playersRef.once('value');
        const players = snapshot.val() || {};
        
        // 检查每个训练日期是否已锁定
        for (const [key, player] of Object.entries(players)) {
            const trainingDate = new Date(player.trainingDate);
            const isWednesday = trainingDate.getDay() === 3;
            const lockTime = new Date(trainingDate);
            lockTime.setHours(isWednesday ? 20 : 18, 0, 0, 0);
            
            // 如果已过锁定时间，移动到历史记录
            if (now >= lockTime) {
                // 移动到历史记录
                await historyRef.child(key).set(player);
                // 从当前报名中删除
                await playersRef.child(key).remove();
            }
        }
    } catch (error) {
        console.error('移动历史记录失败:', error);
    }
}

// 检查球员是否已经报名
async function checkPlayerRegistration(playerName, trainingDate) {
    try {
        // 获取当前报名数据
        const playersSnapshot = await database.ref('players').once('value');
        const players = playersSnapshot.val() || {};
        
        // 检查是否已经报名
        const isRegistered = Object.values(players).some(player => {
            const isSamePlayer = player.name === playerName || player.playerName === playerName;
            const isSameDate = player.trainingDate === trainingDate;
            return isSamePlayer && isSameDate;
        });
        
        return isRegistered;
    } catch (error) {
        console.error('检查报名状态失败:', error);
        return false;
    }
}

// 表单提交处理
document.getElementById('playerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const trainingDate = document.getElementById('trainingDate').value;
    if (!trainingDate) {
        alert(translations.selectDate.zh + '\n' + translations.selectDate.de);
        return;
    }
    
    const playerName = document.getElementById('playerName').value;
    
    // 检查是否已经报名
    const isRegistered = await checkPlayerRegistration(playerName, trainingDate);
    if (isRegistered) {
        alert(`${playerName} 已经报名了这次训练！\n${playerName} hat sich bereits für dieses Training angemeldet!`);
        return;
    }
    
    const player = {
        name: playerName,
        position1: document.getElementById('position1').value,
        position2: document.getElementById('position2').value,
        position3: document.getElementById('position3').value,
        age: document.getElementById('age').value,
        experience: document.getElementById('experience').value,
        preferredFoot: document.getElementById('preferredFoot').value,
        skillLevel: document.getElementById('skillLevel').value,
        trainingDate: trainingDate,
        signUpTime: new Date().toISOString(),
        registeredBy: playerName  // 记录谁报的名
    };

    try {
        const historyKey = `${new Date(trainingDate).toDateString()}_${playerName}`;
        await database.ref('players').child(historyKey).set(player);
        alert(translations.signUpSuccess.zh + '\n' + translations.signUpSuccess.de);
        this.reset();
        await loadPlayers();
    } catch (error) {
        console.error('Error submitting form:', error);
        alert(translations.signUpFailed.zh + '\n' + translations.signUpFailed.de);
    }
});

// PDF导出功能
async function exportToPDF(date) {
    try {
        // 获取选中日期的球员数据
        const historySnapshot = await database.ref('signUpHistory').once('value');
        const historyData = historySnapshot.val() || {};
        
        // 过滤出选中日期的球员
        const players = Object.values(historyData).filter(player => 
            player.trainingDate === date
        );
        
        if (players.length === 0) {
            alert('No registration records found for this date!');
            return;
        }
        
        // 创建PDF文档
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4', true);
        
        // 使用默认字体
        doc.setFont('helvetica');
        
        // 设置标题
        const trainingDate = new Date(date);
        const dateStr = `${trainingDate.getFullYear()}-${(trainingDate.getMonth() + 1).toString().padStart(2, '0')}-${trainingDate.getDate().toString().padStart(2, '0')}`;
        doc.setFontSize(16);
        doc.text(`Training Registration - ${dateStr}`, 20, 20);
        
        // 准备表格数据
        const tableData = await Promise.all(players.map(async (player, index) => {
            // 获取出场率
            const { attendanceRate } = await getPlayerLastRecord(player.name || player.playerName);
            return [
                index + 1,  // 添加序号
                getPinyinName(player.name || player.playerName),  // 只显示拼音名字
                attendanceRate + '%',  // 显示出场率
                player.skillLevel,
                player.age,
                player.experience,
                ''  // 空的签名列
            ];
        }));
        
        // 设置表头
        const headers = [
            ['No.', 'Name', 'Attendance', 'Level', 'Age', 'Exp.', 'Signature']
        ];
        
        // 生成表格
        doc.autoTable({
            head: headers,
            body: tableData,
            startY: 30,
            styles: {
                font: 'helvetica',
                fontSize: 8
            },
            headStyles: {
                fillColor: [76, 175, 80],
                textColor: 255
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: {cellWidth: 15},  // No.
                1: {cellWidth: 45},  // Name
                2: {cellWidth: 25},  // Attendance
                3: {cellWidth: 20},  // Level
                4: {cellWidth: 20},  // Age
                5: {cellWidth: 20},  // Experience
                6: {cellWidth: 30}   // Signature
            }
        });
        
        // 保存PDF
        doc.save(`Training_Registration_${dateStr}.pdf`);
    } catch (error) {
        console.error('Export PDF failed:', error);
        console.error(error.stack);
        alert('Export PDF failed!');
    }
}

// 添加导出按钮事件监听
document.getElementById('exportPDF').addEventListener('click', function() {
    const selectedDate = document.getElementById('exportDate').value;
    if (!selectedDate) {
        alert('请选择导出日期！\nBitte wählen Sie ein Datum aus!');
        return;
    }
    exportToPDF(selectedDate);
});

// 球员评分分析
async function analyzePlayerRatings() {
    try {
        // 获取历史数据
        const historySnapshot = await database.ref('signUpHistory').once('value');
        const historyData = historySnapshot.val() || {};
        
        // 获取所有球员的最新记录
        const playerMap = new Map();
        Object.values(historyData).forEach(player => {
            const playerName = player.name || player.playerName;
            const existingPlayer = playerMap.get(playerName);
            
            // 如果没有该球员的记录，或者这是更新的记录，则更新Map
            if (!existingPlayer || new Date(player.trainingDate) > new Date(existingPlayer.trainingDate)) {
                playerMap.set(playerName, player);
            }
        });
        
        // 转换为数组
        const players = Array.from(playerMap.values());
        
        // 分析每个球员
        const analysis = await Promise.all(players.map(async player => {
            const { attendanceRate } = await getPlayerLastRecord(player.name || player.playerName);
            
            // 计算综合评分
            const skillWeight = 0.4;     // 技术等级权重
            const expWeight = 0.3;       // 球龄权重
            const attendWeight = 0.2;    // 出场率权重
            const ageWeight = 0.1;       // 年龄权重
            
            const skillScore = player.skillLevel * 10;  // 技术等级得分
            const expScore = Math.min(player.experience * 5, 100);  // 球龄得分，上限100
            const attendScore = attendanceRate;  // 出场率得分
            const ageScore = Math.max(0, 100 - Math.abs(28 - player.age) * 2);  // 年龄得分，以28岁为最佳
            
            const totalScore = (
                skillScore * skillWeight +
                expScore * expWeight +
                attendScore * attendWeight +
                ageScore * ageWeight
            ).toFixed(1);
            
            // 计算身价
            let marketValue = 0;
            const score = parseFloat(totalScore);
            if (score < 40) {
                marketValue = 1;
            } else if (score < 50) {
                marketValue = 2;
            } else if (score <= 60) {
                marketValue = 2 + (score - 50);
            } else if (score <= 70) {
                marketValue = 12 + (score - 60) * 2;
            } else if (score <= 80) {
                marketValue = 32 + (score - 70) * 3;
            } else if (score <= 90) {
                marketValue = 62 + (score - 80) * 3;
            } else {
                marketValue = 92 + (score - 90) * 4;
            }
            
            return {
                name: player.name || player.playerName,
                pinyinName: getPinyinName(player.name || player.playerName),
                skillLevel: player.skillLevel,
                experience: player.experience,
                attendance: attendanceRate,
                age: player.age,
                totalScore,
                marketValue: marketValue.toFixed(1),  // 保留一位小数
                position: player.position1 ? getPositionName(player.position1).split(' / ')[0] : 'N/A'
            };
        }));
        
        // 按总分排序
        analysis.sort((a, b) => b.totalScore - a.totalScore);
        
        return analysis;
        
    } catch (error) {
        console.error('分析失败:', error);
        return [];
    }
}

// 修改分析按钮事件监听
document.getElementById('analyzeBtn').addEventListener('click', async function() {
    try {
        const analysis = await analyzePlayerRatings();
        
        // 创建PDF文档
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4', true);
        
        // 使用默认字体
        doc.setFont('helvetica');
        
        // 设置标题
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        doc.setFontSize(16);
        doc.text(`Player Analysis Report - ${dateStr}`, 20, 20);
        
        // 准备表格数据
        const tableData = analysis.map((player, index) => [
            index + 1,  // 序号
            player.pinyinName,  // 拼音名字
            player.skillLevel,  // 技术等级
            player.experience,  // 球龄
            player.attendance + '%',  // 出场率
            player.age,  // 年龄
            player.totalScore,  // 总评分
            player.marketValue + ' Mio. €'  // 身价（百万欧元）
        ]);
        
        // 设置表头
        const headers = [
            ['No.', 'Name', 'Level', 'Exp.', 'Attendance', 'Age', 'Score', 'Value']
        ];
        
        // 生成表格
        doc.autoTable({
            head: headers,
            body: tableData,
            startY: 30,
            styles: {
                font: 'helvetica',
                fontSize: 8
            },
            headStyles: {
                fillColor: [76, 175, 80],
                textColor: 255
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: {cellWidth: 15},   // No.
                1: {cellWidth: 40},   // Name
                2: {cellWidth: 15},   // Level
                3: {cellWidth: 15},   // Exp.
                4: {cellWidth: 25},   // Attendance
                5: {cellWidth: 15},   // Age
                6: {cellWidth: 20},   // Score
                7: {cellWidth: 25}    // Market Value
            }
        });
        
        // 添加评分说明
        const startY = doc.autoTable.previous.finalY + 10;
        doc.setFontSize(10);
        doc.text('Score Calculation:', 20, startY);
        doc.text('- Technical Level (40%): Level × 10', 25, startY + 5);
        doc.text('- Experience (30%): Years × 5 (max 100)', 25, startY + 10);
        doc.text('- Attendance (20%): Attendance Rate', 25, startY + 15);
        doc.text('- Age Factor (10%): Based on optimal age of 28', 25, startY + 20);
        
        // 添加身价计算说明
        doc.text('Market Value Calculation:', 20, startY + 30);
        doc.text('- Score < 40: 1 Mio. €', 25, startY + 35);
        doc.text('- Score 40-49: 2 Mio. €', 25, startY + 40);
        doc.text('- Score 50-60: 2 Mio. € + 1 Mio. € per point', 25, startY + 45);
        doc.text('- Score 61-70: 12 Mio. € + 2 Mio. € per point', 25, startY + 50);
        doc.text('- Score 71-80: 32 Mio. € + 3 Mio. € per point', 25, startY + 55);
        doc.text('- Score 81-90: 62 Mio. € + 3 Mio. € per point', 25, startY + 60);
        doc.text('- Score 91-100: 92 Mio. € + 4 Mio. € per point', 25, startY + 65);
        
        // 保存PDF
        doc.save(`Player_Analysis_${dateStr}.pdf`);
        
    } catch (error) {
        console.error('导出分析报告失败:', error);
        alert('导出分析报告失败！\nExport der Analyse fehlgeschlagen!');
    }
});

// 保存用户名到本地存储
document.getElementById('playerName').addEventListener('change', function(e) {
    localStorage.setItem('currentUser', e.target.value);
    loadPlayers();  // 重新加载列表以更新删除按钮
});
