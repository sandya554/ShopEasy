function Loading({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-2" role="status">
      <div className="h-8 w-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default Loading;
