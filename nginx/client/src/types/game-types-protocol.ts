export interface GameMessage {
  type: 'move' | 'join' | 'paddleNumber' | 'leave' | 'error';
  payload?: any;
}

export interface MovePayload {
  key: 'up' | 'down';
  event: 'keydown' | 'keyup';
  paddleIndex: number;
}

export interface StatePayload {
  ball: { x: number; y: number };
  paddles: Record<number, { x: number; y: number }>;
}

export const gameWorldDimensions = {
  gameD: { w: 1, h: 1 },
  paddle: { w: 0.015, h: 0.3 },
  ball: { w: 0.03 }
}
