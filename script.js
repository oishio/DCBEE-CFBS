let players = JSON.parse(localStorage.getItem('players') || '[]');

// 在页面加载时显示已存储的球员
document.addEventListener('DOMContentLoaded', function() {
    updatePlayersList();
    
    // 添加姓名输入事件监听
    document.getElementById('playerName').addEventListener('input', function(e) {
        const name = e.target.value;
        const existingPlayer = players.find(p => p.name === name);
        
        if (existingPlayer) {
            // 自动填充已存在球员的信息
            document.getElementById('position1').value = existingPlayer.positions[0] || '';
            document.getElementById('position2').value = existingPlayer.positions[1] || '';
            document.getElementById('position3').value = existingPlayer.positions[2] || '';
            document.getElementById('age').value = existingPlayer.age;
            document.getElementById('preferredFoot').value = existingPlayer.preferredFoot;
            document.getElementById('skillLevel').value = existingPlayer.skillLevel;
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
            ${player.name} - 位置: ${player.positions.join(' > ')} 
            (年龄: ${player.age}, 惯用脚: ${player.preferredFoot})
            <button onclick="deletePlayer(${index})" class="delete-btn">删除</button>
        `;
        playersList.appendChild(li);
    });
}

function deletePlayer(index) {
    if (confirm('确   要删除这名球员吗？')) {
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
    
    // 按技术等级排序
    players.sort((a, b) => b.skillLevel - a.skillLevel);
    
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
            li.textContent = `${player.name} - 位置: ${player.positions.join(' > ')} 
                (年龄: ${player.age}, 惯用脚: ${player.preferredFoot}, 技术等级: ${player.skillLevel})`;
            ul.appendChild(li);
        });
        
        teamsContainer.appendChild(teamDiv);
    });
} 