type Props = {
  className?: string;
  inverse?: boolean;
};

export function Skeleton({ className = '', inverse = false }: Props) {
  return (
    <span
      className={`skeleton inline-block align-middle ${inverse ? 'skeleton-inverse' : ''} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
