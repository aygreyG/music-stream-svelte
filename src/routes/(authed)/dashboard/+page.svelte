<script lang="ts">
	export let data;
</script>

<div class="flex gap-4 p-2 items-center justify-center flex-wrap">
	{#each data.albums as album}
		<a class="w-40 h-40 overflow-hidden bg-zinc-900 rounded-md" href="/album/{album.id}">
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
