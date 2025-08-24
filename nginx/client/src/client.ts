import { renderDashboard } from './pages/DashboardPage';
import { renderLogin, setupLoginEvents } from './pages/LoginPage';
import './styles/main.css';
import dotenv from "dotenv";
import { navigateTo, registerRoute, renderRoute } from './utils/router';
import { isLoggedIn, logout, verifyToken } from './utils/auth';
import { renderSignup } from './pages/SignupPage';
import { renderVerifyEmailPage } from './pages/VerifyEmailPage';
import { renderCheckYourEmailPage } from './pages/CheckYourEmailPage';
import { setCurrentUser } from './utils/authState';
import { initChat } from './pages/ChatPage'
import { renderGame } from './pages/GamePage'


registerRoute('/', renderLogin);
registerRoute('/signup', renderSignup);
registerRoute('/verify-email', renderVerifyEmailPage);
registerRoute('/email-verification', renderCheckYourEmailPage);
registerRoute('/dashboard', renderDashboard);
registerRoute('/chat', initChat);
registerRoute('/game', renderGame);


async function initApp() {
    const currentPath = location.pathname;
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
    }
    
    const isPublic = ['/', '/signup', '/verify-email'].includes(currentPath);
    
    if (!isPublic) {
        const isValid = await verifyToken();
        if (!isValid) {
            return navigateTo('/');
        }
        return renderRoute(currentPath);
    }

    if (currentPath === '/') {
        return navigateTo('/dashboard');
    }

    return renderRoute(currentPath);
}

initApp();


