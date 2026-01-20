<script lang="ts">
  import { getAudioPlayer } from '$lib/states/audioPlayer.svelte';

  interface Props {
    analyser: AnalyserNode | null;
    class?: string;
    /**
     * Size multiplier for canvas size calculation.
     * Higher values = fewer bars. Use `auto` to let the component decide based on canvas width.
     */
    sizeMultiplier?: number | 'auto';
  }

  let { analyser, class: className = '', sizeMultiplier = 'auto' }: Props = $props();

  const audioPlayer = getAudioPlayer();

  let canvas: HTMLCanvasElement | null = $state(null);

  function getCanvasSize(canvasWidth: number): number {
    if (sizeMultiplier !== 'auto') {
      return sizeMultiplier;
    }

    if (canvasWidth > 1250) {
      return 1;
    } else if (canvasWidth > 500) {
      return 2;
    } else {
      return 4;
    }
  }

  $effect(() => {
    if (!canvas || !analyser) return;

    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight || 100;
    const ctx = canvas.getContext('2d')!;

    let animationId: number;

    function draw() {
      if (!analyser || !canvas || !ctx) {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        return;
      }
      animationId = requestAnimationFrame(draw);

      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight || 100;

      const canvasSize = getCanvasSize(canvas.width);

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let x = 0;
      const barWidth = (canvas.width / bufferLength) * canvasSize * 1.8;

      for (let i = 0; i < (bufferLength / 2) * canvasSize; i++) {
        const value = dataArray[i * canvasSize];

        if (!value) {
          x += barWidth + 2;
          continue;
        }

        const barHeight = value / 2;

        if (barHeight < 1) {
          x += barWidth + 2;
          continue;
        }

        if (x + barWidth > canvas.width) {
          break;
        }

        ctx.fillStyle =
          audioPlayer.currentTrack?.album.albumArtLightVibrant ||
          getComputedStyle(document.body).getPropertyValue('--color-primary') ||
          '#71717a';

        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 60);
        ctx.fill();

        x += barWidth + 2;
      }
    }

    draw();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  });

  export function clearCanvas() {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
</script>

<canvas bind:this={canvas} class={className}></canvas>
