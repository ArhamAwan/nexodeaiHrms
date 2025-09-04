import type { NextApiRequest } from "next";
import { Server as NetServer } from "http";
import { Server as IOServer } from "socket.io";

export const config = { api: { bodyParser: false } };

type SocketServer = NetServer & { io?: IOServer };

type NextApiResponseServerIo = {
	status: (code: number) => void;
	json: (data: unknown) => void;
	socket: { server: SocketServer };
};

export default function handler(_req: NextApiRequest, res: NextApiResponseServerIo) {
	// @ts-ignore
	if (res.socket.server.io) {
		res.status(200);
		res.json({ ready: true });
		return;
	}
	const httpServer: SocketServer = res.socket.server as SocketServer;
	const io = new IOServer(httpServer, { path: "/api/socket" });
	httpServer.io = io;

	io.on("connection", (socket) => {
		const userId = (socket.handshake.auth as any)?.userId;
		if (userId) {
			socket.join(`user:${userId}`);
			io.emit("presence", { userId, status: "online" });
			socket.on("disconnect", () => {
				io.emit("presence", { userId, status: "offline" });
			});
		}
	});

	res.status(200);
	res.json({ ready: true });
}
