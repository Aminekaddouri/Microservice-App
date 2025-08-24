import { GameMessage, gameWorldDimensions, MovePayload, StatePayload } from "../types/game-types-protocol";
import { getCurrentUser } from '@/utils/authState';

interface Coord {
	x: number;
	y: number;
}

function createMessage(move: MovePayload) {
  const user = getCurrentUser();
  if (user && user.id) {
    return {userId: user.id, move: move};
  }
  return {};
}

class Paddle {
	el: HTMLElement;
	coord: Coord;

	constructor(paddle: HTMLElement) {
		this.el = paddle;
		this.coord = {
			x: parseInt(window.getComputedStyle(this.el).left),
			y: parseInt(window.getComputedStyle(this.el).top)
		};
	}

	render() {
    this.el.style.top = `${this.coord.y}px`;
	}

  setCoord(y: number) {
    this.coord.y = y;
  }
}

class Ball {
	el: HTMLElement;
	coord: Coord;
	constructor(ball: HTMLElement) {
		this.el = ball;
		this.coord = {
			x: parseInt(window.getComputedStyle(this.el).left),
			y: parseInt(window.getComputedStyle(this.el).top)
		};
	}
  render() {
    this.el.style.left = `${this.coord.x}px`;
    this.el.style.top = `${this.coord.y}px`;
  }
}

export class Pong {
  ball: Ball;
  paddles: Paddle[] = [];
  parentD: {w: number, h: number}


  animationId: number | null = null;
  running = false;

  constructor(paddles: HTMLElement[], ball: HTMLElement) {
    const parent = ball.parentElement;
    if (!parent) {
      throw Error('Ball element has no parent');
    }
    this.parentD = {w: parent.clientWidth, h: parent.clientHeight};
    paddles.forEach((paddle) => {
      this.paddles.push(new Paddle(paddle));
    })
    this.ball = new Ball(ball);
  }

  updateBall(coord: Coord) {
    coord = {x: coord.x * this.parentD.w, y: coord.y * this.parentD.h};
    this.ball.coord = coord;
  }

  updatePaddles(paddlesInfo: Record<number, { x: number; y: number }>) {
    this.paddles.forEach((paddle, index) => {
      if (paddlesInfo[index]?.y)
        paddle.setCoord(paddlesInfo[index].y * this.parentD.h);
    })
  }

  setLeftPaddleEvents(socket: SocketIOClient.Socket) {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyW') {
        socket.emit('move', createMessage({key: 'up', event: 'keydown', paddleIndex: 0}));
      }
      if (e.code === 'KeyS') {
        socket.emit('move', createMessage({key: 'down', event: 'keydown', paddleIndex: 0}));
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW') {
        socket.emit('move', createMessage({key: 'up', event: 'keyup', paddleIndex: 0}));
      }
      if (e.code === 'KeyS') {
        socket.emit('move', createMessage({key: 'down', event: 'keyup', paddleIndex: 0}));
      }
    });
  }
  setRightPaddleEvents(socket: SocketIOClient.Socket) {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowUp') {
        socket.emit('move', createMessage({key: 'up', event: 'keydown', paddleIndex: 1}));
      }
      if (e.code === 'ArrowDown') {
        socket.emit('move', createMessage({key: 'down', event: 'keydown', paddleIndex: 1}));
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowUp') {
        socket.emit('move', createMessage({key: 'up', event: 'keyup', paddleIndex: 1}));
      }
      if (e.code === 'ArrowDown') {
        socket.emit('move', createMessage({key: 'down', event: 'keyup', paddleIndex: 1}));
      }
    });
  }

  run = () => {
    this.ball.render();
    this.paddles.forEach((paddle) => {
      paddle.render();
    })

    this.animationId = requestAnimationFrame(this.run);
  }
  stop() {
    if (this.animationId) {
        cancelAnimationFrame(this.animationId);
    }
  }
}
