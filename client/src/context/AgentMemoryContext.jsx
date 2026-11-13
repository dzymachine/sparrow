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
  const [divorceChecklist, setDivorceChecklist] = useState(null);
  const [lifeProjection, setLifeProjection] = useState(null);
  const [isCalculatingProjection, setIsCalculatingProjection] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingWiki, setIsUpdatingWiki] = useState(false);
  const [lastSavedFacts, setLastSavedFacts] = useState([]);
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);

  const toggleBuddyDrawer = useCallback(() => setIsBuddyOpen((prev) => !prev), []);
  const openBuddyDrawer = useCallback(() => setIsBuddyOpen(true), []);
  const closeBuddyDrawer = useCallback(() => setIsBuddyOpen(false), []);

  const refreshChecklist = useCallback(async (uid = activeUserId) => {
    try {
      const res = await api.getDivorceChecklist(uid);
      if (res?.checklist) {
        setDivorceChecklist(res.checklist);
      }
      return res?.checklist || null;
    } catch (e) {
      console.log('Unable to fetch divorce document checklist yet.');
      return null;
    }
  }, [activeUserId]);

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

  const refreshLifeProjection = useCallback(async (uid = activeUserId) => {
    setIsCalculatingProjection(true);
    try {
      const res = await api.getLifeProjection(uid);
      if (res?.projection) {
        setLifeProjection(res.projection);
      }
      return res?.projection || null;
    } catch (e) {
      console.log('Unable to calculate post-divorce projection yet.');
      return null;
    } finally {
      setIsCalculatingProjection(false);
    }
  }, [activeUserId]);

  const refreshAllMemory = useCallback(async (uid = activeUserId) => {
    const tasks = [refreshWiki(uid), refreshLifeProjection(uid)];
    if (currentUser?.uid) {
      tasks.push(
        api.getAgentMemory(uid).then((r) => {
          if (r?.memory) setAgentMemory(r.memory);
        }).catch(() => {})
      );
      tasks.push(
        api.getUserProfile(uid).then((r) => {
          if (r?.profile) setProfile(r.profile);
        }).catch(() => {})
      );
    }
    await Promise.all(tasks);
  }, [activeUserId, currentUser?.uid, refreshWiki, refreshLifeProjection]);

  const saveLifeProjectionInputs = useCallback(async (inputs, uid = activeUserId) => {
    setIsCalculatingProjection(true);
    try {
      const res = await api.saveLifeProjectionInputs(uid, inputs);
      if (res?.profile) {
        setProfile(res.profile);
      }
      if (res?.projection) {
        setLifeProjection(res.projection);
      }
      await refreshWiki(uid);
      return res?.projection || null;
    } finally {
      setIsCalculatingProjection(false);
    }
  }, [activeUserId, refreshWiki]);

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

        // Load tailored Divorce Document Checklist
        try {
          const checklistRes = await api.getDivorceChecklist(activeUserId);
          if (isMounted && checklistRes?.checklist) {
            setDivorceChecklist(checklistRes.checklist);
          }
        } catch (e) {
          console.log('Unable to load divorce checklist yet.');
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
                text: `Hey ${greetingName}! I'm Finch, your financial buddy here. Share any accounts, questions, or details—I'll keep track of them so you never have to repeat yourself.`,
                timestamp: new Date().toISOString()
              }
            ]);
          }
        } catch (e) {
          if (isMounted) {
            setChatMessages([
              {
                sender: 'agent',
                text: `Hey ${currentUser?.displayName || 'there'}! I'm Finch, your financial buddy. What's on your mind today?`,
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
      if (res.checklist) {
        setDivorceChecklist(res.checklist);
      } else {
        await refreshChecklist(currentUser.uid);
      }

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

  // Update a document item's status or notes in the Divorce Document Checklist
  const updateDocumentChecklistItem = async (docId, updates) => {
    try {
      const res = await api.updateChecklistItem(activeUserId, docId, updates);
      if (res?.checklist) {
        setDivorceChecklist(res.checklist);
      }
      return res?.checklist || null;
    } catch (err) {
      console.error('Failed to update document checklist item:', err);
      return null;
    }
  };

  // Upload an already-completed document for a checklist item
  const uploadCompletedChecklistDoc = async (docId, file) => {
    const dataBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await api.uploadChecklistDocument(activeUserId, docId, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/pdf',
      dataBase64
    });
    if (res?.checklist) {
      setDivorceChecklist(res.checklist);
    }
    return res;
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
          text: 'All cleared! Everything we talked about is wiped—fresh start whenever you\'re ready.',
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
    divorceChecklist,
    lifeProjection,
    isCalculatingProjection,
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
    refreshChecklist,
    refreshLifeProjection,
    refreshAllMemory,
    saveLifeProjectionInputs,
    updateDocumentChecklistItem,
    uploadCompletedChecklistDoc,
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
