import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
}

const FAQ_KNOWLEDGE = [
  {
    keywords: ['price', 'cost', 'subscription', 'premium', 'plan', 'pay', 'free'],
    answer: "Aethelcare offers a Free plan with basic features, and a Premium plan at ₹99/month (or ₹699/year) which includes unlimited AI scans, advanced medicine comparisons, and priority support. You can check the 'Plans' page for more details."
  },
  {
    keywords: ['contact', 'email', 'support', 'help', 'reach'],
    answer: "You can reach out to our support team via the 'Contact' page, or email us directly at hello@aethelcare.xyz. We're here to help!"
  },
  {
    keywords: ['ban', 'banned', 'cdsco', 'illegal', 'prohibited'],
    answer: "We use the official CDSCO registry to check if a medicine is banned in India. You can search any medicine or visit the 'Banned Drugs' section to see the full list."
  },
  {
    keywords: ['scan', 'camera', 'photo', 'image', 'upload'],
    answer: "You can use our Smart Scanner to take a photo of your medicine strip or upload an image. Our AI will instantly extract the text and provide safety information, usage, and side effects."
  },
  {
    keywords: ['compare', 'difference', 'better', 'vs'],
    answer: "Our Compare tool lets you pick two medicines and compares their active ingredients, uses, side effects, and precautions side-by-side to help you make an informed decision."
  },
  {
    keywords: ['language', 'translate', 'hindi', 'marathi', 'tamil', 'regional'],
    answer: "Aethelcare supports 23 languages, including all 22 scheduled Indian languages! You can change the app language using the globe icon in the navigation bar to read medical information in your preferred language."
  },
  {
    keywords: ['hi', 'hello', 'hey', 'start', 'greetings'],
    answer: "Hello! I am the Aethelcare Assistant. I can help answer questions about our features, subscription plans, banned drugs, and how to use the app. What would you like to know?"
  },
  {
    keywords: ['who are you', 'what are you', 'bot', 'artificial'],
    answer: "I am Aethelcare's built-in assistant. I'm here to guide you through the app, explain our features, and help you find information about medicines and your subscription."
  }
];

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      type: 'bot',
      text: 'Hi there! 👋 I am the Aethelcare Assistant. How can I help you today?'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    const event = new CustomEvent('chatbotStateChange', { detail: { isOpen } });
    window.dispatchEvent(event);
  }, [isOpen]);

  const generateResponse = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Simple keyword matching logic (No API key needed)
    let bestMatch = null;
    let maxMatches = 0;

    for (const faq of FAQ_KNOWLEDGE) {
      let matches = 0;
      for (const keyword of faq.keywords) {
        if (lowerInput.includes(keyword)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = faq;
      }
    }

    if (bestMatch) {
      return bestMatch.answer;
    }

    // Default fallback
    return "I'm not quite sure about that. Could you try rephrasing? I can tell you about our scanning features, premium plans, banned drugs list, or how to contact support.";
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate thinking delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: generateResponse(userMessage.text)
      };
      setMessages(prev => [...prev, botResponse]);
    }, 600);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={toggleChat}
            id="chatbot-trigger-step"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] text-white rounded-[1.5rem] shadow-[0_15px_40px_-10px_rgba(0,122,255,0.5)] flex items-center justify-center transition-all z-[92] border border-white/20 group"
            aria-label="Open Chat Assistant"
          >
            <div className="relative">
              <MessageSquare className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '580px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed right-4 md:right-6 bottom-24 md:bottom-6 w-[calc(100vw-32px)] md:w-[400px] bg-surface/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] border border-border/80 flex flex-col overflow-hidden z-[98] max-h-[calc(100vh-140px)]`}
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between shrink-0 border-b border-border/40 bg-surface/30">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-tr from-primary to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary tracking-tight">AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-80">Online & Ready</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors text-text-secondary"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-danger/10 hover:text-danger rounded-full transition-colors text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-hide">
                  <div className="text-center py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary/40">Encryption Enabled • HIPAA Compliant</p>
                  </div>
                  
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed ${
                          message.type === 'user' 
                            ? 'bg-primary text-white shadow-xl shadow-primary/20 rounded-tr-sm font-medium' 
                            : 'bg-bg dark:bg-slate-800 text-text-primary shadow-sm border border-border/40 rounded-tl-sm'
                        }`}>
                          {message.text}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {messages.length === 1 && (
                  <div className="px-6 pb-4 flex flex-wrap gap-2">
                    {['Pricing plans?', 'How to scan?', 'Is it safe?'].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputValue(suggestion);
                          setTimeout(() => document.getElementById('chat-send-btn')?.click(), 50);
                        }}
                        className="px-4 py-2 bg-surface/60 border border-border/60 rounded-full text-xs font-bold text-text-secondary hover:text-primary hover:border-primary/55 hover:bg-surface shadow-sm transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div className="p-6 bg-surface/30 border-t border-border/40 shrink-0">
                  <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask anything..."
                      className="w-full bg-bg dark:bg-slate-800 border border-border/80 rounded-2xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 shadow-inner transition-all text-text-primary placeholder:text-text-secondary/50 font-medium"
                    />
                    <button
                      id="chat-send-btn"
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="absolute right-2 w-10 h-10 bg-primary text-white rounded-[0.8rem] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-90 transition-all shadow-lg shadow-primary/20"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </form>
                  <p className="mt-3 text-[9px] text-center text-text-secondary/40 font-bold uppercase tracking-widest">Powered by Aethelcare AI • v2.4.0</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
