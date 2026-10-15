import { useAuthContext } from "../context/AuthContext.jsx";

// Shown after the app logs the user out on its own (expired or invalid token).
function SessionNotice() {
  const { sessionMessage, clearSessionMessage } = useAuthContext();
  if (!sessionMessage) return null;
  return (
    <div role="alert" className="bg-yellow-50 border-b border-yellow-300 text-yellow-800 text-sm px-3 py-2 flex justify-between items-center gap-3">
      <span>{sessionMessage}</span>
      <button onClick={clearSessionMessage} className="underline text-xs shrink-0">Dismiss</button>
    </div>
  );
}

export default SessionNotice;
