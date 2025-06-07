
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const PCCase = () => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main Case */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 6, 3]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          metalness={0.8} 
          roughness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Motherboard */}
      <mesh position={[0, -2, 0.5]}>
        <boxGeometry args={[3.5, 0.1, 2.5]} />
        <meshStandardMaterial color="#0f3460" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* CPU */}
      <mesh position={[0, -1.8, 0.5]}>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#c41e3a" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* RAM Sticks */}
      <mesh position={[1, -1.5, 0.8]}>
        <boxGeometry args={[0.2, 1, 0.1]} />
        <meshStandardMaterial color="#00ff88" emissive="#004400" />
      </mesh>
      <mesh position={[1.5, -1.5, 0.8]}>
        <boxGeometry args={[0.2, 1, 0.1]} />
        <meshStandardMaterial color="#00ff88" emissive="#004400" />
      </mesh>
      
      {/* GPU */}
      <mesh position={[0, -1, -0.5]}>
        <boxGeometry args={[2.5, 0.5, 1]} />
        <meshStandardMaterial color="#ff6b35" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Power Supply */}
      <mesh position={[0, -2.5, -1]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Fans */}
      <mesh position={[-1.8, 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1]} />
        <meshStandardMaterial color="#34495e" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[1.8, 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1]} />
        <meshStandardMaterial color="#34495e" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
};

const FloatingParticles = () => {
  const particlesRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
    }
  });

  const particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push(
      <mesh 
        key={i} 
        position={[
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        ]}
      >
        <sphereGeometry args={[0.02]} />
        <meshStandardMaterial 
          color="#60a5fa" 
          emissive="#1e40af"
          transparent
          opacity={0.6}
        />
      </mesh>
    );
  }

  return <group ref={particlesRef}>{particles}</group>;
};

const PCVisualization = () => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg">
      <Canvas camera={{ position: [8, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#8b5cf6" intensity={0.5} />
        
        <PCCase />
        <FloatingParticles />
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 6}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default PCVisualization;
