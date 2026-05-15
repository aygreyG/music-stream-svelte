<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import type { ClassValue } from 'svelte/elements';
  import { fly } from 'svelte/transition';

  import { beforeNavigate } from '$app/navigation';
  import type { ResolvedPathname } from '$app/types';
  import { vibrate } from '$lib/actions/vibrate';
  import { deviceInfo } from '$lib/states/deviceInfo.svelte';

  import RoundChevronLeft from '~icons/ic/round-chevron-left';
  import RoundChevronRight from '~icons/ic/round-chevron-right';
  import RoundRefresh from '~icons/ic/round-refresh';

  import BottomSheet from './BottomSheet.svelte';
  import Popover from './Popover.svelte';
  import Portal from './Portal.svelte';

  export type MenuOption = {
    label: string;
    icon?: Component<{ class?: ClassValue }>;
    hidden?: boolean;
    disabled?: boolean;
    loading?: boolean;
    onclick?: () => void | Promise<void>;
    href?: ResolvedPathname;
    /**
     * Mobile: navigates to the submenu view instead of calling onclick.
     * Desktop: shows a side popover only when desktopSubmenu is true, otherwise calls onclick.
     */
    submenu?: {
      title: string;
      content: Snippet;
    };
    /** When true, desktop also shows a side popover for this option's submenu. */
    desktopSubmenu?: boolean;
  };

  interface Props {
    open: boolean;
    onclose: () => void;
    anchor?: HTMLElement | null;
    options: MenuOption[];
    /** Rendered above the options list in the mobile sheet. */
    header?: Snippet;
    style?: string;
  }

  let { open, onclose, anchor = null, options, header, style = '' }: Props = $props();

  let activeSubmenu = $state<MenuOption['submenu'] | null>(null);
  let desktopSubmenuAnchor = $state<HTMLButtonElement | null>(null);
  let mainPopoverEl = $state<HTMLDivElement | null>(null);
  let scrolledFromTop = $state(false);

  const isMobile = $derived(deviceInfo.isMobile);

  beforeNavigate((navigation) => {
    if (navigation.type === 'popstate') {
      if (activeSubmenu && open) {
        navigation.cancel();
        activeSubmenu = null;
      } else if (open) {
        navigation.cancel();
        onclose();
      }
    }
  });

  $effect(() => {
    if (open) {
      activeSubmenu = null;
    }
  });

  async function handleOptionClick(option: MenuOption, buttonEl?: HTMLButtonElement | null) {
    if (option.disabled || option.loading) return;
    if (option.submenu && isMobile) {
      activeSubmenu = option.submenu;
    } else if (option.submenu && option.desktopSubmenu && !isMobile) {
      // Desktop: toggle submenu popover
      if (activeSubmenu === option.submenu) {
        activeSubmenu = null;
        desktopSubmenuAnchor = null;
      } else {
        activeSubmenu = option.submenu;
        desktopSubmenuAnchor = buttonEl ?? null;
      }
    } else {
      activeSubmenu = null;
      desktopSubmenuAnchor = null;
      await option.onclick?.();
    }
  }
</script>

{#snippet renderOptions(compact: boolean)}
  {#each options as option (option.label)}
    {#if !option.hidden}
      {@const Icon = option.icon}
      {#if option.href}
        <!-- We already make sure that only resolved paths are used -->
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          href={option.href}
          class={[
            'flex w-full items-center gap-3 text-left',
            compact
              ? 'hover:bg-on-surface/10 px-4 py-2 text-sm transition-colors'
              : 'rounded-lg px-2 py-2.5'
          ]}
          use:vibrate
          onclick={() => onclose()}
        >
          {#if Icon}
            <Icon class={['shrink-0', compact ? 'text-lg' : 'text-xl']} />
          {/if}
          <span>{option.label}</span>
        </a>
      {:else}
        <button
          class={[
            'flex w-full items-center gap-3 text-left disabled:opacity-50',
            compact
              ? 'hover:bg-on-surface/10 px-4 py-2 text-sm transition-colors'
              : 'rounded-lg px-2 py-2.5'
          ]}
          disabled={option.disabled || option.loading}
          use:vibrate
          onclick={(e) => handleOptionClick(option, e.currentTarget as HTMLButtonElement)}
        >
          {#if option.loading}
            <RoundRefresh class={['shrink-0 animate-spin', compact ? 'text-lg' : 'text-xl']} />
          {:else if Icon}
            <Icon class={['shrink-0', compact ? 'text-lg' : 'text-xl']} />
          {/if}
          <span>{option.label}</span>
          {#if option.submenu && isMobile}
            <RoundChevronRight class="ml-auto text-xl" />
          {:else if option.submenu && option.desktopSubmenu && !isMobile}
            <RoundChevronRight class="ml-auto text-lg" />
          {/if}
        </button>
      {/if}
    {/if}
  {/each}
{/snippet}

<Portal class="text-on-surface" {style}>
  {#if isMobile}
    <BottomSheet
      onscroll={(e) => {
        const target = e.target as HTMLDivElement;
        scrolledFromTop = target.scrollTop > 0;
      }}
      {open}
      {onclose}
    >
      <div class="relative grid place-items-center justify-items-start overflow-clip">
        {#if activeSubmenu}
          <div
            class="col-start-1 col-end-1 row-start-1 row-end-1 w-full"
            in:fly={{ x: 300, duration: 250, easing: cubicOut }}
          >
            <div
              class={[
                'bg-surface-container sticky top-0 z-10 mb-3 flex items-center gap-2 px-4 transition-shadow',
                scrolledFromTop && 'shadow-md'
              ]}
            >
              <button
                class="hover:bg-on-surface/10 flex items-center justify-center rounded-lg p-1.5 transition-colors"
                use:vibrate
                onclick={() => (activeSubmenu = null)}
                aria-label="Back to menu"
              >
                <RoundChevronLeft class="text-xl" />
              </button>
              <div class="font-semibold">{activeSubmenu.title}</div>
            </div>
            <div class="px-4">
              {@render activeSubmenu.content()}
            </div>
          </div>
        {:else}
          <div
            class="col-start-1 col-end-1 row-start-1 row-end-1 w-full px-4"
            in:fly={{ x: -300, duration: 250, easing: cubicOut }}
          >
            {@render header?.()}
            <div class="flex flex-col">
              {@render renderOptions(false)}
            </div>
          </div>
        {/if}
      </div>
    </BottomSheet>
  {:else}
    <div bind:this={mainPopoverEl}>
      <Popover
        {open}
        onclose={() => {
          activeSubmenu = null;
          desktopSubmenuAnchor = null;
          onclose();
        }}
        {anchor}
      >
        <div class="flex flex-col">
          {@render renderOptions(true)}
        </div>
      </Popover>
    </div>
    {#if activeSubmenu && desktopSubmenuAnchor}
      <Popover
        open={true}
        onclose={() => {
          activeSubmenu = null;
          desktopSubmenuAnchor = null;
        }}
        anchor={desktopSubmenuAnchor}
        side="right"
        offset={{ top: -20 }}
        excludeFromClickOutside={mainPopoverEl}
      >
        <div class="flex flex-col">
          {@render activeSubmenu.content()}
        </div>
      </Popover>
    {/if}
  {/if}
</Portal>
