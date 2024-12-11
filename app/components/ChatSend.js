import { localTimeNow, getCookie } from "../utils.js";
import { store } from "../store.js";

export const sendMessage = (ws, content, toUserID) => {
    const token = getCookie();

    const message = {
        type: 'chat_message',
        payload: {
            content: content,
            created: localTimeNow(),
            recipient: toUserID,
            sender: store.state.user.details.id
        },
        sessionToken: token
    };

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        ws.onopen = () => {
            ws.send(JSON.stringify(message));
        };
    }

    store.addChatMessage({
        ...message.payload,
    });
};

