import { store } from "../store";

let socket = null;

export function getSocket() {
    if (!socket && store.state.user.isLoggedIn) {
        const nickname = store.state.user.details.nickname;
        socket = new WebSocket(`ws://localhost:8080/ws?nickname=${encodeURIComponent(nickname)}`);

        socket.onopen = () => console.log('WebSocket chat connected');
        socket.onmessage = event =>
            console.log("Message received from WebSocket:", event.data);
        socket.onclose = () => console.log('WebSocket closed');
        socket.onerror = error => console.error('WebSocket error:', error);
    }
    return socket;
}
