import { useEffect, useRef, useState } from 'react';

interface IntersectionOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
}

// Hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionOptions = {}
): [React.RefObject<any>, boolean] {
  const { 
    triggerOnce = true,
    rootMargin = '50px',
    threshold = 0.1,
    root = null
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  const frozen = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && frozen.current)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (triggerOnce && visible) {
          frozen.current = true;
          observer.unobserve(element);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [triggerOnce, rootMargin, threshold, root]);

  return [elementRef, isVisible];
}

// Hook for lazy loading images
export function useLazyImage(
  src: string,
  placeholder: string = ''
): [string, boolean, boolean] {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  useEffect(() => {
    const image = new Image();
    
    image.onload = () => {
      setLoaded(true);
      setCurrentSrc(src);
    };
    
    image.onerror = () => {
      setError(true);
      setCurrentSrc(placeholder);
    };

    image.src = src;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [src, placeholder]);

  return [currentSrc, loaded, error];
}

// Component for lazy loading images
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  threshold?: number;
  rootMargin?: string;
}

export function LazyImage({
  src,
  alt,
  placeholder = '',
  fallback = '',
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}: LazyImageProps) {
  const [ref, isVisible] = useIntersectionObserver({
    triggerOnce: true,
    threshold,
    rootMargin
  });

  const [currentSrc, loaded, error] = useLazyImage(
    isVisible ? src : '',
    placeholder
  );

  return (
    <img
      ref={ref}
      src={error ? fallback : currentSrc}
      alt={alt}
      {...props}
      style={{
        ...props.style,
        opacity: loaded ? 1 : 0.5,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
}