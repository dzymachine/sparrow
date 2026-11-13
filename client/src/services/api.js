const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // User Profile
  async getUserProfile(userId) {
    const res = await fetch(`${API_BASE}/user/profile/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async saveUserProfile(userId, profileData) {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...profileData }),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
  },

  // Agent Memory
  async getAgentMemory(userId) {
    const res = await fetch(`${API_BASE}/agent/memory/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch agent memory');
    return res.json();
  },

  async updateAgentMemory(userId, memoryUpdates) {
    const res = await fetch(`${API_BASE}/agent/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...memoryUpdates }),
    });
    if (!res.ok) throw new Error('Failed to update agent memory');
    return res.json();
  },

  // Agent Chat
  async getChatHistory(userId) {
    const res = await fetch(`${API_BASE}/agent/chat/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  async sendAgentMessage(userId, message) {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message }),
    });
    if (!res.ok) throw new Error('Failed to send message to agent');
    return res.json();
  }
};
