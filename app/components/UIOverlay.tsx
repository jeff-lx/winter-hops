import React from 'react';
import { GameState } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  multiplier: number;
  highScore: number;
  onStart: () => void;
  onRestart: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState,
  score,
  multiplier,
  highScore,
  onStart,
  onRestart
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
      {/* Top HUD */}
      <div className="w-full flex justify-between items-start text-white opacity-90">
        <div className="flex flex-col">
          <span className="text-sm uppercase tracking-widest text-blue-200">Score</span>
          <span className="text-4xl font-bold game-text-shadow font-mono">{score.toLocaleString()}</span>
        </div>
        
        {gameState === GameState.PLAYING && (
          <div className="flex flex-col items-end">
             <span className="text-sm uppercase tracking-widest text-pink-200">Combo</span>
             <span className="text-3xl font-bold text-pink-300 game-text-shadow">x{multiplier}</span>
          </div>
        )}
      </div>

      {/* Center Menus */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        
        {/* Main Menu - Minimal, just Title and floating instruction */}
        {gameState === GameState.MENU && (
          <div className="text-center animate-fade-in flex flex-col items-center">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 mb-8 game-text-shadow" style={{filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))'}}>
              Winter Hops
            </h1>
            <div className="mt-32 md:mt-48 animate-bounce bg-black/30 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
              <p className="text-white text-xl font-bold tracking-wide">Click to Jump</p>
            </div>
          </div>
        )}

        {/* Game Over */}
        {gameState === GameState.GAME_OVER && (
          <div className="text-center animate-fade-in bg-slate-900/80 backdrop-blur-md p-10 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-5xl font-bold text-white mb-2 game-text-shadow">Game Over</h2>
            <div className="my-6">
              <div className="text-blue-200 text-sm uppercase">Final Score</div>
              <div className="text-6xl font-bold text-white mb-2">{score.toLocaleString()}</div>
              
              <div className="text-blue-200 text-sm uppercase mt-4">High Score</div>
              <div className="text-2xl font-bold text-yellow-300">{highScore.toLocaleString()}</div>
            </div>
            
            <button 
              onClick={onRestart}
              className="bg-white text-slate-900 px-8 py-3 rounded-full text-xl font-bold hover:bg-blue-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="text-blue-300/50 text-sm pointer-events-none mb-4">
        {gameState === GameState.PLAYING ? "" : "Made with Gemini 2.0 Flash"}
      </div>
    </div>
  );
};
