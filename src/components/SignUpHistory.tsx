import React, { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import firebase from 'firebase/app';
import 'firebase/database';

interface SignUpRecord {
  id: string;
  playerName: string;
  trainingDate: string;
  position1: string;
  position2: string;
  position3: string;
  signUpTime: string;
  status: string;
}

// 添加德语翻译映射
const translations = {
    history: {
        zh: '报名历史记录',
        de: 'Anmeldeverlauf'
    },
    totalPlayers: {
        zh: '共',
        de: 'Insgesamt'
    },
    registered: {
        zh: '人报名',
        de: 'Anmeldungen'
    },
    training: {
        zh: '训练',
        de: 'Training'
    },
    positions: {
        'striker': {
            zh: '前锋(ST)',
            de: 'Stürmer(ST)'
        },
        'winger': {
            zh: '边锋(LW/RW)',
            de: 'Flügel(LW/RW)'
        },
        'pivot': {
            zh: '中场(MF)',
            de: 'Mittelfeld(MF)'
        },
        'defender': {
            zh: '后卫(DF)',
            de: 'Verteidiger(DF)'
        },
        'goalkeeper': {
            zh: '守门员(GK)',
            de: 'Torwart(GK)'
        }
    }
};

// 修改显示函数
function formatDate(date: Date): string {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${translations.training.zh} / ` +
           `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${translations.training.de}`;
}

function formatPlayerCount(count: number): string {
    return `${translations.totalPlayers.zh} ${count} ${translations.registered.zh} / ` +
           `${translations.totalPlayers.de} ${count} ${translations.registered.de}`;
}

function getPositionName(pos: string): string {
    const position = translations.positions[pos];
    return position ? `${position.zh} / ${position.de}` : pos;
}

const SignUpHistory: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SignUpRecord[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const historyRef = firebase.database().ref('signUpHistory');
        const snapshot = await historyRef.once('value');
        const historyData = snapshot.val();
        
        const formattedData = Object.entries(historyData || {}).map(([id, record]: [string, any]) => ({
          id,
          ...record,
          // 格式化日期显示
          signUpTime: new Date(record.signUpTime).toLocaleString('zh-CN'),
        }));
        
        setData(formattedData);
      } catch (error) {
        message.error('获取历史记录失败');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const columns: ColumnsType<SignUpRecord> = [
    {
      title: '姓名',
      dataIndex: 'playerName',
      key: 'playerName',
    },
    {
      title: '训练日期',
      dataIndex: 'trainingDate',
      key: 'trainingDate',
    },
    {
      title: '首选位置',
      dataIndex: 'position1',
      key: 'position1',
    },
    {
      title: '次选位置',
      dataIndex: 'position2',
      key: 'position2',
    },
    {
      title: '报名时间',
      dataIndex: 'signUpTime',
      key: 'signUpTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    }
  ];

  return (
    <div className="history-section">
      <h2>{translations.history.zh} / {translations.history.de}</h2>
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default SignUpHistory; 