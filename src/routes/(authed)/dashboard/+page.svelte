<script lang="ts">
	export let data;
</script>

<div class="flex gap-8 items-center justify-center flex-wrap h-full overflow-auto p-2">
	{#each data.albums as album (album.id)}
		<a
			class="md:w-40 md:h-40 h-36 w-36 xl:w-52 xl:h-52 overflow-hidden bg-zinc-900 rounded-md"
			href="/album/{album.id}"
		>
			<img
				class="absolute w-full h-full object-cover"
				src={`/api/image/${album.id}`}
				alt={album.title}
			/>
			<div class="bottom-0 left-0 absolute w-full text-center bg-zinc-900/80 text-sm">
				<div class="whitespace-nowrap">{album.albumArtist.name}</div>
				<div class="whitespace-nowrap">{album.title}</div>
				<div class="whitespace-nowrap">{album.releaseDate}</div>
			</div>
		</a>
	{/each}
</div>
