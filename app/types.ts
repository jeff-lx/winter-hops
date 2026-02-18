export interface Vector2 {
  x: number;
  y: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

export interface Bell extends Entity {
  type: 'normal' | 'bird' | 'super';
  active: boolean;
  scale: number;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Player extends Entity {
  state: 'idle' | 'jump' | 'fall';
  rotation: number;
}
