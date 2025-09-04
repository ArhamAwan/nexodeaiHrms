import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function notifyUser(userId: string, message: string) {
	return prisma.notification.create({ data: { userId, message } });
}

export async function notifyManagersOfEmployee(employeeId: string, message: string) {
	const employee = await prisma.employee.findUnique({ where: { id: employeeId }, include: { manager: { include: { user: true } } } });
	if (employee?.manager?.user) {
		await notifyUser(employee.manager.user.id, message);
	}
}
