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

let players = JSON.parse(localStorage.getItem('players') || '[]');

// 在页面加载时显示已存储的球员
document.addEventListener('DOMContentLoaded', function() {
    generateTrainingDates();
    updatePlayersList();
    
    // 添加姓名输入事件监听
    document.getElementById('playerName').addEventListener('input', function(e) {
        const name = e.target.value;
        const existingPlayer = players.find(p => p.name === name);
        
        if (existingPlayer) {
            document.getElementById('position1').value = existingPlayer.positions[0] || '';
            document.getElementById('position2').value = existingPlayer.positions[1] || '';
            document.getElementById('position3').value = existingPlayer.positions[2] || '';
            document.getElementById('age').value = existingPlayer.age;
            document.getElementById('experience').value = existingPlayer.experience || '';
            document.getElementById('preferredFoot').value = existingPlayer.preferredFoot;
            document.getElementById('skillLevel').value = existingPlayer.skillLevel;
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

document.getElementById('playerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
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
        skillLevel: parseInt(document.getElementById('skillLevel').value)
    };
    
    // 检查是否存在同名球员
    const existingIndex = players.findIndex(p => p.name === player.name);
    if (existingIndex !== -1) {
        if (confirm('已存在同名球员，是否更新信息？')) {
            players[existingIndex] = player;
        } else {
            return; // 取消提交
        }
    } else {
        players.push(player);
    }
    
    localStorage.setItem('players', JSON.stringify(players));
    updatePlayersList();
    this.reset();
});

// 添加清空功能
const clearButton = document.createElement('button');
clearButton.textContent = '清空所有报名';
clearButton.className = 'clear-btn';
clearButton.onclick = function() {
    if (confirm('确定要清空所有报名信息吗？')) {
        players = [];
        localStorage.removeItem('players');
        updatePlayersList();
        document.querySelector('#team1 ul').innerHTML = '';
        document.querySelector('#team2 ul').innerHTML = '';
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
}

function deletePlayer(index) {
    if (confirm('确定要删除这名球员吗？')) {
        players.splice(index, 1);
        localStorage.setItem('players', JSON.stringify(players));
        updatePlayersList();
    }
}

document.getElementById('generateTeams').addEventListener('click', function() {
    if (players.length < 5) {
        alert('需要至少5名球员才能分队！');
        return;
    }
    
    // 计算综合实力（技术等级 + 球龄加成）
    players.forEach(player => {
        // 球龄加成：每5年球龄增加1点实力，最多增加2点
        const experienceBonus = Math.min(Math.floor(player.experience / 5), 2);
        player.totalStrength = player.skillLevel + experienceBonus;
    });
    
    // 按综合实力排序
    players.sort((a, b) => b.totalStrength - a.totalStrength);
    
    // 计算需要的队伍数量（每队5-6人）
    const teamSize = 6; // 每队最大人数
    const numTeams = Math.ceil(players.length / teamSize);
    
    // 创建队伍数组
    const teams = Array.from({ length: numTeams }, () => ({
        players: [],
        totalSkill: 0
    }));
    
    // 蛇形分配球员以保持实力平衡
    players.forEach(player => {
        // 找到当前总技术值最低的队伍
        let targetTeam = teams.reduce((min, team, index) => 
            team.totalSkill < teams[min].totalSkill ? index : min
        , 0);
        
        // 分配球员
        teams[targetTeam].players.push(player);
        teams[targetTeam].totalSkill += player.skillLevel;
    });
    
    displayTeams(teams);
});

function displayTeams(teams) {
    // 清除现有的队伍显示
    const teamsContainer = document.querySelector('.teams');
    teamsContainer.innerHTML = '';
    
    // 显示每个队伍
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
        'pivot': '中锋(PV)',
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
    const dates = [
        { date: '2024-12-11', day: '周三' },
        { date: '2024-12-14', day: '周六' },
        { date: '2024-12-18', day: '周三' },
        { date: '2025-01-08', day: '周三' },
        { date: '2025-01-11', day: '周六' },
        { date: '2025-01-15', day: '周三' },
        { date: '2025-01-18', day: '周六' }
    ];

    dates.forEach(({ date, day }) => {
        const currentDate = new Date(date);
        const dateStr = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
        const timeStr = day === '周三' ? '20:00-22:00' : '18:00-20:00';
        const addressStr = day === '周三' ? 
            'Franz-Liszt-Strasse 37, 38126, BS' : 
            'Beethovenstrasse 16, 38106, BS';
        
        const option = document.createElement('option');
        option.value = currentDate.toISOString();
        option.textContent = `${dateStr} ${day} ${timeStr} (${addressStr})`;
        select.appendChild(option);
    });
}

// 添加日期选择事件监听
document.getElementById('trainingDate').addEventListener('change', function() {
    const trainingInfo = getTrainingInfo();
    document.querySelectorAll('.schedule-item').forEach(item => {
        item.classList.remove('active-session');
        const dayText = item.querySelector('h4').textContent;
        if (dayText.includes(trainingInfo.day)) {
            item.classList.add('active-session');
        }
    });
}); 