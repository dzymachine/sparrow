import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const AgentMemoryContext = createContext(null);

export function AgentMemoryProvider({ children }) {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [agentMemory, setAgentMemory] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync user profile and agent memory whenever user logs in or switches
  useEffect(() => {
    if (!currentUser?.uid) {
      setProfile(null);
      setAgentMemory(null);
      setChatMessages([]);
      return;
    }

    let isMounted = true;
    async function loadData() {
      setIsSyncing(true);
      try {
        // Fetch Profile
        try {
          const profileRes = await api.getUserProfile(currentUser.uid);
          if (isMounted && profileRes.profile) {
            setProfile(profileRes.profile);
          }
        } catch (e) {
          console.log('No prior profile found on backend, will initialize on onboarding.');
        }

        // Fetch Agent Memory
        try {
          const memoryRes = await api.getAgentMemory(currentUser.uid);
          if (isMounted && memoryRes.memory) {
            setAgentMemory(memoryRes.memory);
          }
        } catch (e) {
          console.log('No existing agent memory found.');
        }

        // Fetch Chat History
        try {
          const chatRes = await api.getChatHistory(currentUser.uid);
          if (isMounted && chatRes.history && chatRes.history.length > 0) {
            setChatMessages(chatRes.history);
          } else if (isMounted) {
            // Default warm welcome greeting from Ruth AI
            setChatMessages([
              {
                sender: 'agent',
                text: `Hello ${currentUser.displayName || 'there'}. I am Ruth, your private financial discovery companion. Whatever your situation is, you do not have to figure this out alone. You can upload documents to your vault, ask me anything about your rights, or run a 5-year post-divorce budget simulation.`,
                timestamp: new Date().toISOString()
              }
            ]);
          }
        } catch (e) {
          console.log('Defaulting to initial welcome message.');
        }
      } catch (err) {
        console.error('Error syncing agent memory data:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [currentUser?.uid]);

  // Save onboarding answers
  const saveOnboardingProfile = async (data) => {
    if (!currentUser?.uid) return;
    setIsSyncing(true);
    try {
      const res = await api.saveUserProfile(currentUser.uid, {
        email: currentUser.email,
        displayName: currentUser.displayName,
        ...data
      });
      setProfile(res.profile);

      // Re-fetch updated agent memory
      const memRes = await api.getAgentMemory(currentUser.uid);
      if (memRes.memory) {
        setAgentMemory(memRes.memory);
      }
      return res.profile;
    } finally {
      setIsSyncing(false);
    }
  };

  // Add discovered asset to memory
  const addDiscoveredAsset = async (asset) => {
    if (!currentUser?.uid) return;
    const currentAssets = agentMemory?.discoveredAssets || [];
    const updatedAssets = [...currentAssets, { ...asset, id: 'ast-' + Date.now() }];
    
    const res = await api.updateAgentMemory(currentUser.uid, {
      discoveredAssets: updatedAssets
    });
    setAgentMemory(res.memory);
  };

  // Send message to Ruth AI
  const sendMessage = async (text) => {
    if (!currentUser?.uid || !text.trim()) return;

    // Optimistically update UI
    const userMsg = { sender: 'user', text, timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.sendAgentMessage(currentUser.uid, text);
      if (res.messageRecord) {
        setChatMessages((prev) => [...prev, res.messageRecord]);
      }
    } catch (err) {
      console.error('Failed to send message to agent:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: "I'm having a brief issue reaching the server, but your query is noted. Make sure your local Node server is running on port 5001.",
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const value = {
    profile,
    agentMemory,
    chatMessages,
    isSyncing,
    saveOnboardingProfile,
    addDiscoveredAsset,
    sendMessage
  };

  return (
    <AgentMemoryContext.Provider value={value}>
      {children}
    </AgentMemoryContext.Provider>
  );
}

export function useAgentMemory() {
  return useContext(AgentMemoryContext);
}
