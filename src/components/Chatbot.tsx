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
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all z-50 border-2 border-white/20"
            aria-label="Open Chat Assistant"
          >
            <MessageSquare className="w-6 h-6" />
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
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed right-4 sm:right-6 bottom-6 w-[calc(100vw-32px)] sm:w-[380px] bg-surface rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-border flex flex-col overflow-hidden z-50 max-h-[calc(100vh-100px)]`}
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Aethelcare Assistant</h3>
                  <p className="text-[10px] text-primary-50 font-medium uppercase tracking-wider opacity-80">Always Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <div className="flex-1 p-4 overflow-y-auto bg-surface space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                          message.type === 'user' ? 'bg-primary/20 text-primary' : 'bg-green-100 text-green-600'
                        }`}>
                          {message.type === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          message.type === 'user' 
                            ? 'bg-primary text-white rounded-tr-sm' 
                            : 'bg-bg text-text-primary border border-border rounded-tl-sm'
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
                  <div className="px-4 pb-2 flex flex-wrap gap-2">
                    {['Pricing plans?', 'How to scan?', 'Contact Support'].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputValue(suggestion);
                          setTimeout(() => document.getElementById('chat-send-btn')?.click(), 50);
                        }}
                        className="px-3 py-1.5 bg-bg border border-border rounded-full text-xs font-semibold text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 bg-surface border-t border-border flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-bg border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  />
                  <button
                    id="chat-send-btn"
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
