<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    class?: string;
    /** Delay in seconds before the first scroll cycle starts. */
    delay?: number;
    /** Scroll speed in pixels per second. */
    speed?: number;
    /** Width of the gradient fade mask at each edge in pixels. */
    fadeWidth?: number;
    /** If true, plays indefinitely. Otherwise, plays one back-and-forth cycle then can be retriggered on hover. */
    indefinite?: boolean;
  }

  let {
    children,
    class: className,
    delay = 2,
    speed = 30,
    fadeWidth = 12,
    indefinite = false
  }: Props = $props();

  let container: HTMLDivElement = $state(null!);
  let inner: HTMLDivElement = $state(null!);
  let isOverflowing = $state(false);
  let distance = $state(0);
  let isAnimationRunning = $state(false);
  let firstCycleCompleted = $state(false);

  function retrigger() {
    if (indefinite || !isOverflowing || !container || !inner || isAnimationRunning) return;
    container.classList.remove('marquee-masked', 'marquee-once');
    inner.classList.remove('marquee-scrolling');
    requestAnimationFrame(() => {
      container.classList.add('marquee-masked', 'marquee-once');
      inner.classList.add('marquee-scrolling');
    });
  }

  function onScrollAnimationStart() {
    isAnimationRunning = true;
  }

  function onScrollAnimationEnd() {
    isAnimationRunning = false;
    firstCycleCompleted = true;
  }

  $effect(() => {
    if (!container || !inner) return;

    const ro = new ResizeObserver(() => {
      const overflow = inner.scrollWidth > container.clientWidth;
      isOverflowing = overflow;
      if (overflow) {
        distance = inner.scrollWidth - container.clientWidth;
      }
    });

    ro.observe(container);
    ro.observe(inner);

    return () => ro.disconnect();
  });

  $effect(() => {
    if (!container || indefinite) return;
    container.addEventListener('mouseleave', retrigger);
    return () => container.removeEventListener('mouseleave', retrigger);
  });
</script>

<div
  bind:this={container}
  class={[
    'overflow-hidden',
    isOverflowing && 'marquee-masked',
    !indefinite && isOverflowing && 'marquee-once',
    className
  ]}
  style:--marquee-distance="-{distance}px"
  style:--marquee-delay="{indefinite || !firstCycleCompleted ? delay : 0}s"
  style:--marquee-duration="{Math.max(3, distance / speed)}s"
  style:--fade-width="{fadeWidth}px"
>
  <div
    bind:this={inner}
    class={[
      'w-max whitespace-nowrap not-motion-reduce:inline-flex',
      isOverflowing &&
        'marquee-scrolling motion-reduce:max-w-full motion-reduce:overflow-hidden motion-reduce:text-ellipsis'
    ]}
    onanimationstart={onScrollAnimationStart}
    onanimationend={onScrollAnimationEnd}
  >
    {@render children()}
  </div>
</div>

<style>
  .marquee-masked {
    mask-image:
      linear-gradient(to right, transparent, black var(--fade-width)),
      linear-gradient(to left, transparent, black var(--fade-width));
    mask-size:
      calc(100% + var(--fade-width)) 100%,
      calc(100% + var(--fade-width)) 100%;
    mask-repeat: no-repeat;
    mask-composite: intersect;
    -webkit-mask-composite: source-in;
    mask-position:
      calc(-1 * var(--fade-width)) 0,
      calc(-1 * var(--fade-width)) 0;
    animation: marquee-mask var(--marquee-duration) ease-in-out infinite alternate;
    animation-delay: var(--marquee-delay);
  }

  .marquee-scrolling {
    animation: marquee-scroll var(--marquee-duration) ease-in-out infinite alternate;
    animation-delay: var(--marquee-delay);
  }

  .marquee-masked:hover {
    animation-play-state: paused;
  }

  .marquee-masked:hover .marquee-scrolling {
    animation-play-state: paused;
  }

  .marquee-once {
    animation-iteration-count: 2;
  }

  .marquee-once .marquee-scrolling {
    animation-iteration-count: 2;
  }

  @media (prefers-reduced-motion: reduce) {
    .marquee-masked {
      mask-image: none;
      animation: none;
    }

    .marquee-scrolling {
      animation: none;
    }
  }

  @keyframes marquee-scroll {
    0%,
    20% {
      transform: translateX(0);
    }
    80%,
    100% {
      transform: translateX(var(--marquee-distance));
    }
  }

  @keyframes marquee-mask {
    0%,
    10% {
      mask-position:
        calc(-1 * var(--fade-width)) 0,
        calc(-1 * var(--fade-width)) 0;
    }
    25%,
    75% {
      mask-position:
        0 0,
        calc(-1 * var(--fade-width)) 0;
    }
    90%,
    100% {
      mask-position:
        0 0,
        0 0;
    }
  }
</style>
