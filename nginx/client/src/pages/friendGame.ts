import { isLoggedIn, getAccessToken } from '../utils/auth';
import { navigateTo } from '../utils/router';
import {createTheGame} from '../game-tools/game-setups'
import io from 'socket.io-client';
import { api } from '@/services/api';
import { getCurrentUser } from '@/utils/authState';

import { GameMessage, gameWorldDimensions, MovePayload, StatePayload } from "../types/game-types-protocol";
import { Pong } from '@/game-tools/pingPong';
import { online } from '@/game-tools/online-game-tools';


export function renderFriendGame() {
	online('friend', '/chat');
}