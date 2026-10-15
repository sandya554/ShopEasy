import useOnlineStatus from "../hooks/useOnlineStatus.js";

// PWA: tells the user when the device is offline (pages already visited still open).
function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div role="status" className="bg-gray-800 text-white text-sm text-center px-3 py-2">
      You are offline. Some pages may be unavailable, and orders cannot be placed until you reconnect.
    </div>
  );
}

export default OfflineBanner;
