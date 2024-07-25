<script lang="ts">
  import { page } from '$app/stores';
  import { vibrate } from '$lib/actions/vibrate';

  interface Props {
    href: string;
    text: string;
    icon: any;
    onclickedelement?: () => void;
  }

  let { href, text, icon, onclickedelement }: Props = $props();

  let currentPage = $derived($page.url.pathname);
</script>

<div>
  <a
    onclick={() => onclickedelement?.()}
    class="flex items-center gap-2 px-16 text-2xl transition-colors sm:px-0 sm:text-base"
    class:text-primary={currentPage.replaceAll('/', '') === href.replaceAll('/', '')}
    {href}
    use:vibrate
  >
    <svelte:component this={icon} />
    {text}
  </a>
</div>
