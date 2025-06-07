import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Power,
  Box,
  Fan,
  Monitor,
  MessageSquare,
  ArrowLeft,
  Server,
  Thermometer,
  Zap,
  MessageCircle,
  Send, ChevronRight,
  Layers,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import { chatService, ChatResponseData } from '@/lib/api';

type ComponentProperty = string | number | boolean | string[] | Record<string, unknown> | undefined;

interface BaseComponent {
  id: string | number;
  name: string;
  type: string;
  price: string | number;
  image?: string;
  specs?: string[];
  iconName?: string;
  [key: string]: ComponentProperty | React.ReactNode | undefined;
}

interface Component extends Omit<BaseComponent, 'iconName'> {
  icon?: React.ReactNode;
  delay?: number;
}

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}

const Index = () => {
  const [mode, setMode] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'build'>('chat');
  const [buildData, setBuildData] = useState<any | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [buildType, setBuildType] = useState<string>('gaming');
  const [messages, setMessages] = useState<Message[]>([
    { id: Date.now(), text: "Welcome to PC Builder! Would you like to discuss components or build a PC?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);
  const [showToast, setShowToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate total price helper function
  const calculateTotalPrice = (items: Component[]): number => {
    return items.reduce((sum, component) => {
      const price = typeof component.price === 'string'
        ? parseFloat(component.price.replace(/[^0-9.-]+/g, ''))
        : component.price;
      return sum + (isNaN(Number(price)) ? 0 : Number(price));
    }, 0);
  };

  const totalPrice = React.useMemo(() => calculateTotalPrice(components), [components]);

  const resetAll = () => {
    setMode(null);
    setView('chat');
    setSessionId(null);
    setBuildType('gaming');
    setMessages([
      { id: Date.now(), text: "Welcome to PC Builder! Would you like to discuss components or build a PC?", isBot: true }
    ]);
    setInput('');
    setBuildData(null);
    setComponents([]);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleView = () => {
    setView(view === 'chat' ? 'build' : 'chat');
  };

  const handleBackToOptions = () => {
    if (mode === null) {
      // Already at main screen, do nothing
      return;
    }
    
    if (view === 'chat' && messages.length > 1) {
      // If in chat view with messages, clear chat
      setMessages([
        { 
          id: Date.now(), 
          text: mode === 'build' 
            ? 'What kind of PC would you like to build? (e.g., gaming, work, budget)' 
            : 'What would you like to know about PC components?', 
          isBot: true 
        }
      ]);
    } else if (view === 'build') {
      // If in build view, go back to chat
      setView('chat');
    } else {
      // Go back to mode selection (main screen)
      setMode(null);
      setView('chat');
      setMessages([
        { 
          id: Date.now(), 
          text: 'Welcome to PC Builder! Would you like to discuss components or build a PC?', 
          isBot: true 
        }
      ]);
    }
  };

  const handleBuildWithBudget = (budget: number) => {
    setBuildType('custom');
    setMode('build');
    setView('build');
    handleBuildPC(budget);
  };

  type ComponentType = 'CPU' | 'GPU' | 'RAM' | 'Storage' | 'Motherboard' | 'PSU' | 'Case' | 'Cooler';

  const componentData: Record<ComponentType, {
    name: string;
    icon: React.ReactNode;
    color: string;
    gradient: string;
    description: string;
  }> = {
    'CPU': {
      name: 'Processor',
      icon: <Cpu className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      gradient: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
      description: 'The brain of your PC, handles all calculations'
    },
    'GPU': {
      name: 'Graphics Card',
      icon: <Monitor className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
      description: 'Renders graphics and handles visual processing'
    },
    'RAM': {
      name: 'Memory',
      icon: <MemoryStick className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      gradient: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
      description: 'Temporary storage for active tasks and applications'
    },
    'Storage': {
      name: 'Storage',
      icon: <HardDrive className="w-8 h-8" />,
      color: 'from-amber-500 to-yellow-500',
      gradient: 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10',
      description: 'SSD or HDD for storing your operating system and files'
    },
    'Motherboard': {
      name: 'Motherboard',
      icon: <Server className="w-8 h-8" />,
      color: 'from-red-500 to-orange-500',
      gradient: 'bg-gradient-to-br from-red-500/10 to-orange-500/10',
      description: 'The main circuit board connecting all components'
    },
    'PSU': {
      name: 'Power Supply',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-pink-500 to-rose-500',
      gradient: 'bg-gradient-to-br from-pink-500/10 to-rose-500/10',
      description: 'Provides power to all components in your system'
    },
    'Case': {
      name: 'PC Case',
      icon: <Box className="w-8 h-8" />,
      color: 'from-indigo-500 to-violet-500',
      gradient: 'bg-gradient-to-br from-indigo-500/10 to-violet-500/10',
      description: 'The enclosure that houses all your components'
    },
    'Cooler': {
      name: 'CPU Cooler',
      icon: <Thermometer className="w-8 h-8" />,
      color: 'from-cyan-500 to-blue-500',
      gradient: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10',
      description: 'Keeps your processor at optimal temperatures'
    }
  };

  const showBuildOptions = () => (
    <div className="flex flex-col items-center justify-start h-full min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 text-sm font-medium bg-purple-500/10 text-purple-400 rounded-full mb-4">
            PC Builder Assistant
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Build Your <span className="bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">Dream PC</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Select your budget and let our AI create the perfect build for your needs
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(componentData) as ComponentType[]).map((type) => {
                const component = componentData[type];
                return (
                  <div key={type}
                    className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 cursor-pointer border border-gray-700/50 hover:border-transparent ${component.gradient} hover:shadow-lg hover:shadow-${component.color.split(' ')[0]}/10`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${component.color}/20`}>
                          <div className={`text-${component.color.split(' ')[0]}`}>
                            {component.icon}
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-700/50 text-gray-300">
                          {type}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">{component.name}</h3>
                      <p className="text-sm text-gray-400 mb-4">{component.description}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-xs text-gray-400">Select your {type.toLowerCase()}</span>
                        <div className="p-1.5 rounded-lg bg-gray-700/50 group-hover:bg-gradient-to-r group-hover:from-transparent group-hover:to-transparent group-hover:bg-${component.color.split(' ')[0]}/10 transition-colors">
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-yellow-400" />
                Select Your Budget
              </h2>
              <p className="text-gray-400 mb-6">Choose a budget range that fits your needs</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[800, 1000, 1300, 1500, 2000, 2500].map((budget) => (
                    <div key={budget}
                      onClick={() => handleBuildWithBudget(budget)}
                      className="group relative bg-gray-700/50 hover:bg-gray-700/80 border border-gray-600/50 hover:border-purple-500/50 rounded-lg p-4 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xl font-bold text-white">${budget}</span>
                        <div className="mt-2 w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                               style={{ width: `${Math.min(100, (budget / 2500) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Build</h2>
              <div className="space-y-3">
                {(Object.keys(componentData) as ComponentType[]).map((type) => {
                  const component = componentData[type];
                  return (
                    <div key={type}
                         className="group flex items-center p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl transition-colors cursor-pointer">
                      <div className={`p-2 rounded-lg ${component.gradient}`}>
                        <div className={`text-${component.color.split(' ')[0]}`}>
                          {component.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 ml-3">
                        <p className="text-sm font-medium text-white truncate">{component.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {type === 'CPU' ? 'Select a processor' :
                           type === 'GPU' ? 'Select a graphics card' :
                           `Choose ${type.toLowerCase()}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Estimated Total:</span>
                  <span className="text-xl font-bold text-white">${totalPrice.toFixed(2)}</span>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all">
                  Generate Build
                </Button>
              </div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Need Help?</h2>
              <p className="text-sm text-gray-400 mb-4">
                Our AI assistant can help you choose the right components for your needs.
              </p>
              <Button onClick={() => setView('chat')} variant="outline"
                      className="w-full border-gray-600 hover:bg-gray-700/50 hover:border-purple-500/50 transition-colors">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Assistant
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <Button onClick={handleBackToOptions} variant="ghost"
                  className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );

  const getComponentIcon = (type: string): React.ReactNode => {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case "cpu": return <Cpu className="h-6 w-6" />;
      case "gpu": return <Monitor className="h-6 w-6" />;
      case "ram": return <MemoryStick className="h-6 w-6" />;
      case "storage": return <HardDrive className="h-6 w-6" />;
      case "psu": return <Power className="h-6 w-6" />;
      case "motherboard": return <Server className="h-6 w-6" />;
      case "cooler": return <Thermometer className="h-6 w-6" />;
      case "case fan": return <Fan className="h-6 w-6" />;
      case "case": return <Box className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || !mode) return;
    
    const userMessage = { id: Date.now(), text: message, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const buildMatch = input.match(/(build|create).*?(\$?\d{3,4}|\d{3,4}\s*\$)/i);
      const isBuildRequest = mode === 'build' || buildMatch;
      const response: ChatResponseData = await chatService.sendMessage({
        message: input,
        session_id: sessionId,
        mode: isBuildRequest ? 'build' : 'discuss'
      });
      if (response.session_id) setSessionId(response.session_id);
      if (response.type === 'build') {
        setBuildData(response.data);
        const componentsList = Array.isArray(response.data.components)
          ? response.data.components
          : Object.entries(response.data.components || {}).map(([type, details]: [string, any]) => ({
              ...details,
              type,
              icon: getComponentIcon(type),
            }));
        setComponents(componentsList);
        setView('build');
      }
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: response.content || (isBuildRequest ? 'Here\'s your PC build!' : 'Here\'s your response'),
        isBot: true
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Sorry, there was an error processing your request.',
        isBot: true
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, mode, sessionId]);

  const handleBuildPC = useCallback(async (budget?: number) => {
    if (!mode) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const budgetMessage = budget ? ` with a budget of $${budget}` : '';
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: `Building your ${buildType} PC${budgetMessage}...`,
      isBot: true
    }]);
    try {
      const response: ChatResponseData = await chatService.sendMessage({
        message: `Build me a ${buildType} PC${budget ? ` with a budget of $${budget}` : ''}`,
        session_id: sessionId,
        mode: 'build'
      });
      if (response.session_id) setSessionId(response.session_id);
      if (response.type === 'build') {
        setBuildData(response.data);
        const componentsList = Array.isArray(response.data.components)
          ? response.data.components
          : Object.entries(response.data.components || {}).map(([type, details]: [string, any]) => ({
              ...details,
              type,
              icon: getComponentIcon(type),
            }));
        setComponents(componentsList);
        setView('build');
      }
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: response.content || `Here's your ${buildType} PC build${budgetMessage}!`,
        isBot: true
      }]);
    } catch (error) {
      console.error('Error building PC:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Sorry, there was an error building your PC.',
        isBot: true
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [mode, buildType, sessionId]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const switchToMode = useCallback((newMode: string) => {
    setMode(newMode);
    setView('chat');
    setComponents([]);
    setBuildData(null);
    const welcomeMessage = newMode === 'build'
      ? 'What kind of PC would you like to build? (e.g., gaming, work, budget)'
      : 'What would you like to know about PC components?';
    setMessages([
      { id: Date.now(), text: welcomeMessage, isBot: true }
    ]);
  }, []);

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-purple-500/10 text-purple-400 rounded-full mb-4">
              AI-Powered PC Building Assistant
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Build Your Perfect <span className="bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">PC</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Get expert advice or let our AI create a custom build tailored to your needs and budget
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div
              onClick={() => switchToMode('discuss')}
              className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/50 rounded-2xl p-8 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-500/5 transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Discuss Components</h2>
                <p className="text-gray-400 mb-6">Get expert advice and answers to all your PC component questions</p>
                <div className="flex items-center justify-center text-blue-400 group-hover:translate-x-1 transition-transform duration-300">
                  <span className="font-medium">Start Chatting</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>
            <div
              onClick={() => setMode('build')}
              className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 rounded-2xl p-8 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-purple-500/5 transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Cpu className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Build a PC</h2>
                <p className="text-gray-400 mb-6">Get a custom PC build recommendation based on your needs and budget</p>
                <div className="flex items-center justify-center text-purple-400 group-hover:translate-x-1 transition-transform duration-300">
                  <span className="font-medium">Start Building</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              Powered by AI • 100% Free • No Registration Required
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'build' && view === 'build' && components.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <header className="bg-gray-800 p-4 flex items-center shadow-md">
          <Button variant="ghost" size="icon" onClick={handleBackToOptions}
                  className="text-gray-400 hover:text-white mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">PC Builder</h1>
          <Button variant="outline" size="sm" onClick={() => setView('chat')} className="ml-auto">
            <MessageCircle className="h-4 w-4 mr-2" /> Chat
          </Button>
        </header>
        {showBuildOptions()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700/50 p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={handleBackToOptions}
                className="text-gray-400 hover:bg-gray-700/50 hover:text-white mr-3 transition-all duration-200 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center">
          {mode === 'build' ? (
            <Cpu className="h-5 w-5 text-purple-400 mr-2" />
          ) : (
            <MessageSquare className="h-5 w-5 text-blue-400 mr-2" />
          )}
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-200 to-gray-400 text-transparent bg-clip-text">
            {mode === 'build' ? 'PC Builder' : 'Component Discussion'}
          </h1>
        </div>
        {mode === 'build' && (
          <Button variant={view === 'chat' ? 'default' : 'outline'} size="sm" onClick={toggleView}
                  className="ml-auto bg-gray-700/50 hover:bg-gray-600/50 border-gray-600/50 text-gray-200 hover:text-white transition-all duration-200 rounded-xl">
            {view === 'chat' ? (
              <>
                <Layers className="h-4 w-4 mr-2" />
                View Build
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                View Chat
              </>
            )}
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {view === 'build' && components.length > 0 ? (
          <div className="max-w-6xl mx-auto">
            <div className="text-center my-8">
              <h1 className="text-4xl font-bold text-white mb-2">Your Perfect PC Build</h1>
              <p className="text-lg text-gray-400">
                {buildType.charAt(0).toUpperCase() + buildType.slice(1)} Build - Total: <span
                className="text-green-400 font-semibold">${totalPrice.toFixed(2)}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {components.map((component: any, index: number) => (
                <div key={`${component.id || component.name}-${index}`}
                     className="bg-gray-800/70 border border-gray-700 rounded-xl p-5 shadow-md hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="mr-3">{component.icon}</div>
                    <h3 className="text-lg font-semibold text-white">{component.name}</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    {component.specs?.map((spec: string, i: number) => (
                      <li key={i}>{spec}</li>
                    ))}
                  </ul>
                  <div className="mt-4 text-green-400 font-bold">${component.price}</div>
                </div>
              ))}
            </div>
            <div className="text-center my-8">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(`PC Build Total: $${totalPrice.toFixed(2)}`);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                  setView('chat');
                  setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: `Okay, proceeding with the ${buildType} build totaling $${totalPrice.toFixed(2)}. Let me know if you need anything else!`,
                    isBot: true
                  }]);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
              >
                <Zap className="h-5 w-5 mr-2" />
                Build This PC - ${totalPrice.toFixed(2)}
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleInputKeyPress}
            placeholder={mode === 'build'
              ? 'Ask about modifications or start a new build...'
              : 'Ask me anything about PC components...'}
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <Button onClick={handleSend} disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? 'Sending...' : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in-out">
          Build copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default Index;