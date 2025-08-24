export type Message = {
    id?: string;
    senderId: string;
    receiverId: string;
    content: string;
    sentAt?: string;
    readAt?: string | null;
};


export type MessageResponse = {
    success: Boolean, 
    message?: string,
    newmsg?: Message
}

export type ConversationMessagesResponse = {
    success: boolean;
    message?: string;
    messages?: Message[];
}