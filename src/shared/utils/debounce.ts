export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: number;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
