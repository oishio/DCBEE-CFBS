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
    
    useEffect(() => {
        loadPlayerHistory();
    }, []);
    
    const loadPlayerHistory = async () => {
        try {
            const historySnapshot = await database.ref('signUpHistory').once('value');
            const historyData = historySnapshot.val() || {};
            
            // 按球员分组并获取最新记录
            const latestRecords = new Map<string, PlayerRecord>();
            
            Object.values(historyData).forEach((record: PlayerRecord) => {
                const playerName = record.name || record.playerName;
                const existingRecord = latestRecords.get(playerName);
                
                if (!existingRecord || new Date(record.signUpTime) > new Date(existingRecord.signUpTime)) {
                    latestRecords.set(playerName, {
                        ...record,
                        lastUpdate: record.signUpTime
                    });
                }
            });
            
            setPlayerHistory(Array.from(latestRecords.values()));
        } catch (error) {
            console.error('加载历史记录失败:', error);
        }
    };
    
    const formatLastUpdate = (date: string) => {
        const updateDate = new Date(date);
        return updateDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };
    
    return (
        <div className="player-history">
            <h3>球员数据记录 / Spielerdaten</h3>
            <div className="history-table">
                <table>
                    <thead>
                        <tr>
                            <th>姓名 / Name</th>
                            <th>技术等级 / Level</th>
                            <th>年龄 / Alter</th>
                            <th>球龄 / Erfahrung</th>
                            <th>位置 / Position</th>
                            <th>最后更新 / Letzte Aktualisierung</th>
                        </tr>
                    </thead>
                    <tbody>
                        {playerHistory.map((record, index) => (
                            <tr key={index}>
                                <td>{record.name || record.playerName}</td>
                                <td>{record.skillLevel}</td>
                                <td>{record.age}</td>
                                <td>{record.experience}</td>
                                <td>{record.position1}</td>
                                <td>{formatLastUpdate(record.lastUpdate || record.signUpTime)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}; 