import { Brain } from 'lucide-react';

export const AIBrainAnimation = () => (
  <div className="relative mx-auto w-28 h-28">
    {/* Outer pulse ring */}
    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-30 animate-ping"></div>
    {/* Middle pulse ring */}
    <div className="absolute inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-50 animate-pulse"></div>
    {/* Core brain icon */}
    <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-28 h-28 flex items-center justify-center shadow-2xl">
      <Brain className="w-14 h-14 text-white animate-pulse" />
    </div>
  </div>
);
