import { gameData } from "@/pages/GamePage";
import { themeService, UserTheme } from "@/services/themeService";

// type GameCustomization = {
//   paddleColor?: string;
//   ballColor?: string;
//   fieldColor?: string;
// }

export async function createGameFrame(): Promise<HTMLElement> {
  const gameFrame = document.createElement('div');
  gameFrame.classList.add(
    "relative",
    'overflow-hidden',
    'rounded-3xl',
    'shadow-2xl'
  );
  
  // Load theme and apply board color
  const theme = await themeService.getCurrentTheme();
  gameFrame.style.backgroundColor = theme.board_color;
  
  const theMiddle = document.createElement('div');
  theMiddle.classList.add(
    'absolute',
    'top-1/2',
    'left-1/2',
    'transform',
    '-translate-x-1/2',
    '-translate-y-1/2',
    'w-[2px]',  // Line thickness
    'h-full',   // Full height of the gameFrame
    'bg-transparent', // Make the background transparent
    'border-l-2',     // Left border to create the line
    'border-dotted',   // Dotted line style
    'border-orange-400'    // Orange line color
  )
  
  gameFrame.appendChild(theMiddle);
  gameFrame.id = 'gameFrame';
  return gameFrame;
}

export async function createPaddle(side: 'left' | 'right'): Promise<HTMLElement> {
  const paddle = document.createElement('div');
  paddle.classList.add(
      'absolute',
      'rounded-full',
      'shadow-lg'
  );
  
  // Load theme and apply paddle color based on side
  const theme = await themeService.getCurrentTheme();
  const paddleColor = side === 'left' ? theme.left_paddle_color : theme.right_paddle_color;
  paddle.style.backgroundColor = paddleColor;
  
  return paddle;
}

export function positionThePaddle(paddle: HTMLElement, side: 'left' | 'right') {
  if (!paddle.parentElement)
    throw new Error("Paddle must have a parent element to position it.");
  
  const gameFrame = paddle.parentElement;
  const gameWidth = gameFrame.clientWidth;
  const gameHeight = gameFrame.clientHeight;
  
  // Remove any existing positioning classes
  paddle.classList.remove(
    "-translate-y-1/2", "-translate-x-1/2", 
    "top-1/2", "right-[0px]"
  );
  
  // Position paddle according to gameWorldDimensions coordinate system
  if (side === 'left') {
    // Left paddle at x = 0.015 (1.5% from left edge)
    const leftX = gameWidth * 0.015;
    paddle.style.left = `${leftX}px`;
  } else {
    // Right paddle at x = 0.985 (98.5% from left edge)
    const rightX = gameWidth * 0.985;
    paddle.style.left = `${rightX}px`;
  }
  
  // Center paddle vertically at y = 0.5 (50% of game height)
  const centerY = gameHeight * 0.5;
  paddle.style.top = `${centerY}px`;
  
  // Use transform to center the paddle on its position
  paddle.style.transform = 'translate(-50%, -50%)';
  paddle.style.position = 'absolute';
}

export async function createBall(): Promise<HTMLElement> {
  const ball = document.createElement('div');
  ball.classList.add(
      'absolute',
      'rounded-full',
      'shadow-lg',
      'animate-pulse'
  );
  
  // Load theme and apply ball color
  const theme = await themeService.getCurrentTheme();
  ball.style.backgroundColor = theme.ball_color;
  
  return ball;
}

export function centerTheBall(ball: HTMLElement) {
  if (!ball.parentElement)
    throw new Error("Ball must have a parent element to center it.");
  
  const gameFrame = ball.parentElement;
  const gameWidth = gameFrame.clientWidth;
  const gameHeight = gameFrame.clientHeight;
  
  // Remove any existing positioning classes
  ball.classList.remove(
    "top-1/2", "left-1/2", 
    "-translate-y-1/2", "-translate-x-1/2"
  );
  
  // Position ball at exact center according to gameWorldDimensions coordinate system
  // Ball center at x = 0.5 (50% from left edge), y = 0.5 (50% from top edge)
  const centerX = gameWidth * 0.5;
  const centerY = gameHeight * 0.5;
  
  ball.style.left = `${centerX}px`;
  ball.style.top = `${centerY}px`;
  
  // Use transform to center the ball on its position
  ball.style.transform = 'translate(-50%, -50%)';
  ball.style.position = 'absolute';
}

export function createScoreBoard() {
  const board = document.createElement('div');
  board.classList.add(
    'w-full',
    'max-w-4xl',
    'min-h-[60px]',
    'h-auto',
    'text-white',
    'flex',
    'items-center',
    'justify-between',
    'px-4',
    'sm:px-8',
    'md:px-12',
    'py-3',
    'sm:py-4',
    'md:py-6',
    'font-mono',
    'text-lg',
    'sm:text-2xl',
    'md:text-3xl',
    'lg:text-4xl',
    'font-bold',
    'mb-4',
    'sm:mb-6',
    'md:mb-8',
    'bg-gradient-to-r',
    'from-orange-600',
    'to-orange-500',
    'rounded-xl',
    'md:rounded-2xl',
    'shadow-xl',
    'border-2',
    'border-orange-400'
  );

  const leftPlayer = document.createElement('div');
  leftPlayer.classList.add('flex', 'items-center', 'space-x-2', 'sm:space-x-4', 'md:space-x-6');
  leftPlayer.innerHTML = `
    <span class="text-left text-sm sm:text-base md:text-lg lg:text-xl font-mono tracking-wider text-orange-100" id="leftName">PLAYER 1</span>
    <span id="leftScore" class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-mono font-black tracking-widest text-white">0</span>
  `;

  const rightPlayer = document.createElement('div');
  rightPlayer.classList.add('flex', 'items-center', 'space-x-2', 'sm:space-x-4', 'md:space-x-6');
  rightPlayer.innerHTML = `
    <span id="rightScore" class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-mono font-black tracking-widest text-white">0</span>
    <span class="text-right text-sm sm:text-base md:text-lg lg:text-xl font-mono tracking-wider text-orange-100" id="rightName">PLAYER 2</span>
  `;

  board.appendChild(leftPlayer);
  board.appendChild(rightPlayer);

  return board;
}

export function countDownAnimation() {
  // Countdown timer element
  const countdownElement = document.createElement('div');
  countdownElement.classList.add(
    'absolute',
    'top-1/2',
    'left-1/2',
    'transform',
    '-translate-x-1/2',
    '-translate-y-1/2',
    'text-8xl',       // default tailwind size (you can change with setCountdownSize)
    'font-extrabold',
    'text-white',
    'select-none',
    'pointer-events-none',
    'flex',
    'items-center',
    'justify-center',
    'z-20',
    'hidden' // Initially hidden
  );

  let countdownInterval: number | null = null;
  let countdownValue = 3;

  // Function to start the countdown
  function startCountdown() {
    countdownElement.textContent = countdownValue.toString();
    countdownElement.classList.remove('hidden');

    countdownInterval = window.setInterval(() => {
      countdownValue--;
      countdownElement.textContent = countdownValue.toString();

      if (countdownValue === 0) {
        clearInterval(countdownInterval as number);
        countdownElement.classList.add('hidden');
      }
    }, 1000);
  }

  // Function to stop the countdown
  function stopCountdown() {
    if (countdownInterval !== null) {
      clearInterval(countdownInterval);
      countdownElement.classList.add('hidden');
    }
  }
  const gameFrame = document.getElementById('gameFrame');
  gameFrame?.appendChild(countdownElement);
  // Function to reset the countdown
  // function resetCountdown() {
  //   countdownValue = 3;
  //   countdownElement.textContent = countdownValue.toString();
  // }

  return {
    startCountdown,
    stopCountdown
  }
}