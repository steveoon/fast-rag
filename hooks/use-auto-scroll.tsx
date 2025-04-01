import { useCallback, useEffect, useRef, useState } from 'react';

interface ScrollState {
  isAtBottom: boolean;
  autoScrollEnabled: boolean;
}

interface UseAutoScrollOptions {
  offset?: number;
  smooth?: boolean;
  content?: React.ReactNode;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const { offset = 20, smooth = false, content } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastContentHeight = useRef(0);
  const userHasScrolled = useRef(false);
  const autoScrollEnabledRef = useRef(true);
  const isScrollingRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [scrollState, setScrollState] = useState<ScrollState>({
    isAtBottom: true,
    autoScrollEnabled: true,
  });

  const checkIsAtBottom = useCallback(
    (element: HTMLElement) => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceToBottom = Math.abs(scrollHeight - scrollTop - clientHeight);
      return distanceToBottom <= offset;
    },
    [offset]
  );

  const scrollToBottom = useCallback(
    (instant?: boolean) => {
      if (!scrollRef.current || isScrollingRef.current) return;

      isScrollingRef.current = true;
      const targetScrollTop = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;

      if (instant) {
        scrollRef.current.scrollTop = targetScrollTop;
        isScrollingRef.current = false;
      } else {
        scrollRef.current.scrollTo({
          top: targetScrollTop,
          behavior: smooth ? 'smooth' : 'auto',
        });

        setTimeout(() => {
          isScrollingRef.current = false;
        }, 100);
      }

      if (!scrollState.isAtBottom || !scrollState.autoScrollEnabled) {
        autoScrollEnabledRef.current = true;
        setScrollState({
          isAtBottom: true,
          autoScrollEnabled: true,
        });
      }
      userHasScrolled.current = false;
    },
    [smooth, scrollState.isAtBottom, scrollState.autoScrollEnabled]
  );

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isScrollingRef.current) return;

    const atBottom = checkIsAtBottom(scrollRef.current);
    const newAutoScrollEnabled = atBottom ? true : autoScrollEnabledRef.current;

    if (
      scrollState.isAtBottom !== atBottom ||
      scrollState.autoScrollEnabled !== newAutoScrollEnabled
    ) {
      autoScrollEnabledRef.current = newAutoScrollEnabled;
      setScrollState({
        isAtBottom: atBottom,
        autoScrollEnabled: newAutoScrollEnabled,
      });
    }
  }, [checkIsAtBottom, scrollState]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!scrollRef.current) return;

    const handleContentChange = () => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) return;

      const currentHeight = scrollElement.scrollHeight;
      if (currentHeight !== lastContentHeight.current) {
        lastContentHeight.current = currentHeight;

        if (autoScrollEnabledRef.current && !isScrollingRef.current) {
          requestAnimationFrame(() => {
            scrollToBottom(lastContentHeight.current === 0);
          });
        }
      }
    };

    const timeoutId = setTimeout(handleContentChange, 0);
    return () => clearTimeout(timeoutId);
  }, [content, scrollToBottom]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    let resizeTimeout: NodeJS.Timeout;
    resizeObserverRef.current = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (autoScrollEnabledRef.current && !isScrollingRef.current) {
          requestAnimationFrame(() => {
            scrollToBottom(true);
          });
        }
      }, 100);
    });

    resizeObserverRef.current.observe(element);

    return () => {
      clearTimeout(resizeTimeout);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [scrollToBottom]);

  const disableAutoScroll = useCallback(() => {
    if (isScrollingRef.current) return;

    const atBottom = scrollRef.current ? checkIsAtBottom(scrollRef.current) : false;
    if (!atBottom) {
      userHasScrolled.current = true;
      autoScrollEnabledRef.current = false;

      if (scrollState.autoScrollEnabled) {
        setScrollState(prev => ({
          ...prev,
          autoScrollEnabled: false,
        }));
      }
    }
  }, [checkIsAtBottom, scrollState.autoScrollEnabled]);

  return {
    scrollRef,
    isAtBottom: scrollState.isAtBottom,
    autoScrollEnabled: scrollState.autoScrollEnabled,
    scrollToBottom: () => scrollToBottom(false),
    disableAutoScroll,
  };
}
