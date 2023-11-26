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
				class="w-full h-full object-cover rounded-lg"
				src={`/api/image/${album.id}`}
				alt={album.id.replaceAll('-', '')}
			/>
			<div class="bottom-0 left-0 absolute w-full text-center flex justify-end flex-col gap-1 p-1">
				<div
					class="whitespace-nowrap z-10 text-ellipsis overflow-hidden bg-zinc-900/80 backdrop-blur-sm rounded-md px-1"
				>
					{album.title}
				</div>
				<div class="whitespace-nowrap z-10 bg-zinc-900/80 backdrop-blur-sm rounded-md text-xs px-1">
					{album.albumArtist.name}
				</div>
			</div>
		</a>
	{/each}
</div>
