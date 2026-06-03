import type { Action } from 'svelte/action';

const scroll: Action<
  Element,
  (Element & { scrollTop: number }) | undefined | null,
  {
    onscrolltopchange: (
      e: CustomEvent<{ scrollTop: number }> & { currentTarget: EventTarget & Element }
    ) => void;
  }
> = (node, customElement) => {
  const handleScroll = () => {
    node.dispatchEvent(
      new CustomEvent('scrolltopchange', {
        detail: { scrollTop: customElement?.scrollTop ?? node.scrollTop }
      })
    );
  };

  const resizeObserver = new ResizeObserver(() => {
    handleScroll();
  });

  resizeObserver.observe(customElement || node);
  node.addEventListener('scroll', handleScroll);

  return {
    destroy() {
      node.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    }
  };
};

export default scroll;
