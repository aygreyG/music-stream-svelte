<script lang="ts">
  import type { Component } from 'svelte';
  import type { SVGAttributes } from 'svelte/elements';

  import { page } from '$app/state';
  import type { ResolvedPathname } from '$app/types';
  import { vibrate } from '$lib/actions/vibrate';

  interface Props {
    href: ResolvedPathname;
    text: string;
    Icon: Component<SVGAttributes<SVGSVGElement>>;
    onclickedelement?: () => void;
    iconOnly?: boolean;
    subtext?: string;
    class?: string;
  }

  let {
    href,
    text,
    Icon,
    onclickedelement,
    iconOnly = false,
    subtext,
    class: className = ''
  }: Props = $props();

  let currentPage = $derived(page.url.pathname);
  let active = $derived(currentPage.replaceAll('/', '') === href.replaceAll('/', ''));
</script>

<div class={className}>
  <a
    onclick={() => onclickedelement?.()}
    class={[
      'relative flex items-center transition-colors',
      iconOnly &&
        'aspect-square h-auto w-full shrink-0 justify-center rounded-full p-3 text-2xl active:scale-95 sm:p-0 sm:text-sm',
      iconOnly && !active && 'hover:bg-on-surface-variant/15',
      !iconOnly && 'gap-2 rounded-2xl px-16 py-2 text-2xl font-bold sm:px-4 sm:text-base',
      active && 'bg-primary text-on-primary'
    ]}
    {href}
    aria-label={iconOnly ? text : undefined}
    title={iconOnly ? text : undefined}
    use:vibrate
  >
    <Icon />
    {#if iconOnly}
      {#if subtext}
        <span
          class="bg-surface-variant text-on-surface-variant absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-1 text-[0.4em] leading-tight font-bold whitespace-nowrap shadow-sm sm:bottom-1"
        >
          {subtext}
        </span>
      {/if}
    {:else}
      {text}
    {/if}
  </a>
</div>
