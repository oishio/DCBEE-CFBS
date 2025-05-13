// 初始化 Firebase
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
if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
}

// 初始化数据库引用
window.database = window.firebase.database();
window.firebaseFunctions = window.firebase.database;

// 检查数据库连接状态
const connectedRef = window.database.ref('.info/connected');
connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
        console.log('Firebase数据库连接成功');
    } else {
        console.error('Firebase数据库未连接');
    }
});

// 检查数据库和权限
async function initializeDatabase() {
    try {
        // 等待连接建立
        await new Promise((resolve, reject) => {
            const connectedRef = window.firebaseFunctions.ref(window.database, '.info/connected');
            connectedRef.on('value', (snap) => {
                if (snap.val() === true) {
                    console.log('Firebase数据库连接成功');
                    resolve();
                } else {
                    console.error('Firebase数据库未连接');
                    reject(new Error('数据库连接失败'));
                }
            });
        });

        // 检查数据访问权限
        const dbRef = window.firebaseFunctions.ref(window.database, 'signups');
        const snapshot = await window.firebaseFunctions.get(dbRef);
        console.log('数据库访问权限正常');
        if (snapshot.exists()) {
            console.log('历史数据存在');
        } else {
            console.log('暂无历史数据');
        }
    } catch (error) {
        console.error('数据库初始化错误:', error);
        // 添加重试逻辑
        setTimeout(initializeDatabase, 3000);
    }
}

// 启动初始化
initializeDatabase();

// 添加自动重连机制
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

window.database.ref('.info/connected').on('value', (snap) => {
    if (!snap.val() && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`尝试重新连接数据库 (${reconnectAttempts}/${maxReconnectAttempts})`);
        setTimeout(() => {
            window.database.goOnline();
            if (reconnectAttempts === maxReconnectAttempts) {
                console.error('数据库重连失败，请刷新页面');
                alert('数据库连接失败，请刷新页面重试 / Datenbankverbindung fehlgeschlagen, bitte Seite neu laden');
            }
        }, 1000 * reconnectAttempts);
    } else if (snap.val()) {
        reconnectAttempts = 0;
    }
});