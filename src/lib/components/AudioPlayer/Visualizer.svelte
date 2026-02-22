<script lang="ts">
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

  let canvas: HTMLCanvasElement | null = $state(null);
  let fillColor = $state('#d4c3ff');

  function updateFillColor() {
    if (canvas) {
      fillColor = getComputedStyle(canvas).getPropertyValue('--primary') || '#d4c3ff';
    }
  }

  $effect(() => {
    if (!canvas) return;

    updateFillColor();

    const observer = new MutationObserver(() => {
      updateFillColor();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true
    });

    return () => observer.disconnect();
  });

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

    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight || 100;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d')!;

    // Update canvas dimensions only on actual resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvasWidth = entry.contentRect.width;
        canvasHeight = entry.contentRect.height || 100;
        if (canvas) {
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
        }
      }
    });

    resizeObserver.observe(canvas);

    let animationId: number;

    function draw() {
      if (!analyser || !canvas || !ctx) {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        return;
      }
      animationId = requestAnimationFrame(draw);

      const canvasSize = getCanvasSize(canvasWidth);

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      let x = 0;
      const barWidth = (canvasWidth / bufferLength) * canvasSize * 1.8;

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

        if (x + barWidth > canvasWidth) {
          break;
        }

        ctx.fillStyle = fillColor;

        ctx.beginPath();
        ctx.roundRect(x, canvasHeight - barHeight, barWidth, barHeight, 60);
        ctx.fill();

        x += barWidth + 2;
      }
    }

    draw();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      resizeObserver.disconnect();
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
