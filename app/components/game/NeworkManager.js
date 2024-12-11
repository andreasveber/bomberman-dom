export class NetworkManager {
    constructor() {
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.lastPingTime = 0;
        this.pingInterval = 30000;
    }

    connect(url) {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url);
                this.setupEventHandlers(resolve, reject);
                this.startPingInterval();
            } catch (error) {
                reject(error);
            }
        });
    }

    setupEventHandlers(resolve, reject) {
        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            resolve(this.ws);
        };

        this.ws.onclose = () => {
            this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
            reject(error);
        };
    }

    startPingInterval() {
        setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
                this.lastPingTime = Date.now();
            }
        }, this.pingInterval);
    }

    handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect(this.ws.url);
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
        }
    }
}
