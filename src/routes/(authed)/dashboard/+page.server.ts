import prisma from '$lib/server/prisma';

export const load = async () => {
	return {
		albums: prisma.album.findMany({ include: { albumArtist: true } })
	};
};
