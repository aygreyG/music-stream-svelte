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

  const FALLBACK_COLOR = '#d4c3ff';

  function getCanvasSize(canvasWidth: number): number {
    if (sizeMultiplier !== 'auto') {
      return sizeMultiplier;
    }

    if (canvasWidth > 1250) {
      return 1;
    } else if (canvasWidth > 700) {
      return 2;
    } else if (canvasWidth > 500) {
      return 4;
    } else {
      return 5;
    }
  }

  $effect(() => {
    if (!canvas || !analyser) return;

    const el = canvas;
    const node = analyser;

    node.fftSize = 512;
    const bufferLength = node.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = el.getContext('2d')!;

    const padding = 1;

    // Layout only depends on canvas size, so it is computed on resize instead of per frame.
    let width = 0;
    let height = 0;
    let barCount = 0;
    let barWidth = 0;
    let step = 0;
    let canvasSize = 5;
    let drawHeight = 0;

    function layout(nextWidth?: number, nextHeight?: number) {
      width = nextWidth ?? el.clientWidth;
      height = (nextHeight ?? el.clientHeight) || 100;

      const dpr = window.devicePixelRatio || 1;
      const deviceWidth = Math.round(width * dpr);
      const deviceHeight = Math.round(height * dpr);

      if (el.width !== deviceWidth || el.height !== deviceHeight) {
        el.width = deviceWidth;
        el.height = deviceHeight;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const drawWidth = width - padding * 2;
      const minGap = 2;
      canvasSize = getCanvasSize(width);
      barWidth = (drawWidth / bufferLength) * canvasSize * 1.8;
      const totalBars = Math.floor(bufferLength / canvasSize / 2);
      barCount = Math.min(totalBars, Math.floor((drawWidth + minGap) / (barWidth + minGap)));
      const gap = barCount > 1 ? (drawWidth - barCount * barWidth) / (barCount - 1) : 0;
      step = barWidth + gap;
      drawHeight = height - padding;
    }

    layout();

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      layout(rect?.width, rect?.height);
    });
    resizeObserver.observe(el);

    let animationId = 0;
    let running = false;

    // The album color scheme is applied as an inherited CSS custom property, so it
    // is read from the canvas rather than observed. Sampled instead of every frame.
    let fillColor = FALLBACK_COLOR;
    let lastColorCheck = 0;

    function refreshFillColor(now: number) {
      if (now - lastColorCheck < 100) return;
      lastColorCheck = now;
      const color = getComputedStyle(el).getPropertyValue('--primary').trim();
      fillColor = color || FALLBACK_COLOR;
    }

    function draw(now: number) {
      if (!running) return;
      animationId = requestAnimationFrame(draw);
      refreshFillColor(now);

      node.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      const baseline = height - padding;
      ctx.fillStyle = fillColor;

      // One path for all bars, filled in a single draw call.
      ctx.beginPath();
      let x = padding;
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * canvasSize];

        if (value) {
          const barHeight = (value / 255) * drawHeight;
          if (barHeight >= 1) {
            ctx.roundRect(x, baseline - barHeight, barWidth, barHeight, 60);
          }
        }

        x += step;
      }
      ctx.fill();
    }

    function start() {
      if (running) return;
      running = true;
      animationId = requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      }
    }

    // Skip work while the canvas is hidden (e.g. reduced motion, off-screen).
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) start();
      else stop();
    });
    intersectionObserver.observe(el);

    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
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
