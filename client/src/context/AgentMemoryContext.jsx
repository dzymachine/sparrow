import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const AgentMemoryContext = createContext(null);

export function AgentMemoryProvider({ children }) {
  const { currentUser } = useAuth();
  const activeUserId = currentUser?.uid || 'guest-session';

  const [profile, setProfile] = useState(null);
  const [agentMemory, setAgentMemory] = useState(null);
  const [wikiData, setWikiData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingWiki, setIsUpdatingWiki] = useState(false);
  const [lastSavedFacts, setLastSavedFacts] = useState([]);
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);

  const toggleBuddyDrawer = useCallback(() => setIsBuddyOpen((prev) => !prev), []);
  const openBuddyDrawer = useCallback(() => setIsBuddyOpen(true), []);
  const closeBuddyDrawer = useCallback(() => setIsBuddyOpen(false), []);

  const refreshWiki = useCallback(async (uid = activeUserId) => {
    try {
      const wikiRes = await api.getWiki(uid);
      if (wikiRes?.wiki) {
        setWikiData(wikiRes.wiki);
      }
      return wikiRes?.wiki || null;
    } catch (e) {
      console.log('Unable to fetch personal wiki yet.');
      return null;
    }
  }, [activeUserId]);

  // Sync user profile, agent memory, wiki, and chat history whenever activeUserId changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsSyncing(true);
      try {
        if (currentUser?.uid) {
          try {
            const profileRes = await api.getUserProfile(currentUser.uid);
            if (isMounted && profileRes.profile) {
              setProfile(profileRes.profile);
            }
          } catch (e) {
            if (isMounted) setProfile(null);
          }

          try {
            const memoryRes = await api.getAgentMemory(currentUser.uid);
            if (isMounted && memoryRes.memory) {
              setAgentMemory(memoryRes.memory);
            }
          } catch (e) {
            if (isMounted) setAgentMemory(null);
          }
        } else {
          if (isMounted) {
            setProfile(null);
            setAgentMemory(null);
          }
        }

        // Load Personal LLM Wiki (works for both authenticated users and guest preview)
        try {
          const wikiRes = await api.getWiki(activeUserId);
          if (isMounted && wikiRes?.wiki) {
            setWikiData(wikiRes.wiki);
          }
        } catch (e) {
          console.log('No existing personal wiki found.');
        }

        // Fetch Chat History
        try {
          const chatRes = await api.getChatHistory(activeUserId);
          if (isMounted && chatRes.history && chatRes.history.length > 0) {
            setChatMessages(chatRes.history);
          } else if (isMounted) {
            const greetingName = currentUser?.displayName || 'there';
            setChatMessages([
              {
                sender: 'agent',
                text: `Hello ${greetingName}. I am Ruth, your private financial discovery companion. Whatever your situation is, you do not have to figure this out alone. Share anything you've discovered or ask a question—I'll organize key details into your Personal Wiki so you never have to repeat yourself.`,
                timestamp: new Date().toISOString()
              }
            ]);
          }
        } catch (e) {
          if (isMounted) {
            setChatMessages([
              {
                sender: 'agent',
                text: `Hello ${currentUser?.displayName || 'there'}. I am Ruth, your private financial discovery companion. How can I support you today?`,
                timestamp: new Date().toISOString()
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Error syncing agent memory data:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [activeUserId, currentUser?.uid, currentUser?.displayName]);

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

      const memRes = await api.getAgentMemory(currentUser.uid);
      if (memRes.memory) {
        setAgentMemory(memRes.memory);
      }
      await refreshWiki(currentUser.uid);
      return res.profile;
    } finally {
      setIsSyncing(false);
    }
  };

  // Add discovered asset to memory + wiki
  const addDiscoveredAsset = async (asset) => {
    if (!currentUser?.uid) return;
    const currentAssets = agentMemory?.discoveredAssets || [];
    const updatedAssets = [...currentAssets, { ...asset, id: 'ast-' + Date.now() }];

    const res = await api.updateAgentMemory(currentUser.uid, {
      discoveredAssets: updatedAssets
    });
    setAgentMemory(res.memory);

    await updateWikiSection('financial_footprint', {
      action: 'add',
      text: `${asset.name} (${asset.type})${asset.estimatedValue ? ` - Est. $${Number(asset.estimatedValue).toLocaleString()}` : ''}`,
      category: asset.type || 'Asset',
      source: asset.sourceDocument || 'Document Vault'
    });
  };

  // Update, add, or delete facts in a Personal Wiki section
  const updateWikiSection = async (section, payload) => {
    setIsUpdatingWiki(true);
    try {
      const res = await api.updateWiki(activeUserId, {
        section,
        ...payload
      });
      if (res?.wiki) {
        setWikiData(res.wiki);
      }
      return res;
    } finally {
      setIsUpdatingWiki(false);
    }
  };

  // Purge all Personal Wiki & conversation memory (CCPA compliance & safety)
  const purgeMemory = async () => {
    setIsUpdatingWiki(true);
    try {
      const res = await api.purgeWiki(activeUserId);
      if (res?.wiki) {
        setWikiData(res.wiki);
      }
      setLastSavedFacts([]);
      setChatMessages([
        {
          sender: 'agent',
          text: 'All of your Personal Wiki entries and conversation history have been permanently purged. We are starting with a clean slate whenever you are ready.',
          timestamp: new Date().toISOString()
        }
      ]);
      return res;
    } finally {
      setIsUpdatingWiki(false);
    }
  };

  // Send message to Ruth AI (dual-pass fact extraction + context-injected reply)
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text, timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsUpdatingWiki(true);

    try {
      const res = await api.sendAgentMessage(activeUserId, text);
      if (res.messageRecord) {
        setChatMessages((prev) => [...prev, res.messageRecord]);
      }
      if (res.wiki) {
        setWikiData(res.wiki);
      }
      if (Array.isArray(res.extractedFacts) && res.extractedFacts.length > 0) {
        setLastSavedFacts(res.extractedFacts);
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
    } finally {
      setIsUpdatingWiki(false);
    }
  };

  const value = {
    activeUserId,
    profile,
    agentMemory,
    wikiData,
    chatMessages,
    isSyncing,
    isUpdatingWiki,
    lastSavedFacts,
    isBuddyOpen,
    toggleBuddyDrawer,
    openBuddyDrawer,
    closeBuddyDrawer,
    saveOnboardingProfile,
    addDiscoveredAsset,
    updateWikiSection,
    purgeMemory,
    refreshWiki,
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
