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
        // 先确保数据库在线
        window.database.goOnline();
        
        // 等待连接建立
        await new Promise((resolve) => {
            const connectedRef = window.database.ref('.info/connected');
            let isResolved = false;
            
            const checkConnection = (snap) => {
                if (snap.val() === true && !isResolved) {
                    isResolved = true;
                    console.log('Firebase数据库连接成功');
                    resolve();
                }
            };
            
            // 如果3秒内没有连接成功，也继续执行
            setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    resolve();
                }
            }, 3000);
            
            connectedRef.on('value', checkConnection);
        });

        // 测试数据访问
        const testRef = window.database.ref('signups');
        const snapshot = await testRef.once('value');
        console.log('数据库访问正常，', snapshot.exists() ? '历史数据存在' : '暂无数据');
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
        window.database.goOnline();
    } else if (snap.val()) {
        reconnectAttempts = 0;
    }
});