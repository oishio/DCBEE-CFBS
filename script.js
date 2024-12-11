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

// 修改数据读取函数
async function loadPlayers() {
    try {
        const snapshot = await database.ref('players').once('value');
        const allPlayers = snapshot.val() || {};
        
        // 获取当前选择的训练日期
        const selectedDate = document.getElementById('trainingDate').value;
        
        // 过滤出当前日期的球员
        players = Object.values(allPlayers).filter(player => {
            if (!player || !player.trainingDate) return false;
            // 转换日期格式进行比较（只比较日期部分）
            const playerDate = new Date(player.trainingDate).toDateString();
            const selectedDateObj = new Date(selectedDate).toDateString();
            return playerDate === selectedDateObj;
        });
        
        updatePlayersList();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// 修改数据保存函数
async function savePlayers(player) {
    try {
        const playersRef = database.ref('players');
        // 使用日期和姓名作为唯一标识
        const dateStr = new Date(player.trainingDate).toDateString();
        const playerKey = `${dateStr}_${player.name}`;
        
        await playersRef.child(playerKey).set(player);
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

// 在页面加载时显示已存储的球员
document.addEventListener('DOMContentLoaded', async function() {
    generateTrainingDates();
    // 等待日期选项生成完成
    await new Promise(resolve => setTimeout(resolve, 100));
    // 选择第一个日期
    const dateSelect = document.getElementById('trainingDate');
    if (dateSelect.options.length > 1) {
        dateSelect.selectedIndex = 1;  // 选择第一个有效日期
        // 触发 change 事件
        dateSelect.dispatchEvent(new Event('change'));
    }
    // 加载球员数据
    await loadPlayers();
    
    // 添加姓名输入事件监听
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
    
    const trainingInfo = getTrainingInfo();
    
    // 更新显示的时间和地点
    document.querySelectorAll('.schedule-item').forEach(item => {
        const dayText = item.querySelector('h4').textContent;
        if (dayText.includes(trainingInfo.day)) {
            item.classList.add('active-session');
        }
    });
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

// 修改表单提交事件
document.getElementById('playerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const selectedDate = document.getElementById('trainingDate').value;
    if (!selectedDate) {
        alert('请选择训练日期！');
        return;
    }
    
    if (!isRegistrationOpen(selectedDate)) {
        alert('距离训练开始不到15分钟，报名已关闭！');
        return;
    }
    
    const player = {
        name: document.getElementById('playerName').value,
        positions: [
            document.getElementById('position1').value,
            document.getElementById('position2').value,
            document.getElementById('position3').value
        ].filter(pos => pos !== ''),
        age: parseInt(document.getElementById('age').value),
        experience: parseInt(document.getElementById('experience').value),
        preferredFoot: document.getElementById('preferredFoot').value,
        skillLevel: parseInt(document.getElementById('skillLevel').value),
        trainingDate: document.getElementById('trainingDate').value
    };
    
    await savePlayers(player);
    this.reset();
});

// 添加清空功能
const clearButton = document.createElement('button');
clearButton.textContent = '清空所有报名';
clearButton.className = 'clear-btn';
clearButton.onclick = async function() {
    const selectedDate = document.getElementById('trainingDate').value;
    if (!selectedDate) {
        alert('请先选择训练日期！');
        return;
    }
    
    if (!isRegistrationOpen(selectedDate)) {
        alert('距离训练开始不到15分钟，无法修改报名信息！');
        return;
    }
    
    if (confirm('确定要清空所有报名信息吗？')) {
        const dateStr = new Date(selectedDate).toDateString();
        const playersRef = database.ref('players');
        const snapshot = await playersRef.once('value');
        const allPlayers = snapshot.val() || {};
        
        // 删除当前日期的所有球员
        for (let key in allPlayers) {
            if (key.startsWith(dateStr)) {
                await playersRef.child(key).remove();
            }
        }
        
        await loadPlayers();
    }
};
document.querySelector('.registered-players').appendChild(clearButton);

function updatePlayersList() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${player.name} - 位置: ${player.positions.map(getPositionName).join(' > ')} 
            (年龄: ${player.age}, 球龄: ${player.experience}年, 惯用脚: ${player.preferredFoot})
            <button onclick="deletePlayer(${index})" class="delete-btn">删除</button>
        `;
        playersList.appendChild(li);
    });
    
    // 更新图表
    updatePositionChart();
    
    // 如果有足够的球员，自动重新分组
    if (players.length >= 5) {
        document.getElementById('generateTeams').click();
    } else {
        // 清空队伍显示
        const teamsContainer = document.querySelector('.teams');
        teamsContainer.innerHTML = `
            <div class="team" id="team1">
                <h3>队伍一</h3>
                <ul></ul>
            </div>
            <div class="team" id="team2">
                <h3>队伍二</h3>
                <ul></ul>
            </div>
        `;
    }
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
    
    if (confirm('确定要删除这名球员吗？')) {
        const player = players[index];
        const dateStr = new Date(player.trainingDate).toDateString();
        const playerKey = `${dateStr}_${player.name}`;
        await database.ref('players').child(playerKey).remove();
        await loadPlayers();
    }
}

// 修改自动分组功能
document.getElementById('generateTeams').addEventListener('click', function() {
    if (players.length < 5) {
        alert('至少需要5名球员才能分组！');
        return;
    }
    
    // 计算综合实力（技术等级 + 球龄加成）
    const playersWithStrength = players.map(player => ({
        ...player,
        totalStrength: player.skillLevel + Math.min(Math.floor(player.experience / 5), 2)
    }));
    
    // 按综合实力排序
    playersWithStrength.sort((a, b) => b.totalStrength - a.totalStrength);
    
    // 创建两个队伍
    const teams = [
        { players: [], totalSkill: 0 },
        { players: [], totalSkill: 0 }
    ];
    
    // 蛇形分配球员以保持实力平衡
    playersWithStrength.forEach((player, index) => {
        // 找到当前总技术值最低的队伍
        const targetTeamIndex = teams[0].totalSkill <= teams[1].totalSkill ? 0 : 1;
        teams[targetTeamIndex].players.push(player);
        teams[targetTeamIndex].totalSkill += player.totalStrength;
    });
    
    displayTeams(teams);
});

// 修改队伍显示   数
function displayTeams(teams) {
    const teamsContainer = document.querySelector('.teams');
    teamsContainer.innerHTML = '';
    
    teams.forEach((team, index) => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team';
        teamDiv.innerHTML = `
            <h3>队伍 ${index + 1}</h3>
            <p>队伍总实力: ${team.totalSkill}</p>
            <ul></ul>
        `;
        
        const ul = teamDiv.querySelector('ul');
        team.players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name} - 位置: ${player.positions.map(getPositionName).join(' > ')} 
                (年龄: ${player.age}, 球龄: ${player.experience}年, 
                惯用脚: ${player.preferredFoot}, 技术等级: ${player.skillLevel})`;
            ul.appendChild(li);
        });
        
        teamsContainer.appendChild(teamDiv);
    });
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

// 位置名称转换
function getPositionName(pos) {
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

// 修改导出功能
document.getElementById('exportBtn').addEventListener('click', function() {
    const trainingInfo = getTrainingInfo();
    
    const wb = XLSX.utils.book_new();
    const data = players.map(p => ({
        '姓名': p.name,
        '首选位置': getPositionName(p.positions[0]),
        '次选位置': p.positions[1] ? getPositionName(p.positions[1]) : '',
        '备选位置': p.positions[2] ? getPositionName(p.positions[2]) : '',
        '年龄': p.age,
        '球龄': p.experience,
        '惯用脚': p.preferredFoot,
        '技术等级': p.skillLevel
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // 修改表信息
    XLSX.utils.sheet_add_aoa(ws, [
        [`DCBEE-CFBS足球报名表 (${trainingInfo.date})`],
        [`训练时间：${trainingInfo.time}`],
        [`训练地点：${trainingInfo.address}`],
        ['']  // 空行
    ], { origin: 'A1' });
    
    // 调整列宽
    ws['!cols'] = [
        { wch: 15 }, // 姓名
        { wch: 15 }, // 首选位置
        { wch: 15 }, // 次选位置
        { wch: 15 }, // 备选位置
        { wch: 8 },  // 年龄
        { wch: 10 }, // 球龄
        { wch: 10 }, // 惯用脚
        { wch: 10 }  // 技术等级
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, "球员名单");
    XLSX.writeFile(wb, `DCBEE-CFBS足球报名表_${trainingInfo.date}.xlsx`);
});

// 位置筛选
document.getElementById('positionFilter').addEventListener('change', function(e) {
    const filterValue = e.target.value;
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    const filteredPlayers = filterValue ? 
        players.filter(p => p.positions.includes(filterValue)) : 
        players;
    
    filteredPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${player.name} - 位置: ${player.positions.map(getPositionName).join(' > ')} 
            (年龄: ${player.age}, 球龄: ${player.experience}年, 惯用脚: ${player.preferredFoot})
            <button onclick="deletePlayer(${players.indexOf(player)})" class="delete-btn">删除</button>
        `;
        playersList.appendChild(li);
    });
});

// 修改生成训练日期选项的函数
function generateTrainingDates() {
    const select = document.getElementById('trainingDate');
    // 清空现有选项
    select.innerHTML = '<option value="">选择训练日期</option>';
    
    const dates = [
        { date: '2024-12-11', day: '周三' },
        { date: '2024-12-14', day: '周六' },
        { date: '2024-12-18', day: '周三' },
        { date: '2025-01-08', day: '周三' },
        { date: '2025-01-11', day: '周六' },
        { date: '2025-01-15', day: '周三' },
        { date: '2025-01-18', day: '周六' }
    ];

    // 按日期排序
    dates.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 只显示今天和将来的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    dates.forEach(({ date, day }) => {
        const currentDate = new Date(date);
        if (currentDate >= today) {
            const dateStr = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
            const timeStr = day === '周三' ? '20:00-22:00' : '18:00-20:00';
            const addressStr = day === '周三' ? 
                'Franz-Liszt-Strasse 37, 38126, BS' : 
                'Beethovenstrasse 16, 38106, BS';
            
            const option = document.createElement('option');
            option.value = currentDate.toISOString();
            option.textContent = `${dateStr} ${day} ${timeStr} (${addressStr})`;
            select.appendChild(option);
        }
    });

    // 如果没有选择日期，自动选择最近的日期
    if (!select.value && select.options.length > 1) {
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change'));
    }
}

// 修改日期选择事件监听
document.getElementById('trainingDate').addEventListener('change', async function() {
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
    
    // 如果有足够的球员，自动分组
    if (players.length >= 5) {
        document.getElementById('generateTeams').click();
    } else {
        // 清空队伍显示
        const teamsContainer = document.querySelector('.teams');
        teamsContainer.innerHTML = `
            <div class="team" id="team1">
                <h3>队伍一</h3>
                <ul></ul>
            </div>
            <div class="team" id="team2">
                <h3>队伍二</h3>
                <ul></ul>
            </div>
        `;
    }
});

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

// 选择日期时也检查状态
document.getElementById('trainingDate').addEventListener('change', checkRegistrationStatus);

// 添加定时刷新
setInterval(loadPlayers, 30000); // 每30秒刷新一次 
