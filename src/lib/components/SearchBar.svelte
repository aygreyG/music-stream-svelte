<script lang="ts">
  import type { FormEventHandler, KeyboardEventHandler } from 'svelte/elements';

  import RoundSearch from '~icons/ic/round-search';

  interface Props {
    value: string;
    placeholder?: string;
    name?: string;
    required?: boolean;
    oninput?: FormEventHandler<HTMLInputElement>;
    class?: string;
    onkeydown?: KeyboardEventHandler<HTMLInputElement>;
  }

  let {
    value = $bindable(''),
    placeholder = 'Search',
    name = 'search',
    required = false,
    class: className = '',
    oninput,
    onkeydown
  }: Props = $props();
</script>

<div
  class={[
    'group bg-surface-container focus-within:bg-surface-container-low focus-within:ring-primary/60 flex items-center gap-3 rounded-full px-4 py-2 transition-all duration-200 focus-within:ring-2',
    className
  ]}
>
  <RoundSearch
    class="text-on-surface-variant group-focus-within:text-primary shrink-0 text-xl transition-colors duration-200"
  />
  <input
    class="text-on-surface placeholder:text-outline w-full border-none bg-transparent p-0 outline-hidden focus:ring-0"
    type="text"
    bind:value
    {required}
    {oninput}
    {onkeydown}
    {name}
    autocomplete="off"
    {placeholder}
  />
</div>
