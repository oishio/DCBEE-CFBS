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
    }
};

// 修改数据读取函数
async function loadPlayers() {
    try {
        const selectedDate = document.getElementById('trainingDate').value;
        if (!selectedDate) return;

        const snapshot = await database.ref('players').once('value');
        const allPlayers = snapshot.val() || {};
        
        // 过滤出当前日期的球员
        players = Object.values(allPlayers).filter(player => {
            if (!player || !player.trainingDate) return false;
            
            // 将两个日期转换为相同的格式进行比较
            const playerDate = new Date(player.trainingDate);
            const selectedDateObj = new Date(selectedDate);
            
            return playerDate.getFullYear() === selectedDateObj.getFullYear() &&
                   playerDate.getMonth() === selectedDateObj.getMonth() &&
                   playerDate.getDate() === selectedDateObj.getDate();
        });

        // 不需要转换数据格式，直接使用原始数据
        // players 数组中的每个对象已经包含了所需的所有字段：
        // playerName, position1, position2, position3, etc.

        updatePlayersList();
        displaySignUpHistory();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// 修改数据保存函数
async function savePlayers(player) {
    try {
        const playersRef = database.ref('players');
        const signUpData = {
            playerName: document.getElementById('playerName').value,
            position1: document.getElementById('position1').value,
            position2: document.getElementById('position2').value,
            position3: document.getElementById('position3').value,
            age: document.getElementById('age').value,
            experience: document.getElementById('experience').value,
            preferredFoot: document.getElementById('preferredFoot').value,
            skillLevel: document.getElementById('skillLevel').value,
            trainingDate: document.getElementById('trainingDate').value,
            signUpTime: new Date().toISOString(),
            status: '已报名'
        };

        // 保存到当前报名列表
        const playerKey = `${new Date(signUpData.trainingDate).toDateString()}_${signUpData.playerName}`;
        await playersRef.child(playerKey).set(signUpData);

        // 同时保存到历史记录
        const historyRef = database.ref('signUpHistory').push();
        await historyRef.set(signUpData);

        await loadPlayers();
    } catch (error) {
        console.error('Error saving data:', error);
        alert('保存数据失败，请稍后重试！');
    }
}

function getDefaultTrainingInfo() {
    const now = new Date();
    const day = now.getDay(); // 0是周日，2是周二，3是周三，5是周五，6是周六
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    
    let timeStr, dayStr, addressStr;
    if (day === 2 || day === 3) { // 周二或周三
        timeStr = "20:00 - 22:00";
        dayStr = "周三晚场";
        addressStr = "Franz-Liszt-Strasse 37, 38126, BS";
    } else if (day === 5 || day === 6) { // 周五或周六
        timeStr = "18:00 - 20:00";
        dayStr = "周六傍晚场";
        addressStr = "Beethovenstrasse 16, 38106, BS";
    } else { // 其他时间默认显示最近的场次
        const daysToWed = (3 - day + 7) % 7;
        const daysToSat = (6 - day + 7) % 7;
        if (daysToWed <= daysToSat) {
            timeStr = "20:00 - 22:00";
            dayStr = "周三晚场";
            addressStr = "Franz-Liszt-Strasse 37, 38126, BS";
        } else {
            timeStr = "18:00 - 20:00";
            dayStr = "周六傍晚场";
            addressStr = "Beethovenstrasse 16, 38106, BS";
        }
    }
    
    return {
        date: dateStr,
        time: timeStr,
        day: dayStr,
        address: addressStr
    };
}

function getTrainingInfo() {
    const selectedDate = document.getElementById('trainingDate').value;
    if (!selectedDate) {
        // 如果没有选择日期，使用默认逻辑
        return getDefaultTrainingInfo();
    }
    
    const date = new Date(selectedDate);
    const day = date.getDay();
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    
    if (day === 3) {
        return {
            date: dateStr,
            time: "20:00 - 22:00",
            day: "周三晚场",
            address: "Franz-Liszt-Strasse 37, 38126, BS"
        };
    } else {
        return {
            date: dateStr,
            time: "18:00 - 20:00",
            day: "周六傍晚场",
            address: "Beethovenstrasse 16, 38106, BS"
        };
    }
}

let players = [];

// 在页面加载时生成训练日期选项
function generateTrainingDates() {
    const trainingDateSelect = document.getElementById('trainingDate');
    if (!trainingDateSelect) {
        console.error('Cannot find trainingDate select element');
        return;
    }

    // 定义所有训练日期
    const dates = [
        // 旧日期
        { date: '2024-12-11', day: '周三' },
        { date: '2024-12-14', day: '周六' },
        { date: '2024-12-18', day: '周三' },
        { date: '2025-01-08', day: '周三' },
        { date: '2025-01-11', day: '周六' },
        { date: '2025-01-15', day: '周三' },
        { date: '2025-01-18', day: '周六' }
    ];

    // 添加新日期（2025-01-22 到 2025-02-26 的周三和周六）
    let currentDate = new Date('2025-01-22');
    const endDate = new Date('2025-02-26');
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 3 || dayOfWeek === 6) {
            dates.push({
                date: currentDate.toISOString().split('T')[0],
                day: dayOfWeek === 3 ? '周三' : '周六'
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 按日期排序
    dates.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 只显示今天和将来的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 清除现有选项（保留默认选项）
    while (trainingDateSelect.options.length > 1) {
        trainingDateSelect.remove(1);
    }

    // 添加日期选项
    dates.forEach(({ date, day }) => {
        const currentDate = new Date(date);
        if (currentDate >= today) {
            const option = document.createElement('option');
            const dayOfWeekDE = day === '周三' ? 'Mittwoch' : 'Samstag';
            option.value = date;
            option.textContent = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日 ${day} / ${currentDate.getDate()}.${currentDate.getMonth() + 1}.${currentDate.getFullYear()} ${dayOfWeekDE}`;
            trainingDateSelect.appendChild(option);
        }
    });

    console.log('Final select options count:', trainingDateSelect.options.length);
}

// 在页面加载时调用
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded');
    generateTrainingDates();
    console.log('Training dates generated');
    
    // 等待日期选项生成完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 选择第一个日期
    const dateSelect = document.getElementById('trainingDate');
    console.log('Date select options:', dateSelect.options.length);
    
    if (dateSelect.options.length > 1) {
        dateSelect.selectedIndex = 1;  // 选择第一个有效日期
        console.log('Selected first date:', dateSelect.value);
        // 触发 change 事件
        dateSelect.dispatchEvent(new Event('change'));
    }
    
    // 加载球员数据
    await loadPlayers();
    
    // 显示历史记录
    await displaySignUpHistory();
    
    // 添加所有事件监听器
    // 1. 表单提交事件
    document.getElementById('playerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const selectedDate = document.getElementById('trainingDate').value;
        if (!selectedDate) {
            alert('请选择训练日期！');
            return;
        }
        
        const signUpData = {
            name: document.getElementById('playerName').value,
            positions: [
                document.getElementById('position1').value,
                document.getElementById('position2').value,
                document.getElementById('position3').value
            ].filter(Boolean),
            age: document.getElementById('age').value,
            experience: document.getElementById('experience').value,
            preferredFoot: document.getElementById('preferredFoot').value,
            skillLevel: document.getElementById('skillLevel').value,
            trainingDate: selectedDate,
            signUpTime: new Date().toISOString(),
            status: '已报名'
        };

        try {
            // 保存到报名列表
            const playerKey = `${new Date(selectedDate).toDateString()}_${signUpData.name}`;
            await database.ref('players').child(playerKey).set(signUpData);

            // 保存到历史记录
            const historyRef = database.ref('signUpHistory').push();
            await historyRef.set(signUpData);

            alert('报名成功！');
            this.reset();
            await loadPlayers();  // 重新加载球员列表
        } catch (error) {
            console.error('报名失败:', error);
            alert('报名失败，请重试');
        }
    });
    
    // 2. 训练日期变更事件
    dateSelect.addEventListener('change', async function() {
        // 获取训练信息并更新显示
        const trainingInfo = getTrainingInfo();
        document.querySelectorAll('.schedule-item').forEach(item => {
            item.classList.remove('active-session');
            const dayText = item.querySelector('h4').textContent;
            if (dayText.includes(trainingInfo.day)) {
                item.classList.add('active-session');
            }
        });

        // 加载该日期的球员数据
        await loadPlayers();
        
        // 检查报名状态
        checkRegistrationStatus();
        
        // 如果有足够的球员，自动分组（不需要点击按钮）
        if (players.length >= 5) {
            generateTeams();  // 直接调用分组函数
        } else {
            // 清空队伍显示
            const teamsContainer = document.querySelector('.teams');
            teamsContainer.innerHTML = '';
        }
    });
    
    // 3. 导出按钮事件
    const exportPDFBtn = document.getElementById('exportPDF');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', async () => {
            const selectedDate = document.getElementById('exportDate').value;
            if (!selectedDate) {
                alert('请选择要导出的日期！');
                return;
            }
            
            try {
                exportPDFBtn.disabled = true;
                exportPDFBtn.textContent = '导出中...';
                
                await exportToPDF(selectedDate);
                
                exportPDFBtn.disabled = false;
                exportPDFBtn.textContent = '导出PDF';
            } catch (error) {
                console.error('导出失败:', error);
                alert('导出失败，请重试');
                
                exportPDFBtn.disabled = false;
                exportPDFBtn.textContent = '导出PDF';
            }
        });
    }
    
    // 4. 姓名输入事件
    document.getElementById('playerName').addEventListener('input', async function(e) {
        const name = e.target.value;
        if (!name) return;

        try {
            // 获取所有球员数据
            const snapshot = await database.ref('players').once('value');
            const allPlayers = snapshot.val() || {};
            
            // 查找最近的一条该球员的记录
            const playerRecords = Object.values(allPlayers)
                .filter(p => p.name === name)
                .sort((a, b) => new Date(b.trainingDate) - new Date(a.trainingDate));

            const existingPlayer = playerRecords[0];
            
            if (existingPlayer) {
                document.getElementById('position1').value = existingPlayer.positions[0] || '';
                document.getElementById('position2').value = existingPlayer.positions[1] || '';
                document.getElementById('position3').value = existingPlayer.positions[2] || '';
                document.getElementById('age').value = existingPlayer.age;
                document.getElementById('experience').value = existingPlayer.experience || '';
                document.getElementById('preferredFoot').value = existingPlayer.preferredFoot;
                document.getElementById('skillLevel').value = existingPlayer.skillLevel;
            }
        } catch (error) {
            console.error('Error loading player data:', error);
        }
    });
    
    // 5. 状态检查
    checkRegistrationStatus();
    
    // 6. 设置定时器
    setInterval(checkRegistrationStatus, 60000);  // 每分钟检查一次状态
    setInterval(loadPlayers, 30000);  // 每30秒刷新一次
    
    // 7. 训练日期变更事件（移到这里）
    dateSelect.addEventListener('change', checkRegistrationStatus);
});

// 添加时间检查函数
function isRegistrationOpen(trainingDate) {
    const now = new Date();
    const training = new Date(trainingDate);
    
    // 获取训练时间
    const isWednesday = training.getDay() === 3;
    const trainingHour = isWednesday ? 20 : 18; // 周三20点，周六18点
    
    // 设置训练开始时
    training.setHours(trainingHour, 0, 0, 0);
    
    // 计算时间差（分钟）
    const timeDiff = (training - now) / (1000 * 60);
    
    // 如果距离训练开始不到15分钟，返回false
    return timeDiff > 15;
}

// 修改删除球员函数
async function deletePlayer(index) {
    const selectedDate = document.getElementById('trainingDate').value;
    if (!selectedDate) {
        alert('请先选择训练日期！');
        return;
    }
    
    if (!isRegistrationOpen(selectedDate)) {
        alert('距离训练开始不到15分钟，无法修改报名信息！');
        return;
    }
    
    if (confirm(`${translations.confirmDelete.zh}\n${translations.confirmDelete.de}`)) {
        const player = players[index];
        const dateStr = new Date(player.trainingDate).toDateString();
        const playerKey = `${dateStr}_${player.playerName}`;
        await database.ref('players').child(playerKey).remove();
        await loadPlayers();
        await displaySignUpHistory();
    }
}

// 修改自动分组功能
function generateTeams() {
    if (players.length < 5) {
        const teamsContainer = document.querySelector('.teams');
        teamsContainer.innerHTML = '<div class="team"><h3>至少需要5名球员才能分组！</h3></div>';
        return;
    }
    
    // 计算综合实力（技术等级 + 球龄加成）
    const playersWithStrength = players.map(player => ({
        ...player,
        name: player.playerName,
        positions: [player.position1, player.position2, player.position3].filter(Boolean),
        totalStrength: parseInt(player.skillLevel) + Math.min(Math.floor(parseInt(player.experience) / 5), 2)
    }));
    
    // 按综合实力排序
    playersWithStrength.sort((a, b) => b.totalStrength - a.totalStrength);
    
    // 根据人数决定分组数量和处理方式
    let numTeams;
    let mainPlayers;
    let substitutes = [];
    
    if (players.length <= 12) {
        numTeams = 2;
        mainPlayers = playersWithStrength;
    } else if (players.length <= 18) {
        numTeams = 3;
        mainPlayers = playersWithStrength;
    } else if (players.length <= 24) {
        numTeams = 4;
        mainPlayers = playersWithStrength;
    } else {
        numTeams = 4;
        mainPlayers = playersWithStrength.slice(0, 24);
        substitutes = playersWithStrength.slice(24);
    }
    
    // 创建队伍
    const teams = Array(numTeams).fill(null).map(() => ({
        players: [],
        totalSkill: 0
    }));
    
    // 蛇形分配球员以保持实力平衡
    mainPlayers.forEach((player) => {
        // 找到当前总技术值最低的队伍
        const targetTeamIndex = teams.reduce((minIndex, team, index) => 
            team.totalSkill < teams[minIndex].totalSkill ? index : minIndex
        , 0);
        
        teams[targetTeamIndex].players.push(player);
        teams[targetTeamIndex].totalSkill += player.totalStrength;
    });
    
    displayTeams(teams, substitutes);
}

// 修改队伍显示函数
function displayTeams(teams, substitutes = []) {
    const teamsContainer = document.querySelector('.teams');
    teamsContainer.innerHTML = '';
    
    teams.forEach((team, index) => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team';
        teamDiv.innerHTML = `
            <h3>${translations.team.zh} ${index + 1} / ${translations.team.de} ${index + 1}</h3>
            <p>${translations.totalStrength.zh}: ${team.totalSkill} / ${translations.totalStrength.de}: ${team.totalSkill}</p>
            <ul></ul>
        `;
        
        const ul = teamDiv.querySelector('ul');
        team.players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.playerName} - ${getPositionName(player.position1)}`;
            ul.appendChild(li);
        });
        
        teamsContainer.appendChild(teamDiv);
    });
    
    if (substitutes.length > 0) {
        const subsDiv = document.createElement('div');
        subsDiv.className = 'team substitutes';
        subsDiv.innerHTML = `
            <h3>${translations.substitutes.zh} / ${translations.substitutes.de}</h3>
            <ul></ul>
        `;
        
        const ul = subsDiv.querySelector('ul');
        substitutes.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name} - ${player.positions.map(getPositionName).join('/')}`;
            ul.appendChild(li);
        });
        
        teamsContainer.appendChild(subsDiv);
    }
}

// 位置统计图表
let positionChart = null;

function updatePositionChart() {
    const positions = {};
    players.forEach(player => {
        player.positions.forEach(pos => {
            positions[pos] = (positions[pos] || 0) + 1;
        });
    });

    const ctx = document.getElementById('positionChart').getContext('2d');
    
    if (positionChart) {
        positionChart.destroy();
    }

    positionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(positions).map(pos => getPositionName(pos)),
            datasets: [{
                data: Object.values(positions),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: '球员位置分布'
                }
            }
        }
    });
}

// 位置名转换
function getPositionName(pos) {
    if (!pos) return '';
    const positionNames = {
        'striker': '前锋(ST)',
        'winger': '边锋(LW/RW)',
        'pivot': '中场(MF)',
        'defender': '后卫(DF)',
        'goalkeeper': '守门员(GK)',
        'striker6': '前锋(ST)',
        'winger6': '边锋(LW/RW)',
        'midfielder6': '中场(MF)',
        'defender6': '后卫(DF)',
        'sweeper6': '清道夫(SW)',
        'goalkeeper6': '守门员(GK)'
    };
    return positionNames[pos] || pos;
}

// 添加定时检查
function checkRegistrationStatus() {
    const selectedDate = document.getElementById('trainingDate').value;
    if (selectedDate && !isRegistrationOpen(selectedDate)) {
        document.getElementById('playerForm').querySelectorAll('input, select, button').forEach(el => {
            el.disabled = true;
        });
        document.querySelectorAll('.delete-btn, .clear-btn').forEach(btn => {
            btn.disabled = true;
        });
        document.getElementById('generateTeams').disabled = true;
    } else {
        document.getElementById('playerForm').querySelectorAll('input, select, button').forEach(el => {
            el.disabled = false;
        });
        document.querySelectorAll('.delete-btn, .clear-btn').forEach(btn => {
            btn.disabled = false;
        });
        document.getElementById('generateTeams').disabled = false;
    }
}

// 每分钟检查一次状态
setInterval(checkRegistrationStatus, 60000);

// 选择日期也检查状态
document.getElementById('trainingDate').addEventListener('change', checkRegistrationStatus);

// 添加定时刷新
setInterval(loadPlayers, 30000); // 每30秒刷新一次 

// 修改球员列表显示函数
function updatePlayersList() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    players.forEach((player, index) => {
        const li = document.createElement('li');
        const playerName = player.name;
        const position = getPositionName(player.positions[0]);
        
        li.innerHTML = `
            <span class="player-info">${playerName} - ${position}</span>
            <button onclick="deletePlayer(${index})" class="delete-btn">${translations.delete.zh} / ${translations.delete.de}</button>
        `;
        playersList.appendChild(li);
    });
    
    // 如果有足够的球员，自动分组
    if (players.length >= 5) {
        generateTeams();
    } else {
        const teamsContainer = document.querySelector('.teams');
        teamsContainer.innerHTML = '';
    }
}

// 修改显示历史记录的函数
async function displaySignUpHistory() {
    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = '';

    try {
        // 获取历史记录数据
        const historyRef = firebase.database().ref('signUpHistory');
        const historySnapshot = await historyRef.once('value');
        const historyData = historySnapshot.val() || {};

        // 获取当前报名数据
        const playersRef = firebase.database().ref('players');
        const playersSnapshot = await playersRef.once('value');
        const playersData = playersSnapshot.val() || {};

        // 按日期分组历史记录
        const groupedHistory = {};
        
        // 处理历史记录数据
        Object.entries(historyData).forEach(([key, record]) => {
            if (!record || !record.trainingDate) return;
            
            const date = record.trainingDate;
            if (!groupedHistory[date]) {
                groupedHistory[date] = new Map();
            }
            
            // 确保记录包含所有必要的字段
            const processedRecord = {
                playerName: record.name || record.playerName || '未知',
                position1: record.position1 || record.positions?.[0] || '',
                position2: record.position2 || record.positions?.[1] || '',
                position3: record.position3 || record.positions?.[2] || '',
                trainingDate: date,
                signUpTime: record.signUpTime || new Date().toISOString(),
                status: record.status || '已报名'
            };
            
            groupedHistory[date].set(processedRecord.playerName, processedRecord);
        });

        // 处理当前报名数据
        Object.entries(playersData).forEach(([key, record]) => {
            if (!record || !record.trainingDate) return;
            
            const date = record.trainingDate;
            if (!groupedHistory[date]) {
                groupedHistory[date] = new Map();
            }
            
            const processedRecord = {
                playerName: record.name || record.playerName || '未知',
                position1: record.position1 || record.positions?.[0] || '',
                position2: record.position2 || record.positions?.[1] || '',
                position3: record.position3 || record.positions?.[2] || '',
                trainingDate: date,
                signUpTime: record.signUpTime || new Date().toISOString(),
                status: record.status || '已报名'
            };
            
            groupedHistory[date].set(processedRecord.playerName, processedRecord);
        });

        // 按日期倒序排序
        const sortedDates = Object.keys(groupedHistory).sort((a, b) => 
            new Date(b) - new Date(a)
        );

        sortedDates.forEach(date => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'history-date-group';
            
            // 创建折叠面板的标题部分
            const header = document.createElement('div');
            header.className = 'history-header';
            
            const trainingDate = new Date(date);
            const dateStr = `${trainingDate.getFullYear()}年${trainingDate.getMonth() + 1}月${trainingDate.getDate()}日训练`;
            const playerCount = groupedHistory[date].size;
            
            header.innerHTML = `
                <div class="header-content">
                    <h3>${dateStr}</h3>
                    <span class="player-count">共 ${playerCount} 人报名</span>
                </div>
                <span class="toggle-icon">▼</span>
            `;
            
            // 创建内容部分
            const content = document.createElement('div');
            content.className = 'history-content collapsed';
            
            const playersList = document.createElement('ul');
            playersList.className = 'history-players-list';
            
            // 将 Map 转换为数组并按姓名排序
            const sortedPlayers = Array.from(groupedHistory[date].values())
                .sort((a, b) => (a.playerName || '').localeCompare(b.playerName || ''));
            
            sortedPlayers.forEach(record => {
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
        const exportDateSelect = document.getElementById('exportDate');
        exportDateSelect.innerHTML = '<option value="">选择导出日期</option>';
        sortedDates.forEach(date => {
            const trainingDate = new Date(date);
            const dateStr = `${trainingDate.getFullYear()}年${trainingDate.getMonth() + 1}月${trainingDate.getDate()}日`;
            exportDateSelect.innerHTML += `<option value="${date}">${dateStr}</option>`;
        });
    } catch (error) {
        console.error('获取历史记录失败:', error);
        historyList.innerHTML = '<p class="error-message">获取历史记录失败</p>';
    }
}

// 修改导出PDF功能
async function exportToPDF(date) {
    const groupedHistory = window.historyData?.[date];
    if (!groupedHistory) return;

    try {
        // 创建 PDF 实例
        const doc = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // 添加中文字体支持
        doc.addFont('NotoSansSC-Regular', 'NotoSansSC', 'normal');
        doc.setFont('NotoSansSC');
        
        const trainingDate = new Date(date);
        const dateStr = `${trainingDate.getFullYear()}年${trainingDate.getMonth() + 1}月${trainingDate.getDate()}日训练`;

        // 设置标题
        doc.setFontSize(16);
        doc.text(dateStr + ' 报名表', 15, 15);

        // 准备表格数据
        const players = Array.from(groupedHistory.values());
        const tableData = players
            .sort((a, b) => a.playerName.localeCompare(b.playerName))
            .map((player, index) => [
                index + 1,
                player.playerName,
                getPositionName(player.position1),
                player.position2 ? getPositionName(player.position2) : '',
                player.age,
                player.experience + '年',
                player.skillLevel + '级'
            ]);

        // 生成表格
        doc.autoTable({
            startY: 25,
            head: [['序号', '姓名', '首选位置', '次选位置', '年龄', '球龄', '技术等级']],
            body: tableData,
            theme: 'grid',
            styles: {
                font: 'NotoSansSC',
                fontSize: 10,
                cellPadding: 3,
                overflow: 'linebreak',
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 11
            },
            columnStyles: {
                0: { cellWidth: 15 },  // 序号列宽
                1: { cellWidth: 30 },  // 姓名列宽
                2: { cellWidth: 35 },  // 首选位置列宽
                3: { cellWidth: 35 },  // 次选位置列宽
                4: { cellWidth: 15 },  // 年龄列宽
                5: { cellWidth: 20 },  // 球龄列宽
                6: { cellWidth: 20 }   // 技术等级列宽
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            didDrawPage: function(data) {
                // 添加页脚
                doc.setFontSize(8);
                doc.text(
                    `打印时间：${new Date().toLocaleString()}`,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 10
                );
            }
        });

        // 添加统计信息
        const finalY = doc.previousAutoTable.finalY || 25;
        doc.setFontSize(12);
        
        // 添加位置统计
        const positionStats = players.reduce((stats, player) => {
            const pos = getPositionName(player.position1);
            stats[pos] = (stats[pos] || 0) + 1;
            return stats;
        }, {});

        doc.text(`总人数：${players.length}人`, 15, finalY + 10);
        
        let yPos = finalY + 25;
        doc.text('位置分布：', 15, yPos);
        yPos += 7;
        
        Object.entries(positionStats).forEach(([pos, count]) => {
            doc.text(`${pos}: ${count}人`, 25, yPos);
            yPos += 7;
        });

        // 使用 output 方法直接获取 base64 编码的 PDF
        const pdfOutput = doc.output('datauristring');
        
        // 创建一个隐藏的 iframe 来显示 PDF
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfOutput;
        document.body.appendChild(iframe);
        
        // 触发 iframe 的打印功能
        setTimeout(() => {
            iframe.contentWindow.print();
            document.body.removeChild(iframe);
        }, 1000);
        
    } catch (error) {
        console.error('导出PDF失败:', error);
        alert('导出PDF失败，请重试');
    }
}
