import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Send, Paperclip, File, Image as ImageIcon, X } from 'lucide-react';

export default function DiscussionForum({ teamId }) {
  const { isDarkMode, discussions, employees, currentUser, addMessage } = useStore();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const teamMessages = discussions.filter(d => d.teamId === teamId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMessages]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    // Detect mention
    const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(mentionFilter)
  );

  const handleMentionSelect = (empName) => {
    const words = text.split(' ');
    words.pop(); // Remove the partial @mention
    const newText = [...words, `@${empName} `].join(' ');
    setText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (showMentions && filteredEmployees.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredEmployees.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredEmployees.length) % filteredEmployees.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleMentionSelect(filteredEmployees[mentionIndex].name);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select a file smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setAttachments([...attachments, {
        name: file.name,
        type: file.type,
        data: dataUrl
      }]);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;

    // Extract mentions
    const mentions = [];
    const words = text.split(' ');
    words.forEach(word => {
      if (word.startsWith('@')) {
        const username = word.slice(1);
        if (employees.some(e => e.name === username)) {
          mentions.push(username);
        }
      }
    });

    addMessage({
      teamId,
      sender: currentUser?.name || 'Unknown',
      text: text.trim(),
      mentions,
      attachments
    });

    setText('');
    setAttachments([]);
    setShowMentions(false);
  };

  const renderTextWithMentions = (text) => {
    return text.split(' ').map((word, i) => {
      if (word.startsWith('@') && employees.some(e => e.name === word.slice(1))) {
        return <span key={i} className="font-bold text-blue-500">{word} </span>;
      }
      return word + ' ';
    });
  };

  return (
    <div className={cn("flex flex-col h-[500px] rounded-3xl border shadow-sm transition-all duration-300", 
      isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
    )}>
      {/* Header */}
      <div className={cn("p-4 border-b font-bold", isDarkMode ? "border-slate-700/50 text-white" : "border-slate-200 text-slate-800")}>
        Team Discussion Forum
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {teamMessages.length === 0 ? (
          <div className={cn("text-center py-8 text-sm", isDarkMode ? "text-slate-500" : "text-slate-400")}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          teamMessages.map(msg => {
            const isMe = msg.sender === currentUser?.name;
            return (
              <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                <span className={cn("text-xs font-semibold mb-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                  {isMe ? 'You' : msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                <div className={cn("px-4 py-2.5 rounded-2xl", 
                  isMe 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : isDarkMode ? "bg-slate-700 text-slate-200 rounded-tl-none" : "bg-slate-100 text-slate-800 rounded-tl-none"
                )}>
                  {msg.text && <p className="whitespace-pre-wrap break-words text-sm">{renderTextWithMentions(msg.text)}</p>}
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att, idx) => (
                        <div key={idx} className={cn("flex flex-col rounded-xl overflow-hidden border", isMe ? "border-blue-500/50" : "border-slate-300 dark:border-slate-600")}>
                          {att.type.startsWith('image/') ? (
                            <img src={att.data} alt={att.name} className="max-w-full max-h-48 object-cover" />
                          ) : (
                            <div className={cn("flex items-center gap-2 p-3", isMe ? "bg-blue-700/50" : "bg-white dark:bg-slate-800")}>
                              <File className="w-5 h-5 shrink-0" />
                              <span className="text-xs font-medium truncate">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Attachments Preview Area */}
      {attachments.length > 0 && (
        <div className={cn("p-3 border-t flex gap-3 overflow-x-auto", isDarkMode ? "border-slate-700/50" : "border-slate-200")}>
          {attachments.map((att, idx) => (
            <div key={idx} className="relative group shrink-0">
              {att.type.startsWith('image/') ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                  <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={cn("w-16 h-16 rounded-lg border flex flex-col items-center justify-center p-1", isDarkMode ? "border-slate-600 bg-slate-700" : "border-slate-300 bg-slate-100")}>
                  <File className="w-6 h-6 mb-1 text-slate-500" />
                  <span className="text-[8px] truncate w-full text-center text-slate-500">{att.name}</span>
                </div>
              )}
              <button 
                onClick={() => removeAttachment(idx)}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className={cn("p-4 border-t relative", isDarkMode ? "border-slate-700/50" : "border-slate-200")}>
        {/* Mentions Popup */}
        {showMentions && filteredEmployees.length > 0 && (
          <div className={cn("absolute bottom-full mb-2 left-4 w-64 rounded-xl shadow-xl border overflow-hidden z-10", 
            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          )}>
            {filteredEmployees.map((emp, idx) => (
              <div 
                key={emp.id}
                onClick={() => handleMentionSelect(emp.name)}
                className={cn("px-4 py-2 text-sm cursor-pointer flex items-center gap-2", 
                  idx === mentionIndex ? (isDarkMode ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-600") : (isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-50")
                )}
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                  {emp.name.substring(0, 2).toUpperCase()}
                </div>
                {emp.name}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={cn("p-3 rounded-xl transition-colors shrink-0", isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... Use @ to mention someone"
            className={cn("flex-1 px-4 py-3 rounded-xl border outline-none transition-all duration-300 text-sm resize-none h-[46px] max-h-32",
              isDarkMode 
                ? "bg-slate-900/50 border-slate-700 text-slate-100 focus:border-blue-500" 
                : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
            )}
          />
          
          <button 
            onClick={handleSend}
            disabled={!text.trim() && attachments.length === 0}
            className="p-3 rounded-xl bg-blue-600 text-white disabled:opacity-50 transition-opacity shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
