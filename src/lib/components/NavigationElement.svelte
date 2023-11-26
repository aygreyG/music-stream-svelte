<script lang="ts">
	import { page } from '$app/stores';

	export let href: string;
	export let text: string;

	$: currentPage = $page.url.pathname;
</script>

<div>
	<a class="transition-colors" class:text-fuchsia-600={href === currentPage} {href}>{text}</a>
</div>
