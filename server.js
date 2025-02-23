const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
const clients = {};

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        const data = JSON.parse(message);
        
        if (data.type === "register") {
            clients[data.id] = ws;
        } else if (clients[data.to]) {
            clients[data.to].send(JSON.stringify(data));
        }
    });

    ws.on("close", () => {
        Object.keys(clients).forEach((key) => {
            if (clients[key] === ws) delete clients[key];
        });
    });
});

console.log("WebSocket signaling server running on port 3000");
