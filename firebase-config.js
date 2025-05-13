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
window.firebase.initializeApp(firebaseConfig);

// 初始化数据库引用
window.database = window.firebase.database();
window.firebaseFunctions = window.firebase.database;

// 检查数据库连接状态
async function initializeDatabase() {
    try {
        // 等待连接建立
        await new Promise((resolve) => {
            const connectedRef = window.database.ref('.info/connected');
            connectedRef.on('value', (snap) => {
                if (snap.val() === true) {
                    console.log('Firebase数据库连接成功');
                    resolve();
                }
            });
        });

        // 测试数据访问
        const testRef = window.database.ref('signups');
        await testRef.once('value', (snapshot) => {
            console.log('数据库访问权限正常');
            console.log('数据状态:', snapshot.exists() ? '存在历史数据' : '暂无数据');
        });
        
        return true;
    } catch (error) {
        console.error('数据库初始化错误:', error);
        return false;
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
        setTimeout(() => {
            window.database.goOnline();
        }, 1000);
    } else if (snap.val()) {
        reconnectAttempts = 0;
    }
});