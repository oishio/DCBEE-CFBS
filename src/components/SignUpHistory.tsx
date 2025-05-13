import React, { useState, useEffect } from 'react';
import { database } from '../firebase';

interface PlayerRecord {
    name: string;
    playerName?: string;
    trainingDate: string;
    skillLevel: number;
    age: number;
    experience: number;
    position1: string;
    signUpTime: string;
    lastUpdate?: string;
}

export const SignUpHistory: React.FC = () => {
    const [playerHistory, setPlayerHistory] = useState<PlayerRecord[]>([]);
    const [error, setError] = useState<string>('');
    
    useEffect(() => {
        loadPlayerHistory();
    }, []);
    
    const loadPlayerHistory = async () => {
        try {
            const historySnapshot = await database.ref('signups').once('value');
            const historyData = historySnapshot.val() || {};
            
            // 将所有记录展平到一个数组中
            const allRecords: PlayerRecord[] = [];
            
            Object.entries(historyData).forEach(([date, players]: [string, any]) => {
                Object.entries(players).forEach(([playerId, playerData]: [string, any]) => {
                    allRecords.push({
                        ...playerData,
                        trainingDate: date,
                        signUpTime: playerData.signUpTime || new Date().toISOString()
                    });
                });
            });
            
            // 按日期倒序排序
            allRecords.sort((a, b) => new Date(b.trainingDate) - new Date(a.trainingDate));
            
            setPlayerHistory(allRecords);
            setError('');
        } catch (error) {
            console.error('加载历史记录失败:', error);
            setError('加载历史记录失败，请重试 / Fehler beim Laden der Historie, bitte versuchen Sie es erneut');
        }
    };
    
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
        });
    };
    
    if (error) {
        return <div className="error-message">{error}</div>;
    }
    
    return (
        <div className="player-history">
            <h3>球员数据记录 / Spielerdaten</h3>
            <div className="history-table">
                <table>
                    <thead>
                        <tr>
                            <th>训练日期 / Training</th>
                            <th>姓名 / Name</th>
                            <th>技术等级 / Level</th>
                            <th>年龄 / Alter</th>
                            <th>球龄 / Erfahrung</th>
                            <th>位置 / Position</th>
                            <th>报名时间 / Anmeldezeit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {playerHistory.map((record, index) => (
                            <tr key={index}>
                                <td>{formatDate(record.trainingDate)}</td>
                                <td>{record.name || record.playerName}</td>
                                <td>{record.skillLevel}</td>
                                <td>{record.age}</td>
                                <td>{record.experience}</td>
                                <td>{record.position1}</td>
                                <td>{formatDate(record.signUpTime)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}; 