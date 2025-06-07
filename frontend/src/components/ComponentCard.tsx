import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from 'lucide-react';
// import Image from 'next/image'; // Removed for now to avoid dependency issues
// import { motion } from 'framer-motion'; // Removed for now

interface ComponentProps {
  component: {
    name: string;
    type: string;
    price: string;
    image: string;
    specs: string[];
    icon: React.ReactNode;
  };
  delay: number;
}

const ComponentCard: React.FC<ComponentProps> = ({ component, delay }) => {
  // Removed motion.div wrapper and delay prop usage for now due to potential missing dependency
  return (
    <div className="h-full"> {/* Added h-full for consistent card height if needed in a grid */}
      <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-300 flex flex-col h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-400 p-2 rounded-lg bg-blue-400/10">
              {component.icon}
            </div>
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300 bg-gray-700">
              {component.type}
            </Badge>
          </div>
          <CardTitle className="text-lg text-white">
            {component.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          {/* Component Image */}
          <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
            <img 
              src={component.image} 
              alt={component.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg'; // Fallback image
              }}
            />
          </div>
          
          <div className="space-y-3">
            <div className="text-2xl font-bold text-green-400">
              {component.price}
            </div>
            
            <ul className="space-y-1">
              {component.specs.slice(0, 4).map((spec, index) => ( // Limit to 4 specs for brevity
                <li key={index} className="text-sm text-gray-300 flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 shrink-0"></div>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="pt-4 mt-auto"> {/* mt-auto to push footer to bottom */}
          <Button 
            variant="outline" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-700 hover:border-blue-800"
            onClick={() => console.log(`Add to build: ${component.name}`)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Build
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ComponentCard;
