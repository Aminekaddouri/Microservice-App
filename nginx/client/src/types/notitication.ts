export interface Notification {
    isRead: any;
    id: string;
    senderID: string;
    content: string;
    type: string;
    receiversIDs: string[];
    createdAt: string;
}

export type NotificationResponse ={
    pendingRequests: any;
    pending(pending: any): unknown;
    requests(requests: any): unknown;
    success: boolean;
    message?:string,
    notifs?: Notification[];
}