import type { ServerSettings } from '@prisma/client';
import prisma from './prisma';

let serverSettings: ServerSettings | null = null;
let requestedServerSettings = false;

export async function createServerSettings(folderPath: string) {
	const newSettings = await prisma.serverSettings.create({
		data: {
			musicFolder: folderPath
		}
	});

	serverSettings = newSettings;

	return newSettings;
}

export async function getServerSettings() {
	if (serverSettings) {
		return serverSettings;
	}

	if (!requestedServerSettings) {
		const settings = await prisma.serverSettings.findFirst();
		serverSettings = settings;
		requestedServerSettings = true;
	}

	return serverSettings;
}
