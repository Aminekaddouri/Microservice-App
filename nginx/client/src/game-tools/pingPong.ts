import { GameMessage, gameWorldDimensions, MovePayload, StatePayload } from "../types/game-types-protocol";
import { getCurrentUser } from '@/utils/authState';
import { api } from '@/services/api';


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
  score: (HTMLElement | null)[] = [];
  playersName: (HTMLElement | null)[] = [];
  ball: Ball;
  paddles: Paddle[] = [];
  parentD: {w: number, h: number} = {w: 0, h: 0};
  gameFrame: HTMLElement;
  resizeObserver: ResizeObserver | null = null;

  animationId: number | null = null;
  running = false;

  constructor(paddles: HTMLElement[], ball: HTMLElement) {
    const parent = ball.parentElement;
    if (!parent) {
      throw Error('Ball element has no parent');
    }
    this.gameFrame = parent;
    this.updateDimensions();
    paddles.forEach((paddle) => {
      this.paddles.push(new Paddle(paddle));
    })
    this.ball = new Ball(ball);
    
    // Set up responsive dimension tracking
    this.setupResponsiveTracking();

    this.score.push(document.getElementById('leftScore'));
    this.score.push(document.getElementById('rightScore'));

    this.playersName.push(document.getElementById('leftName'));
    this.playersName.push(document.getElementById('rightName'));
  }

  setScore(score: number[]) {
    score.forEach((s, idx) => {
      if (this.score[idx])
        this.score[idx].innerHTML = s.toString();
    });
  }

  async setNames(players: {userId: string}[]) {
    await Promise.all(players.map(async (player, idx) => {
      try {
        const data = await api.getuserbyid(player.userId);
        if (data.user?.nickName && this.playersName[idx]) {
          this.playersName[idx].innerHTML = data.user.nickName;
        }
      } catch (error) {
        console.log(error);
      }
    }));
  }

  setWinnerName() {
    const winnerSpam = document.getElementById('go-winner');
    if (this.score[0] !== null && this.score[1] !== null) {
      const leftScore = parseInt(this.score[0].innerHTML);
      const rightScore = parseInt(this.score[1].innerHTML);
      const winnerName = leftScore > rightScore ? this.playersName[0]?.innerHTML : this.playersName[1]?.innerHTML;
      if (winnerSpam && winnerName) {
        winnerSpam.innerHTML = `Winner: ${winnerName}`;
      }
    }
  }

  updateDimensions() {
    // Get dimensions from stored dataset or fallback to client dimensions
    const gameWidth = parseFloat(this.gameFrame.dataset.gameWidth || this.gameFrame.clientWidth.toString());
    const gameHeight = parseFloat(this.gameFrame.dataset.gameHeight || this.gameFrame.clientHeight.toString());
    
    this.parentD = {w: gameWidth, h: gameHeight};
  }
  
  setupResponsiveTracking() {
    // Track dimension changes for responsive collision detection
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateDimensions();
      });
      this.resizeObserver.observe(this.gameFrame);
    }
  }

  updateBall(coord: Coord) {
    // Ensure dimensions are current before calculating position
    this.updateDimensions();
    
    // Convert normalized coordinates (0-1) to pixel coordinates
    // Since ball uses transform: translate(-50%, -50%), coordinates represent the center
    const ballSize = parseFloat(this.ball.el.style.width) || 20;
    const ballRadius = ballSize / 2;
    
    // Calculate pixel position with proper boundary checking for centered ball
    const pixelX = coord.x * this.parentD.w;
    const pixelY = coord.y * this.parentD.h;
    
    // Clamp to boundaries considering ball is centered on coordinates
    const clampedX = Math.max(ballRadius, Math.min(pixelX, this.parentD.w - ballRadius));
    const clampedY = Math.max(ballRadius, Math.min(pixelY, this.parentD.h - ballRadius));
    
    this.ball.coord = {
      x: clampedX,
      y: clampedY
    };
  }

  updatePaddles(paddlesInfo: Record<number, { x: number; y: number }>) {
    this.paddles.forEach((paddle, index) => {
      if (paddlesInfo[index]?.y) {
        // Convert normalized coordinates (0-1) to pixel coordinates
        // Since paddles use transform: translate(-50%, -50%), coordinates represent the center
        const pixelY = paddlesInfo[index].y * this.parentD.h;
        
        // Get paddle height for boundary checking
        const paddleHeight = parseFloat(paddle.el.style.height) || 100;
        const paddleHalfHeight = paddleHeight / 2;
        
        // Clamp to boundaries considering paddle is centered on coordinates
        const clampedY = Math.max(paddleHalfHeight, Math.min(pixelY, this.parentD.h - paddleHalfHeight));
        
        paddle.setCoord(clampedY);
      }
    })
  }

  setLeftPaddleEvents(socket: SocketIOClient.Socket) {
    // Keyboard controls
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
    
    // Touch controls for mobile devices
    this.setupTouchControls(socket, 0);
  }
  setRightPaddleEvents(socket: SocketIOClient.Socket) {
    // Keyboard controls
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
    
    // Touch controls for mobile devices
    this.setupTouchControls(socket, 1);
  }
  
  setupTouchControls(socket: SocketIOClient.Socket, paddleIndex: number) {
    // Create touch control areas for mobile
    const gameFrame = this.gameFrame;
    const side = paddleIndex === 0 ? 'left' : 'right';
    
    // Touch area for paddle control
    const touchArea = document.createElement('div');
    touchArea.classList.add(
      'absolute',
      'top-0',
      'w-1/2',
      'h-full',
      'opacity-0',
      'touch-none',
      'pointer-events-auto',
      'z-10'
    );
    
    if (side === 'left') {
      touchArea.classList.add('left-0');
    } else {
      touchArea.classList.add('right-0');
    }
    
    let touchStartY = 0;
    let isMovingUp = false;
    let isMovingDown = false;
    
    touchArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartY = e.touches[0].clientY;
    });
    
    touchArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY;
      
      if (deltaY < -10 && !isMovingUp) {
        // Moving up
        if (isMovingDown) {
          socket.emit('move', createMessage({key: 'down', event: 'keyup', paddleIndex}));
          isMovingDown = false;
        }
        socket.emit('move', createMessage({key: 'up', event: 'keydown', paddleIndex}));
        isMovingUp = true;
      } else if (deltaY > 10 && !isMovingDown) {
        // Moving down
        if (isMovingUp) {
          socket.emit('move', createMessage({key: 'up', event: 'keyup', paddleIndex}));
          isMovingUp = false;
        }
        socket.emit('move', createMessage({key: 'down', event: 'keydown', paddleIndex}));
        isMovingDown = true;
      }
    });
    
    touchArea.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (isMovingUp) {
        socket.emit('move', createMessage({key: 'up', event: 'keyup', paddleIndex}));
        isMovingUp = false;
      }
      if (isMovingDown) {
        socket.emit('move', createMessage({key: 'down', event: 'keyup', paddleIndex}));
        isMovingDown = false;
      }
    });
    
    gameFrame.appendChild(touchArea);
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
    
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
}