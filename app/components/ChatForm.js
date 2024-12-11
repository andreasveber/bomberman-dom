import { Framework } from '../framework.js';
import { handleEvent } from '../events.js';
import { uploadChat } from './ChatUpload.js';
import { sendMessage } from './ChatSend.js';
import { getSocket } from './Socket.js';
import { store } from "../store.js";

const framework = new Framework();
let socket = null;
export function ChatForm() {
    if (store.state.user.isLoggedIn) {
        socket = getSocket();
        uploadChat(socket);
    }
    // Elements for user list, message display, and message input area
    const userListContainer = framework.createElement('div', {
        class: 'user-list space-y-1 p-4 bg-gray-100 rounded-md  overflow-y-auto'
    });
    const chatAreaContainer = framework.createElement('div', {
        class: 'chat-area space-y-1 p-4 bg-white rounded-md shadow-inner overflow-y-auto'
    });
    const messageTextArea = framework.createElement('textarea', {
        id: 'messageTextArea',
        class: 'w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500',
        placeholder: 'Type your message...',
        rows: 4,
        disabled: true,
    });
    const sendButton = framework.createElement('button', {
        id: 'sendButton',
        class: 'w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed',
        disabled: true,
    }, 'Send');
    const chatFormContainer = framework.createElement('div', {
        id: 'chat-form',
        class: 'grid grid-cols-1 gap-1 p-6 bg-blue-200 rounded-lg shadow-md w-1/5 ml-auto h-[calc(66vh)]'



    }, [
        userListContainer,
        chatAreaContainer,
        framework.createElement('div', { class: 'message-input space-y-2' }, [
            messageTextArea,
            sendButton,
        ]),
    ]);

    messageTextArea.disabled = true;
    sendButton.disabled = true;
    let activeUser = null;
    let activeUserID = null;

    // Function to render messages for the selected user
    function renderMessages() {
        if (!activeUserID) return;
        chatAreaContainer.innerHTML = '';
        const messages = store.getMessagesWithContact(activeUserID);

        messages.forEach(message => {
            const isCurrentUser = message.sender === store.state.user.details.id;
            const senderNickname = isCurrentUser ? "me" : activeUser;
            const messageElement = framework.createElement(
                'div',
                { class: `message-item ${isCurrentUser ? 'text-right bg-blue-100' : 'text-left bg-gray-100'} p-2 rounded-lg mb-1` },
                `${senderNickname} (${message.created}): ${message.content}`
            );
            framework.appendChildren(chatAreaContainer, messageElement);
        });
    }

    // Update the user list on change
    store.subscribe(() => {
        const users = store.state.users;
        userListContainer.innerHTML = '';

        users.forEach(user => {
            if (user.nickname !== store.state.user.details.nickname) {
                const userItem = framework.createElement(
                    'div',
                    {
                        class: `user-item cursor-pointer p-2 rounded-md ${user.online ? 'bg-green-200' : 'bg-gray-200'} hover:bg-green-300`,
                        'data-nickname': user.nickname
                    },
                    `${user.nickname} (${user.online ? 'Online' : 'Offline'})`
                );
                userItem.addEventListener('click', () => openChatWith(user.nickname, user.online, user.id));
                framework.appendChildren(userListContainer, userItem);
            }
        });
    });

    // Open chat with a selected user
    function openChatWith(nickname, isOnline, userID) {
        activeUser = nickname;
        activeUserID = userID;
        renderMessages();
        messageTextArea.disabled = !isOnline;
        sendButton.disabled = !isOnline;
    }
    store.subscribe(renderMessages);

    // Send button click event to send messages to the selected user if they're online
    handleEvent('chat', '#chat-form', 'click', (event) => {
        if (event.target.matches('#sendButton')) {
            const message = messageTextArea.value.trim();
            if (message && activeUserID) {
                sendMessage(socket, message, activeUserID);
                messageTextArea.value = '';
            }
        }
    });

    return chatFormContainer;
}
