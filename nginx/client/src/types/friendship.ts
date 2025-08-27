export enum FriendshipStatus {
    pending = 'pending',     
    accepted = 'accepted',   
    rejected = 'rejected',   
    blocked = 'blocked'
}

export type Friendship = {
    id: string;
    user1ID: string;
    user2ID: string;
    status: FriendshipStatus;
    createdAt: string;
    updatedAt?: string;
};

export type friendshipResponse = {
    success: boolean,
    message?: string,
    friendship?: Friendship[]
};

export type FriendRequest = {
    id: string;
    senderId: string;
    senderName: string;
    senderPicture?: string;
    createdAt: string;
};