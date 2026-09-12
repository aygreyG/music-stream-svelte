<script lang="ts">
  import { fade } from 'svelte/transition';

  import { beforeNavigate } from '$app/navigation';
  import { vibrate } from '$lib/actions/vibrate';
  import type { SignedInUser } from '$lib/shared/types';

  import RoundClose from '~icons/ic/round-close';
  import RoundMenu from '~icons/ic/round-menu';

  import NavigationElements from './NavigationElements.svelte';

  interface Props {
    user?: SignedInUser | null;
    appVersion?: string;
  }

  let { user = null, appVersion }: Props = $props();
  let open: boolean = $state(false);

  beforeNavigate((navigation) => {
    if (open) {
      navigation.cancel();
      open = false;
    }
  });
</script>

<div class="hidden h-full w-48 flex-none sm:flex">
  <div
    class="bg-surface flex h-full w-full flex-col gap-2 overflow-y-auto rounded-xl p-4 transition-colors duration-500"
  >
    <NavigationElements {user} />
    {#if user}
      <div class="border-outline-variant/40 mt-auto flex w-full items-center gap-0.5 border-t pt-2">
        <NavigationElements variant="utility" stretch {user} {appVersion} />
      </div>
    {/if}
  </div>
</div>

<div
  class="bg-surface-variant absolute top-24 -right-1 z-50 flex items-center justify-center rounded-s-xl shadow-md backdrop-blur-md transition-colors duration-300 sm:hidden"
>
  <button use:vibrate onclick={() => (open = !open)} aria-label={open ? 'Close menu' : 'Open menu'}>
    {#if open}
      <RoundClose
        class="text-on-surface-variant hover:text-primary active:text-primary text-4xl transition-colors duration-500"
      />
    {:else}
      <RoundMenu
        class="text-on-surface-variant hover:text-primary active:text-primary text-4xl transition-colors duration-500"
      />
    {/if}
  </button>
</div>

<div
  class={[
    'bg-surface/95 absolute top-0 z-40 flex h-full justify-center overflow-x-clip overflow-y-auto rounded-xl backdrop-blur-md transition-all duration-300 sm:hidden',
    open ? 'left-0 w-full' : 'left-full w-0'
  ]}
>
  {#if open}
    <div class="flex h-full w-full flex-col" transition:fade|global={{ duration: 200 }}>
      <div class="flex flex-1 flex-col items-center justify-center overflow-clip">
        <div class="flex flex-col items-stretch">
          <NavigationElements onclickedelement={() => (open = false)} {user} />
        </div>
      </div>
      {#if user}
        <div class="border-outline-variant/40 flex items-center justify-center gap-1 border-t p-4">
          <NavigationElements
            variant="utility"
            onclickedelement={() => (open = false)}
            {user}
            {appVersion}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>
