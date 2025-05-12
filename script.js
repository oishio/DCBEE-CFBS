// 生成分组
async function generateTeams() {
    const groupType = document.getElementById('generateTeams').value;
    if (!groupType) return;

    try {
        const players = await getPlayers();
        if (players.length < 8) {
            alert('报名人数不足，无法进行分组 / Nicht genügend Spieler für die Teamerstellung');
            return;
        }

        // 计算每个队伍需要的球员数量
        const playersPerTeam = parseInt(groupType);
        const numTeams = Math.floor(players.length / playersPerTeam);
        const remainingPlayers = players.length % playersPerTeam;

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

