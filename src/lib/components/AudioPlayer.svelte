<script lang="ts">
	import RoundPlayCircleOutline from 'virtual:icons/ic/round-play-circle-outline';
	import RoundPauseCircleOutline from 'virtual:icons/ic/round-pause-circle-outline';
	import RoundSkipPrevious from 'virtual:icons/ic/round-skip-previous';
	import RoundSkipNext from 'virtual:icons/ic/round-skip-next';
	import RoundVolumeUp from 'virtual:icons/ic/round-volume-up';
	import RoundVolumeDown from 'virtual:icons/ic/round-volume-down';
	import RoundVolumeMute from 'virtual:icons/ic/round-volume-mute';
	import RoundVolumeOff from 'virtual:icons/ic/round-volume-off';
	import RoundRepeat from 'virtual:icons/ic/round-repeat';
	import RoundShuffle from 'virtual:icons/ic/round-shuffle';
	import type { SignedInUser } from '$lib/shared/types';
	import { currentTrack, playNext } from '$lib/stores/audioPlayer';

	export let user: SignedInUser | null = null;

	let player: HTMLAudioElement;
	let paused = true;
	let currentTime = 0;
	let duration: number;
	let volume = 0.1;
	let prevVolume = volume;
	let durationString = '--:--';
	let currentString = '--:--';
	let repeat = false;
	let shuffle = false;

	function togglePlay() {
		if (!$currentTrack) {
			return;
		}
		if (paused) {
			player.pause();
		} else {
			player.play();
		}

		paused = !paused;
	}

	function updateVolume(e: WheelEvent) {
		volume = Math.max(0, Math.min(1, volume + (e.deltaY < 0 ? 0.05 : -0.05)));
	}

	$: if (duration) {
		durationString = new Date(duration * 1000).toISOString().slice(14, 19);
		if (currentTime === 0) {
			currentString = '00:00';
		}
	} else {
		durationString = '--:--';
	}

	$: if (currentTime) {
		currentString = new Date(currentTime * 1000).toISOString().slice(14, 19);
	} else {
		currentString = '--:--';
	}

	currentTrack.subscribe((val) => {
		if (val && !val.shouldBePlayed) {
			paused = true;
		}
	});
</script>

<div class="h-full p-2">
	{#if user}
		<div class="flex h-full w-full gap-4 px-2">
			<div class="sm:flex hidden w-40 h-full justify-start items-center">
				<div class="h-40 w-40 overflow-hidden rounded-md bg-zinc-600/50">
					{#if $currentTrack}
						<audio
							preload="metadata"
							src="/api/play/{$currentTrack.track.id}"
							bind:currentTime
							bind:duration
							bind:paused
							bind:this={player}
							bind:volume
							autoplay={$currentTrack.shouldBePlayed}
						/>
						<div
							class="flex flex-col absolute overflow-hidden z-10 bg-zinc-900/80 text-center bottom-0 left-0 w-full"
						>
							<a
								href="/album/{$currentTrack.album.id}"
								class="whitespace-nowrap text-xl font-bold hover:underline"
							>
								{$currentTrack.track.title}
							</a>
							<a
								href="/artist/{$currentTrack.track.artists[0].id}"
								class="whitespace-nowrap hover:underline"
							>
								{$currentTrack.track.artists.map((a) => a.name).join(', ')}
							</a>
						</div>
						<a href="/album/{$currentTrack.album.id}">
							<img
								class="object-cover rounded-md"
								src="/api/image/{$currentTrack.album.id}"
								alt="Album Art"
							/>
						</a>
					{/if}
				</div>
			</div>
			<div class="flex flex-col justify-around h-full w-full">
				<div class="flex justify-between gap-2 items-center whitespace-nowrap sm:order-2">
					<div class="timer">{currentString}</div>
					<input
						class="w-full"
						type="range"
						min="0"
						max={duration}
						step="0.01"
						bind:value={currentTime}
					/>
					<div class="timer">{durationString}</div>
				</div>
				<div class="flex gap-2 justify-center sm:justify-around lg:justify-center items-center">
					<div class="flex gap-4">
						<button
							on:click={() => (shuffle = !shuffle)}
							class="text-2xl transition-colors"
							class:text-fuchsia-600={shuffle}
							class:text-zinc-400={!shuffle}
						>
							<RoundShuffle />
						</button>
						<button
							on:click={playNext}
							class="text-3xl text-zinc-400 active:text-zinc-600 transition-colors"
						>
							<RoundSkipPrevious />
						</button>
						<button
							on:click={togglePlay}
							class="text-6xl text-zinc-400 active:text-zinc-600 transition-colors"
						>
							{#if paused}
								<RoundPlayCircleOutline />
							{:else}
								<RoundPauseCircleOutline />
							{/if}
						</button>
						<button
							on:click={playNext}
							class="text-3xl text-zinc-400 active:text-zinc-600 transition-colors"
						>
							<RoundSkipNext />
						</button>
						<button
							on:click={() => (repeat = !repeat)}
							class="text-2xl transition-colors"
							class:text-fuchsia-600={repeat}
							class:text-zinc-400={!repeat}
						>
							<RoundRepeat />
						</button>
					</div>
					<div
						class="sm:flex hidden gap-2 items-center lg:absolute right-0"
						on:mousewheel={updateVolume}
					>
						<button
							on:click={() => {
								if (volume === 0) {
									volume = prevVolume;
								} else {
									prevVolume = volume;
									volume = 0;
								}
							}}
						>
							{#if volume === 0}
								<RoundVolumeOff class="text-3xl text-zinc-400" />
							{:else if volume < 0.3}
								<RoundVolumeMute class="text-3xl text-zinc-400" />
							{:else if volume < 0.7}
								<RoundVolumeDown class="text-3xl text-zinc-400" />
							{:else}
								<RoundVolumeUp class="text-3xl text-zinc-400" />
							{/if}
						</button>
						<input type="range" min="0" max="1" step="0.01" bind:value={volume} />
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		@apply h-4 rounded-full bg-zinc-600 cursor-pointer outline-none overflow-hidden;
	}

	input[type='range']::-webkit-slider-runnable-track {
		@apply bg-zinc-600 rounded-full h-4;
	}

	input[type='range']::-moz-range-track {
		@apply bg-zinc-600 rounded-full h-4;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		border: 2px solid rgb(192 38 211);
		box-shadow: -407px 0 0 400px rgb(192 38 211);
		@apply w-4 h-4 bg-zinc-300 rounded-full;
	}

	input[type='range']::-moz-range-thumb {
		border: 2px solid rgb(192 38 211);
		box-shadow: -407px 0 0 400px rgb(192 38 211);
		@apply w-3 h-3 bg-zinc-300 rounded-full;
	}

	input[type='range']:focus {
		outline: none;
	}

	.timer {
		font-variant-numeric: tabular-nums;
		text-align: center;
	}
</style>
