<script lang="ts">
  import { page } from '$app/stores';
  import { vibrate } from '$lib/actions/vibrate';

  interface Props {
    href: string;
    text: string;
    Icon: any;
    onclickedelement?: () => void;
  }

  let { href, text, Icon, onclickedelement }: Props = $props();

  let currentPage = $derived($page.url.pathname);
</script>

<div>
  <a
    onclick={() => onclickedelement?.()}
    class={[
      'flex items-center gap-2 px-16 text-2xl transition-colors sm:px-0 sm:text-base',
      currentPage.replaceAll('/', '') === href.replaceAll('/', '') && 'text-primary'
    ]}
    {href}
    use:vibrate
  >
    <Icon />
    {text}
  </a>
</div>
