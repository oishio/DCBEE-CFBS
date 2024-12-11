<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="足球报名和自动组队系统">
    <title>DCBEE-CFBS足球报名系统</title>
    <link rel="stylesheet" href="styles.css">
    <meta name="force-deploy" content="2024">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js"></script>
</head>
<body>
    <div class="container">
        <h1>DCBEE-CFBS足球报名系统</h1>
        
        <div class="description">
            <p>欢迎使用足球报名系统！请填写以下信息进行报名：</p>
            <div class="schedule-info">
                <h3>训练时间和地点：</h3>
                <div class="date-select">
                    <select id="trainingDate" required>
                        <option value="">选择训练日期</option>
                        <!-- 选项将由 JavaScript 动态生成 -->
                    </select>
                </div>
                <div class="schedule-grid">
                    <div class="schedule-item" id="wednesdaySession">
                        <h4>周三晚场</h4>
                        <p>时间：20:00 - 22:00</p>
                        <p>地点：Franz-Liszt-Strasse 37, 38126, BS</p>
                    </div>
                    <div class="schedule-item" id="saturdaySession">
                        <h4>周六傍晚场</h4>
                        <p>时间：18:00 - 20:00</p>
                        <p>地点：Beethovenstrasse 16, 38106, BS</p>
                    </div>
                </div>
            </div>
            <ul>
                <li>姓名：请填写您的真实姓名</li>
                <li>位置：选择您最擅长的场上位置</li>
                <li>技术等级：请按1-10评估自己的技术水平</li>
            </ul>
        </div>
        
        <div class="registration-form">
            <h2>球员报名</h2>
            <form id="playerForm">
                <input type="text" id="playerName" placeholder="姓名" required>
                
                <div class="positions-container">
                    <label>位置选择（按优先级排序）：</label>
                    <div class="position-select">
                        <select id="position1" required>
                            <option value="">首选位置</option>
                            <optgroup label="5人制">
                                <option value="striker">前锋(ST)</option>
                                <option value="winger">边锋(LW/RW)</option>
                                <option value="pivot">中场(MF)</option>
                                <option value="defender">后卫(DF)</option>
                                <option value="goalkeeper">守门员(GK)</option>
                            </optgroup>
                            <optgroup label="6人制">
                                <option value="striker6">前锋(ST)</option>
                                <option value="winger6">边锋(LW/RW)</option>
                                <option value="midfielder6">中场(MF)</option>
                                <option value="defender6">后卫(DF)</option>
                                <option value="sweeper6">清道夫(SW)</option>
                                <option value="goalkeeper6">守门员(GK)</option>
                            </optgroup>
                        </select>
                        <select id="position2" required>
                            <option value="">次选位置</option>
                            <optgroup label="5人制">
                                <option value="striker">前锋(ST)</option>
                                <option value="winger">边锋(LW/RW)</option>
                                <option value="pivot">中场(MF)</option>
                                <option value="defender">后卫(DF)</option>
                                <option value="goalkeeper">守门员(GK)</option>
                            </optgroup>
                            <optgroup label="6人制">
                                <option value="striker6">前锋(ST)</option>
                                <option value="winger6">边锋(LW/RW)</option>
                                <option value="midfielder6">中场(MF)</option>
                                <option value="defender6">后卫(DF)</option>
                                <option value="sweeper6">清道夫(SW)</option>
                                <option value="goalkeeper6">守门员(GK)</option>
                            </optgroup>
                        </select>
                        <select id="position3">
                            <option value="">备选位置（可选）</option>
                            <optgroup label="5人制">
                                <option value="striker">前锋(ST)</option>
                                <option value="winger">边锋(LW/RW)</option>
                                <option value="pivot">中场(MF)</option>
                                <option value="defender">后卫(DF)</option>
                                <option value="goalkeeper">守门员(GK)</option>
                            </optgroup>
                            <optgroup label="6人制">
                                <option value="striker6">前锋(ST)</option>
                                <option value="winger6">边锋(LW/RW)</option>
                                <option value="midfielder6">中场(MF)</option>
                                <option value="defender6">后卫(DF)</option>
                                <option value="sweeper6">清道夫(SW)</option>
                                <option value="goalkeeper6">守门员(GK)</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                <input type="number" id="age" placeholder="年龄" min="15" max="60" required>
                <input type="number" id="experience" placeholder="球龄（年）" min="0" max="40" required>
                <select id="preferredFoot" required>
                    <option value="">惯用脚</option>
                    <option value="left">左脚</option>
                    <option value="right">右脚</option>
                    <option value="both">双脚</option>
                </select>
                <input type="number" id="skillLevel" placeholder="技术等级 (1-10)" min="1" max="10" required>
                <button type="submit">报名</button>
            </form>
        </div>

        <div class="registered-players">
            <h2>已报名球员</h2>
            <ul id="playersList"></ul>
        </div>

        <button id="generateTeams" class="generate-btn">自动分队</button>

        <div class="teams">
            <div class="team" id="team1">
                <h3>队伍一</h3>
                <ul></ul>
            </div>
            <div class="team" id="team2">
                <h3>队伍二</h3>
                <ul></ul>
            </div>
        </div>

        <div class="stats-section">
            <h2>球员统计</h2>
            <div class="stats-container">
                <div class="chart-container">
                    <canvas id="positionChart"></canvas>
                </div>
                <div class="stats-controls">
                    <button id="exportBtn" class="export-btn">导出报名表</button>
                    <div class="filter-container">
                        <select id="positionFilter">
                            <option value="">全部位置</option>
                            <optgroup label="5人制">
                                <option value="striker">前锋(ST)</option>
                                <option value="winger">边锋(LW/RW)</option>
                                <option value="pivot">中场(MF)</option>
                                <option value="defender">后卫(DF)</option>
                                <option value="goalkeeper">守门员(GK)</option>
                            </optgroup>
                            <optgroup label="6人制">
                                <option value="striker6">前锋(ST)</option>
                                <option value="winger6">边锋(LW/RW)</option>
                                <option value="midfielder6">中场(MF)</option>
                                <option value="defender6">后卫(DF)</option>
                                <option value="sweeper6">清道夫(SW)</option>
                                <option value="goalkeeper6">守门员(GK)</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
    <script src="script.js"></script>
</body>
</html> 