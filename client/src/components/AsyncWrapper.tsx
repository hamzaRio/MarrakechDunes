import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface AsyncWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  spinnerText?: string;
  minHeight?: string;
}

export const AsyncWrapper: React.FC<AsyncWrapperProps> = ({
  loading,
  children,
  fallback,
  spinnerText = 'Loading...',
  minHeight = '200px'
}) => {
  if (loading) {
    return (
      <div style={{ minHeight }} className="flex items-center justify-center">
        {fallback || <LoadingSpinner text={spinnerText} />}
      </div>
    );
  }

  return <>{children}</>;
};

// Higher-order component for async operations
export const withAsyncLoading = <P extends object>(
  Component: React.ComponentType<P>,
  loadingText?: string
) => {
  return React.forwardRef<any, P & { loading?: boolean }>((props, ref) => {
    const { loading, ...restProps } = props;
    
    return (
      <AsyncWrapper loading={loading || false} spinnerText={loadingText}>
        <Component {...(restProps as P)} ref={ref} />
      </AsyncWrapper>
    );
  });
};
