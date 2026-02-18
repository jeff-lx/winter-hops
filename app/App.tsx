import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { GameState } from './types';
import { STORAGE_KEY_HIGHSCORE } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [highScore, setHighScore] = useState(0);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HIGHSCORE);
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Update High Score on Game Over
  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(STORAGE_KEY_HIGHSCORE, score.toString());
      }
    }
  }, [gameState, score, highScore]);

  const sendToUnity = (type, payload = {}) => {
	const message = {
	  type,
	  data: payload
	}
	if (window.vuplex && window.vuplex.postMessage) {
		window.vuplex.postMessage(JSON.stringify(message))
	  } else {
		console.log("Not running inside Unity:", message)
	  }
	}

  const handleStart = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setMultiplier(1);
  };

  const handleRestart = () => {
    // Return to menu state which places player on ground
    setGameState(GameState.MENU);
    setScore(0);
    setMultiplier(1);
  };

  const handleQuit = () => {
	sendToUnity("LXModule.ModuleFrontendModel+CompleteModule, LevelExMedical.Module")
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 cursor-crosshair">
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState} 
        setScore={setScore} 
        setMultiplier={setMultiplier} 
      />
      <UIOverlay 
        gameState={gameState} 
        score={score} 
        multiplier={multiplier} 
        highScore={highScore}
        onStart={handleStart} 
        onRestart={handleRestart}
		onQuit={handleQuit}
      />
    </div>
  );
};

export default App;
