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
        await new Promise((resolve, reject) => {
            const connectedRef = window.database.ref('.info/connected');
            let connectionAttempts = 0;
            let timeout;
            
            const checkConnection = (snap) => {
                if (snap.val() === true) {
                    clearTimeout(timeout);
                    console.log('Firebase数据库连接成功');
                    connectedRef.off('value', checkConnection);
                    resolve();
                } else {
                    connectionAttempts++;
                    console.log(`尝试连接数据库 (${connectionAttempts}/3)`);
                    if (connectionAttempts <= 3) {
                        window.database.goOnline();
                    } else {
                        clearTimeout(timeout);
                        console.log('使用备用连接方式');
                        resolve(); // 即使未连接也继续执行
                    }
                }
            };
            
            // 设置连接超时
            timeout = setTimeout(() => {
                connectedRef.off('value', checkConnection);
                console.log('连接超时，使用备用连接方式');
                resolve();
            }, 5000);
            
            connectedRef.on('value', checkConnection);
        });

        // 测试数据访问
        const testRef = window.database.ref('signups');
        const snapshot = await Promise.race([
            testRef.once('value'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('数据访问超时')), 3000))
        ]);
        
        console.log('数据库访问权限正常，', snapshot.exists() ? '历史数据存在' : '暂无数据');
        return true;
    } catch (error) {
        if (error.message === '数据访问超时') {
            console.warn('数据访问超时，将重试连接');
            setTimeout(initializeDatabase, 1000);
        } else {
            console.error('数据库初始化错误:', error);
        }
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