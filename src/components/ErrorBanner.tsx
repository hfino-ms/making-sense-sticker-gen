import type { FC, ReactNode } from 'react';

type Props = { children: ReactNode };

const ErrorBanner: FC<Props> = ({ children }) => (
  <div className="error-banner" role="alert">{children}</div>
);

export default ErrorBanner;
