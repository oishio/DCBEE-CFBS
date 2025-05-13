// 初始化 Firebase
const firebaseConfig = {
    // ... 现有配置 ...
};

// 初始化数据库引用
window.database = window.firebase.database();

// 检查数据库连接和权限
const dbRef = window.firebaseFunctions.ref(window.database, 'signups');
dbRef.once('value')
    .then(snapshot => {
        console.log('数据库连接正常');
        if (snapshot.exists()) {
            console.log('历史数据存在');
        } else {
            console.log('暂无历史数据');
        }
    })
    .catch(err => {
        console.error('数据库访问错误:', err);
    });

// 添加数据库错误处理
window.database.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
        console.log('已连接到数据库');
    } else {
        console.log('数据库连接断开');
    }
});