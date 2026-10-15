function ErrorMessage({ message, onRetry }) {
  return (
    <div className="max-w-sm mx-auto p-4 text-center" role="alert">
      <p className="text-red-600 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="bg-indigo-600 text-white rounded px-4 py-1 text-sm">
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
