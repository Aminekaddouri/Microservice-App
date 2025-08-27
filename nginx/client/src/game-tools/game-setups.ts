import { Pong} from "./pingPong";
import * as uiCreator from "./uiCreator";
import {gameWorldDimensions} from "../types/game-types-protocol";
export let mount: any;

export async function createTheGame(app: HTMLElement) {
  if (!app) return;

  
  const gameContainer = document.createElement('div');
  gameContainer.classList.add(
    'w-full',
    'h-full',
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    'relative',
    'overflow-hidden'
  );
  
  const board = uiCreator.createScoreBoard();
  gameContainer.appendChild(board);

  app.innerHTML = '';
  app.appendChild(gameContainer);


  const gameFrame = await uiCreator.createGameFrame();
  const leftPaddle = await uiCreator.createPaddle('left');
  const rightPaddle = await uiCreator.createPaddle('right');
  const ball = await uiCreator.createBall();
  const animtion = uiCreator.countDownAnimation();

  gameFrame.appendChild(leftPaddle);
  gameFrame.appendChild(rightPaddle);
  gameFrame.appendChild(ball);
  

  gameContainer.appendChild(gameFrame);
  
  const updateGameFrameSize = () => {
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    
    // Calculate responsive dimensions with width > height aspect ratio
    const aspectRatio = 16 / 9; // Standard widescreen ratio
    let gameWidth, gameHeight;
    
    if (containerWidth / containerHeight > aspectRatio) {
      // Container is wider than desired aspect ratio
      gameHeight = Math.min(containerHeight * 0.8, containerWidth / aspectRatio);
      gameWidth = gameHeight * aspectRatio;
    } else {
      // Container is taller than desired aspect ratio
      gameWidth = containerWidth * 0.9;
      gameHeight = gameWidth / aspectRatio;
    }
    
    // Ensure minimum size for mobile devices with better scaling
    const minWidth = Math.max(280, containerWidth * 0.8);
    const minHeight = Math.max(160, containerHeight * 0.6);
    gameWidth = Math.max(gameWidth, minWidth);
    gameHeight = Math.max(gameHeight, minHeight);
    
    // Ensure maximum size doesn't exceed container
    gameWidth = Math.min(gameWidth, containerWidth * 0.95);
    gameHeight = Math.min(gameHeight, containerHeight * 0.85);
    
    // Apply dimensions to game frame
    gameFrame.style.width = `${gameWidth}px`;
    gameFrame.style.height = `${gameHeight}px`;
    
    // Scale game elements proportionally
    const scaleX = gameWidth / 800; // Base width reference
    const scaleY = gameHeight / 450; // Base height reference
    const uniformScale = Math.min(scaleX, scaleY);
    
    // Set paddle dimensions based on game frame dimensions and gameWorldDimensions
    const paddleWidth = gameWidth * gameWorldDimensions.paddle.w;
    const paddleHeight = gameHeight * gameWorldDimensions.paddle.h;
    
    leftPaddle.style.width = `${paddleWidth}px`;
    leftPaddle.style.height = `${paddleHeight}px`;
    rightPaddle.style.width = `${paddleWidth}px`;
    rightPaddle.style.height = `${paddleHeight}px`;
    
    // Set ball dimensions based on average of game frame dimensions and gameWorldDimensions
    const ballSize = (gameWidth + gameHeight) / 2 * gameWorldDimensions.ball.w;
    ball.style.width = `${ballSize}px`;
    ball.style.height = `${ballSize}px`;
    
    // Reposition elements after scaling
    uiCreator.positionThePaddle(leftPaddle, "left");
    uiCreator.positionThePaddle(rightPaddle, "right");
    uiCreator.centerTheBall(ball);
    
    // Store current dimensions for collision detection
    gameFrame.dataset.gameWidth = gameWidth.toString();
    gameFrame.dataset.gameHeight = gameHeight.toString();
    gameFrame.dataset.uniformScale = uniformScale.toString();
  }
  
  updateGameFrameSize();
  
  // Enhanced responsive behavior with ResizeObserver
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      // Debounce resize events for better performance
      clearTimeout(mount?.resizeTimeout);
      mount = mount || {};
      mount.resizeTimeout = setTimeout(() => {
        updateGameFrameSize();
      }, 16); // ~60fps
    });
    resizeObserver.observe(gameContainer);
    
    // Store observer for cleanup
    mount = mount || {};
    mount.resizeObserver = resizeObserver;
  }

  // Fallback for older browsers
  window.addEventListener("resize", updateGameFrameSize);
  
  // Handle orientation changes on mobile devices
  window.addEventListener("orientationchange", () => {
    setTimeout(updateGameFrameSize, 100);
  });
  
  const game = new Pong([leftPaddle, rightPaddle], ball);
  game.run();
  return game;
}