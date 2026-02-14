
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Analyzing visual composition...",
  "Simulating depth and motion...",
  "Rendering cinematic lighting...",
  "Tracing light through the scene...",
  "Applying temporal coherence...",
  "Generating fluid frame transitions...",
  "Processing high-fidelity textures...",
  "Calibrating motion vectors...",
  "Painting with light and pixels...",
  "Orchestrating the visual flow...",
  "Polishing final cut details...",
  "Wait while we weave the frames...",
  "Breathing life into the static...",
  "Animating the dream...",
  "Synthesizing motion layers...",
  "Capturing the digital moment..."
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-16 glass-panel rounded-[2rem] border border-white/10 animate-glow">
      <div className="relative">
         <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full absolute inset-0"></div>
         <div className="w-20 h-20 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
      <h2 className="text-2xl font-bold mt-10 text-white tracking-tight">GENERATING CINEMATIC VIDEO</h2>
      <p className="mt-3 text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-700 h-4">
        {loadingMessages[messageIndex]}
      </p>
      <div className="mt-8 flex gap-1">
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
