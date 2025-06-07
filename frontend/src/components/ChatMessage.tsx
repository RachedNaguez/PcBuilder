
import React from 'react';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: number;
    text: string;
    isBot: boolean;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
        message.isBot 
          ? 'bg-gray-700 text-gray-100' 
          : 'bg-blue-600 text-white'
      }`}>
        <div className={`flex items-center gap-2 mb-2 text-xs ${
          message.isBot ? 'justify-start' : 'justify-end'
        }`}>
          {message.isBot ? (
            <>
              <Bot className="h-3 w-3" />
              <span>AI Assistant</span>
            </>
          ) : (
            <>
              <span>You</span>
              <User className="h-3 w-3" />
            </>
          )}
        </div>
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
