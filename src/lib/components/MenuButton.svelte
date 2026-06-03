<script lang="ts">
  import { DropdownMenu, type WithoutChildren } from 'bits-ui';
  import type { Component, Snippet } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import type { ClassValue } from 'svelte/elements';
  import { fly } from 'svelte/transition';

  import { goto } from '$app/navigation';
  import type { ResolvedPathname } from '$app/types';
  import { vibrate } from '$lib/actions/vibrate';
  import { deviceInfo } from '$lib/states/deviceInfo.svelte';

  import RoundChevronLeft from '~icons/ic/round-chevron-left';
  import RoundChevronRight from '~icons/ic/round-chevron-right';
  import RoundMoreVert from '~icons/ic/round-more-vert';
  import RoundRefresh from '~icons/ic/round-refresh';

  import BottomSheet from './BottomSheet.svelte';
  import Portal from './Portal.svelte';

  export type MenuItem = {
    label: string;
    key?: string;
    icon?: Component<{ class?: ClassValue }>;
    disabled?: boolean;
    loading?: boolean;
    onclick?: () => void | Promise<void>;
    href?: ResolvedPathname;
    subItems?: MenuItem[];
    /**
     * For rendering submenu inside a bottom sheet on mobile.
     */
    subMenu?: Snippet;
    closeOnSelect?: boolean;
    hidden?: boolean;
  };

  interface Props extends WithoutChildren<DropdownMenu.RootProps> {
    children?: Snippet;
    items: MenuItem[];
    contentProps?: WithoutChildren<DropdownMenu.ContentProps>;
    bottomSheetHeader?: Snippet;
  }

  let { children, items, contentProps, bottomSheetHeader, ...rest }: Props = $props();
  let bottomSheetOpen = $state(false);
  let selectedSubMenu = $state<MenuItem | null>(null);
  let subMenuScrollTop = $state(0);

  function filterItems(items: MenuItem[]): MenuItem[] {
    return items
      .filter((item) => !item.hidden)
      .map((item) => ({
        ...item,
        subItems: item.subItems ? filterItems(item.subItems) : undefined
      }));
  }

  let filteredItems = $derived(filterItems(items));
</script>

{#snippet menuItem(item: MenuItem)}
  <DropdownMenu.Item
    closeOnSelect={item.closeOnSelect ?? true}
    disabled={item.disabled || item.loading}
    onSelect={() => {
      if (item.onclick) item.onclick();
      if (item.href) goto(item.href);
    }}
    class="hover:bg-surface-variant/50 flex max-w-3xs cursor-pointer items-center gap-2 px-3 py-2"
  >
    {#if item.icon}
      {#if item.loading}
        <RoundRefresh class="flex-none animate-spin text-lg" />
      {:else}
        <item.icon class="flex-none text-lg" />
      {/if}
    {/if}
    <span class="truncate">
      {item.label}
    </span>
  </DropdownMenu.Item>
{/snippet}

{#snippet subMenu(item: MenuItem)}
  <DropdownMenu.Sub>
    <DropdownMenu.SubTrigger
      class="hover:bg-surface-variant/50 data-[state=open]:bg-surface-variant/50 flex max-w-xs cursor-pointer items-center gap-2 px-3 py-2"
    >
      {#if item.icon}
        <item.icon class="flex-none text-lg" />
      {/if}
      {item.label}
      <RoundChevronRight class="ml-auto" />
    </DropdownMenu.SubTrigger>
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        forceMount
        sideOffset={4}
        style={contentProps?.style}
        class="bg-surface-container text-on-surface overflow-clip rounded-xl"
      >
        {#snippet child({ open, props, wrapperProps })}
          {#if open}
            <div {...wrapperProps}>
              <div {...props} transition:fly={{ y: -4, duration: 150, easing: cubicOut }}>
                {#each item.subItems as subItem (subItem.key ?? subItem.label)}
                  {#if subItem.subItems}
                    {@render subMenu(subItem)}
                  {:else}
                    {@render menuItem(subItem)}
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        {/snippet}
      </DropdownMenu.SubContent>
    </DropdownMenu.Portal>
  </DropdownMenu.Sub>
{/snippet}

{#snippet mobileMenuItem(item: MenuItem)}
  <button
    disabled={item.disabled || item.loading}
    onclick={() => {
      if (item.subMenu || item.subItems) {
        selectedSubMenu = item;
        return;
      }
      if (item.onclick) item.onclick();
      if (item.href) goto(item.href);
    }}
    class="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left"
    use:vibrate
  >
    {#if item.icon}
      {#if item.loading}
        <RoundRefresh class="flex-none animate-spin text-lg" />
      {:else}
        <item.icon class="flex-none text-lg" />
      {/if}
    {/if}
    <span class="truncate">
      {item.label}
    </span>
    {#if item.subMenu || item.subItems}
      <RoundChevronRight class="ml-auto text-lg" />
    {/if}
  </button>
{/snippet}

{#if deviceInfo.isMobile.current}
  <button
    onclick={(e) => {
      e.stopPropagation();
      bottomSheetOpen = true;
    }}
    use:vibrate
    aria-label="More options"
  >
    {#if children}
      {@render children()}
    {:else}
      <RoundMoreVert class="text-lg" />
    {/if}
  </button>

  <Portal style={contentProps?.style as string}>
    <BottomSheet
      open={bottomSheetOpen}
      onclose={() => {
        bottomSheetOpen = false;
        selectedSubMenu = null;
      }}
      containerProps={{
        onscrolltopchange: (e) => {
          subMenuScrollTop = e.detail.scrollTop;
        }
      }}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="text-on-surface relative grid place-items-center justify-items-start overflow-clip"
        onclick={(e) => e.stopPropagation()}
      >
        {#if selectedSubMenu}
          {#key selectedSubMenu.key ?? selectedSubMenu.label}
            <div
              class="col-start-1 col-end-1 row-start-1 row-end-1 w-full"
              in:fly|global={{ x: 300, duration: 250, easing: cubicOut }}
            >
              <div
                class={[
                  'bg-surface-container sticky top-0 z-10 flex items-center gap-2 px-4 pb-3 transition-shadow',
                  subMenuScrollTop > 0 && 'shadow-md'
                ]}
              >
                <button
                  class="flex items-center justify-center"
                  use:vibrate
                  onclick={() => (selectedSubMenu = null)}
                  aria-label="Back to menu"
                >
                  <RoundChevronLeft class="text-xl" />
                </button>
                <div class="font-semibold">{selectedSubMenu.label}</div>
              </div>

              <div class="px-4">
                {#if selectedSubMenu.subMenu}
                  {@render selectedSubMenu.subMenu()}
                {:else if selectedSubMenu.subItems}
                  {#each selectedSubMenu.subItems as subItem (subItem.key ?? subItem.label)}
                    {@render mobileMenuItem(subItem)}
                  {/each}
                {/if}
              </div>
            </div>
          {/key}
        {:else}
          <div
            class="col-start-1 col-end-1 row-start-1 row-end-1 w-full px-4"
            in:fly={{ x: -300, duration: 250, easing: cubicOut }}
          >
            {@render bottomSheetHeader?.()}

            {#each filteredItems as item (item.key ?? item.label)}
              {@render mobileMenuItem(item)}
            {/each}
          </div>
        {/if}
      </div>
    </BottomSheet>
  </Portal>
{:else}
  <DropdownMenu.Root {...rest}>
    <DropdownMenu.Trigger>
      {#if children}
        {@render children()}
      {:else}
        <RoundMoreVert class="text-lg" />
      {/if}
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        {...contentProps}
        class={[
          'bg-surface-container text-on-surface overflow-clip rounded-xl',
          contentProps?.class
        ]}
        forceMount
      >
        {#snippet child({ open, props, wrapperProps })}
          {#if open}
            <div {...wrapperProps}>
              <div {...props} transition:fly={{ y: -4, duration: 150, easing: cubicOut }}>
                {#each filteredItems as item (item.key ?? item.label)}
                  {#if item.subItems}
                    {@render subMenu(item)}
                  {:else}
                    {@render menuItem(item)}
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        {/snippet}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
{/if}
