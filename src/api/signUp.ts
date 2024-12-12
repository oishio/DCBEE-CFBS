import axios from 'axios';

export const getSignUpHistory = async (userId: string) => {
  try {
    const response = await axios.get(`/api/signup/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('获取报名历史记录失败:', error);
    throw error;
  }
}; 