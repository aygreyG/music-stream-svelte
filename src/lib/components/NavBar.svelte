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
  }

  let { user = null }: Props = $props();
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
  </div>
</div>

<div
  class="bg-surface-variant absolute top-24 -right-1 z-50 flex items-center justify-center rounded-s-xl shadow-md backdrop-blur-md transition-colors duration-300 sm:hidden"
>
  <button use:vibrate onclick={() => (open = !open)}>
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
    <div
      class="flex h-full flex-col items-stretch justify-center"
      transition:fade|global={{ duration: 200 }}
    >
      <NavigationElements onclickedelement={() => (open = false)} {user} />
    </div>
  {/if}
</div>
