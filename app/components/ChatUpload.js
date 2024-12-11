import { getCookie } from "../utils.js";
import { store } from "../store.js";

export const uploadChat = (ws) => {
    const token = getCookie();
    const message = {
        type: 'initial_upload',
        payload: {},
        sessionToken: token
    }
    if (ws.readyState === WebSocket.OPEN) {
        // Send immediately if connection is open
        ws.send(JSON.stringify(message));
    } else {
        // Wait for connection to open
        ws.onopen = () => {
            console.log("WS connection opened, sending upload request");
            ws.send(JSON.stringify(message));
        };
    }
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        //uploads messages and related users
        if (data.type === 'initial_upload') {
            const users = data.payload.User.map(user => ({
                id: user.ID,
                nickname: user.nickname,
                online: user.online
            }));
            store.setUsers(users);
            const messages = (data.payload.Message || []).map(message => ({
                id: message.id,
                content: message.content,
                created: message.created.replace("T", " ").replace("Z", ""),
                recipient: message.recipient,
                sender: message.sender
            }));
            store.setMessages(messages);
            //uploads user on-line/off-line status
        } else if (data.type === 'status') {
            //updates status of users
            store.updateUserStatus(data.payload.ID, data.payload.nickname, data.payload.online)
            //receives chat messages
        } else if (data.type === 'chat_message') {
            store.addChatMessage({
                id: data.payload.id,
                content: data.payload.content,
                created: data.payload.created,
                recipient: data.payload.recipient,
                sender: data.payload.sender
            });
        }
    }
}
