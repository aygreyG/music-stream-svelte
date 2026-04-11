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
  }

  let { href, text, Icon, onclickedelement }: Props = $props();

  let currentPage = $derived(page.url.pathname);
</script>

<div>
  <a
    onclick={() => onclickedelement?.()}
    class={[
      'flex items-center gap-2 rounded-2xl px-16 py-2 text-2xl font-bold transition-colors sm:px-4 sm:text-base',
      currentPage.replaceAll('/', '') === href.replaceAll('/', '') && 'bg-primary text-on-primary'
    ]}
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    {href}
    use:vibrate
  >
    <Icon />
    {text}
  </a>
</div>
