
import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Monitor, MemoryStick, Zap, CircuitBoard } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface ComponentLoadingProps {
  name: string;
  icon: React.ReactNode;
  progress: number;
  isActive: boolean;
  isComplete: boolean;
  delay: number;
}

const ComponentLoading: React.FC<ComponentLoadingProps> = ({ 
  name, 
  icon, 
  progress, 
  isActive, 
  isComplete,
  delay 
}) => {
  return (
    <div 
      className={`flex items-center gap-4 p-5 rounded-lg border transition-all duration-300 ${
        isComplete 
          ? 'bg-slate-50 border-slate-300 shadow-sm' 
          : isActive 
            ? 'bg-blue-50 border-blue-200 shadow-md' 
            : 'bg-white border-slate-200'
      }`}
      style={{ 
        animationDelay: `${delay}ms`,
        opacity: isActive || isComplete ? 1 : 0.7 
      }}
    >
      <div className={`p-3 rounded-lg ${
        isComplete 
          ? 'bg-emerald-100 text-emerald-700' 
          : isActive 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-slate-100 text-slate-500'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold text-lg ${
            isComplete 
              ? 'text-emerald-800' 
              : isActive 
                ? 'text-blue-800' 
                : 'text-slate-600'
          }`}>
            {name}
          </h3>
          <span className={`text-sm font-medium ${
            isComplete 
              ? 'text-emerald-600' 
              : isActive 
                ? 'text-blue-600' 
                : 'text-slate-500'
          }`}>
            {isComplete ? '100%' : `${Math.round(progress)}%`}
          </span>
        </div>
        <Progress 
          value={isComplete ? 100 : progress} 
          className={`h-2 bg-slate-200 ${
            isComplete 
              ? '[&>div]:bg-emerald-500' 
              : isActive 
                ? '[&>div]:bg-blue-500' 
                : '[&>div]:bg-slate-400'
          }`}
        />
        {isComplete && (
          <div className="text-sm text-emerald-600 mt-2 font-medium">
            ✓ Installation complete
          </div>
        )}
        {isActive && !isComplete && (
          <div className="text-sm text-blue-600 mt-2 font-medium">
            Installing component...
          </div>
        )}
      </div>
    </div>
  );
};

const AssemblyAnimation = () => {
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [componentProgress, setComponentProgress] = useState<{ [key: number]: number }>({});
  const [completedComponents, setCompletedComponents] = useState<Set<number>>(new Set());

  const components = [
    { name: 'Motherboard', icon: <CircuitBoard className="h-6 w-6" /> },
    { name: 'CPU Processor', icon: <Cpu className="h-6 w-6" /> },
    { name: 'Memory (RAM)', icon: <MemoryStick className="h-6 w-6" /> },
    { name: 'Graphics Card', icon: <Monitor className="h-6 w-6" /> },
    { name: 'Storage Drive', icon: <HardDrive className="h-6 w-6" /> },
    { name: 'Power Supply', icon: <Zap className="h-6 w-6" /> }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setOverallProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 80);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stepDuration = 100 / components.length;
    const newCurrentStep = Math.floor(overallProgress / stepDuration);
    setCurrentStep(Math.min(newCurrentStep, components.length - 1));

    // Update component progress
    components.forEach((_, index) => {
      const stepStart = index * stepDuration;
      const stepEnd = (index + 1) * stepDuration;
      
      if (overallProgress >= stepStart) {
        const stepProgress = Math.min(
          ((overallProgress - stepStart) / stepDuration) * 100,
          100
        );
        
        setComponentProgress(prev => ({
          ...prev,
          [index]: stepProgress
        }));

        if (stepProgress === 100) {
          setCompletedComponents(prev => new Set([...prev, index]));
        }
      }
    });
  }, [overallProgress, components.length]);

  return (
    <div className="w-full h-full bg-white rounded-lg p-8 border border-slate-200 shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-slate-800">PC Assembly Progress</h2>
        </div>
        
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-600 font-medium">Overall Progress</span>
            <span className="text-blue-600 font-semibold">{Math.round(overallProgress)}%</span>
          </div>
          <Progress 
            value={overallProgress} 
            className="h-3 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600"
          />
        </div>

        <p className="text-slate-500">
          Installing components systematically for optimal performance
        </p>
      </div>

      {/* Components List */}
      <div className="space-y-4">
        {components.map((component, index) => (
          <ComponentLoading
            key={component.name}
            name={component.name}
            icon={component.icon}
            progress={componentProgress[index] || 0}
            isActive={currentStep === index && !completedComponents.has(index)}
            isComplete={completedComponents.has(index)}
            delay={index * 100}
          />
        ))}
      </div>

      {/* Success Message */}
      {overallProgress === 100 && (
        <div className="mt-8 p-6 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">✓</span>
            </div>
            <div>
              <h3 className="text-emerald-800 font-semibold text-lg">Assembly Complete</h3>
              <p className="text-emerald-600">All components have been successfully installed and configured</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblyAnimation;
