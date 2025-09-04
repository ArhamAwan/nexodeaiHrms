import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
	if (!socket) {
		socket = io({ path: "/api/socket", transports: ["websocket"], autoConnect: false });
	}
	return socket;
}

export function connectPresence(userId: string) {
	const s = getSocket();
	s.auth = { userId };
	s.connect();
	return s;
}

export function onPresence(cb: (payload: { userId: string; status: string }) => void) {
	const s = getSocket();
	s.on("presence", cb);
	return () => s.off("presence", cb);
}
