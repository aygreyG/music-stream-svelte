import prisma from '$lib/server/prisma';

export const load = async () => {
	const albums = await prisma.album.findMany({ include: { albumArtist: true } });

	return {
		albums
	};
};
