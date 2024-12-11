export const store = {
    state: {
        user: {
            isLoggedIn: false,
            details: null
        },
        message: {
            details: null
        },
        users: [],
        messages: [],

        stats: {
            lives: 0,
            players: 0,
            timer: '0:00'
        }
    },
    setStats(newStats) {
        this.state.stats = { ...this.state.stats, ...newStats };
        this.notifySubscribers();
    },
    setMessages(messages) {
        this.state.messages = messages;
        this.notifySubscribers();
    },
    setUsers(users) {
        this.state.users = users;
        this.notifySubscribers();
    },
    setUser(userData) {
        this.state.user = {
            isLoggedIn: true,
            details: userData,
        };
        this.notifySubscribers();
    },
    updateUserStatus(id, nickname, onlineStatus) {
        let userFound = false;

        this.state.users = this.state.users.map(user => {
            if (user.nickname === nickname) {
                userFound = true;
                return { ...user, online: onlineStatus };
            }
            return user;
        });
        if (!userFound) {
            this.state.users.push({
                id: id,
                password: '',
                nickname: nickname,
                online: onlineStatus
            });
        }
        this.notifySubscribers();
    },

    getMessagesWithContact(contactID) {
        const currentUserID = this.state.user.details.id;
        return this.state.messages.filter((message) =>
            (message.sender === currentUserID && message.recipient === contactID) ||
            (message.recipient === currentUserID && message.sender === contactID)
        );
    },

    addChatMessage(message) {
        this.state.messages.push(message);
        this.notifySubscribers();
    },
    getUser() {
        return this.state.user.details;
    },

    isUserLoggedIn() {
        return this.state.user.isLoggedIn;
    },
    logoutUser() {
        this.state.user = { isLoggedIn: false, details: null };
        this.state.users = { users: [] };
        this.state.messages = { messages: [] };
        this.notifySubscribers();
    },
    getUsers() {
        return this.state.users;
    },
    getMessages() {
        return this.state.messages;
    },
    // Subscription handling (if needed)
    subscribers: [],
    subscribe(callback) {
        if (typeof callback === 'function') {
            this.subscribers.push(callback);
        } else {
            console.warn("subscribe callback must be a function");
        }
    },
    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    },
};