import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/useApp';
import { QUICK_CHAT_PROMPTS } from '../../constants';
import type { ChatMessage } from '../../types';

interface ChatCopilotProps {
  projectId: string;
  projectGoal: string;
}

export function ChatCopilot({ projectId, projectGoal }: ChatCopilotProps) {
  const { chatMessages, sendChatMessage, isAiTyping, user } = useApp();
  const [chatInput, setChatInput] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  useEffect(() => { setAvatarError(false); }, [user?.avatarUrl]);

  const messages = chatMessages[projectId] || [];

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  const welcomeMsg: ChatMessage = {
    id: 'welcome',
    text: "Hello! I am your CampaignForge strategy co-pilot. I can help you draft content, adjust priorities, create tasks, or brainstorm new ideas for your campaign. What would you like to work on?",
    isUser: false,
    timestamp: '',
  };

  const displayMessages = messages.length > 0 ? messages : [welcomeMsg];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-14.5rem)]">
      <div className="lg:col-span-3 flex flex-col h-full bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-black/5 bg-[#ECEAE3]/30 flex justify-between items-center text-xs">
          <span className="font-bold font-mono text-neutral-700">STRATEGY CO-PILOT ACTIVE</span>
          <span className="flex items-center gap-1.5 font-bold font-mono text-[#2D6A4F]">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" /> ONLINE
          </span>
        </div>
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {displayMessages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3.5 ${msg.isUser ? 'flex-row-reverse' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-neutral-900/10 text-neutral-800 text-[10px] font-black flex items-center justify-center shrink-0 overflow-hidden">
                {msg.isUser && user?.avatarUrl && !avatarError ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                ) : msg.isUser ? userInitial : 'CF'}
              </div>
              <div className={`max-w-[70%] rounded-2xl p-4 text-xs font-sans leading-relaxed ${
                msg.isUser ? 'bg-[#1A1A1A] text-[#E8E6E0] rounded-tr-none' : 'bg-[#F0EEE8]/60 text-neutral-800 border border-black/5 rounded-tl-none font-medium'
              }`}>
                {msg.text.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{line}</p>)}
              </div>
            </div>
          ))}
          {isAiTyping && (
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-neutral-900/10 text-[10px] font-black flex items-center justify-center shrink-0 animate-pulse">CF</div>
              <div className="bg-[#F0EEE8]/60 border border-black/5 rounded-2xl rounded-tl-none p-4 text-xs">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>
        <div className="p-3 bg-neutral-50/50 border-t border-black/5 flex items-center gap-2">
          <input type="text" maxLength={2000} placeholder="Ask me to 'draft a post', 'recommend copy ideas', or 'create a new task'..."
            value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { sendChatMessage(projectId, chatInput); setChatInput(''); } }}
            className="flex-1 bg-white border border-black/10 focus:border-black/30 focus:ring-0 rounded-full h-10 px-4 text-xs outline-none transition-all" />
          <button onClick={() => { sendChatMessage(projectId, chatInput); setChatInput(''); }}
            disabled={!chatInput.trim()}
            className="h-10 px-5 bg-[#1A1A1A] hover:bg-neutral-800 disabled:opacity-40 text-white rounded-full text-xs font-mono font-bold tracking-wider uppercase cursor-pointer transition-all shrink-0">
            Send
          </button>
        </div>
      </div>
      <div className="hidden lg:flex flex-col bg-[#ECEAE3]/30 border border-black/5 p-5 rounded-2xl h-full space-y-6">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-bold">WORKSPACE OBJECTIVE</span>
          <p className="text-xs text-neutral-600 font-sans leading-relaxed mt-2 font-semibold">"{projectGoal}"</p>
        </div>
        <div className="border-t border-black/5 pt-4 space-y-3">
          <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-bold block">QUICK PROMPTS</span>
          <div className="flex flex-col gap-2">
            {QUICK_CHAT_PROMPTS.map((promptText, idx) => (
              <button key={idx} onClick={() => setChatInput(promptText)}
                className="text-left text-xs text-neutral-500 hover:text-black hover:underline font-medium flex items-center gap-1">
                → {promptText}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
