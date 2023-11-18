<script lang="ts">
	import { currentTrack, playAlbum } from '$lib/stores/audioPlayer.js';

	export let data;
</script>

<div class="flex flex-col overflow-auto h-full">
	<div
		class="absolute top-0 left-0 w-full h-full after:content-[''] after:w-full after:h-full after:absolute after:top-0 after:left-0 after:backdrop-blur-sm"
	>
		<img
			class="object-cover h-full w-full opacity-5"
			src="/api/image/{data.album.id}"
			alt="Album Art"
		/>
	</div>
	<!-- {data.album.title}
	{data.album.releaseDate}
	{data.album.albumArtist.name}
	<button on:click={() => playAlbum(data.album)}>Plaaaaay</button>
	{#each data.album.tracks as track}
		<div>
			<button on:click={() => currentTrack.set({ track, album: data.album, shouldBePlayed: false })}
				>{track.title}</button
			>
		</div>
	{/each} -->
</div>
