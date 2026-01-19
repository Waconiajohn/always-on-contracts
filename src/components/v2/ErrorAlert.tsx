interface ErrorAlertProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
      <p className="text-red-800 font-medium">Error</p>
      <p className="text-red-700 text-sm mt-1">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
