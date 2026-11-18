import type { ReactNode } from 'react';

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  sub?: string;
  action?: ReactNode;
};

export function PageHeading({ eyebrow, title, subtitle, sub, action }: Props) {
  return (
    <section className="welcome-row">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="subhead">{subtitle ?? sub}</p>
      </div>
      {action}
    </section>
  );
}
