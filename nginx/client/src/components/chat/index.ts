// Export all chat components for easy importing
export { MessageList, MessageListProps } from './MessageList';
export { MessageInput, MessageInputProps } from './MessageInput';
export { ChatPageManager, ChatPageManagerProps } from './ChatPageManager';

// Helper function to initialize the chat page manager
import { ChatPageManager } from './ChatPageManager';

export function initializeChatPageManager(
  container: HTMLElement,
  selectedFriend: any,
  socket: any,
  onFriendSelect?: (friend: any) => void
) {
  return new ChatPageManager(container, {
    selectedFriend,
    socket,
    onFriendSelect
  });
}