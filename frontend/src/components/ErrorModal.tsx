import { useState, useEffect } from "react";
import { X, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";

const ErrorModal = ({ error, onClose, onRetry }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      handleClose();
    }
  };

  useEffect(() => {
    if (!error) return;
    const handleCloseEv = () => handleClose();
    const handleSubmitEv = () => handleRetry();
    window.addEventListener("close-active-modal", handleCloseEv);
    window.addEventListener("submit-active-modal", handleSubmitEv);
    return () => {
      window.removeEventListener("close-active-modal", handleCloseEv);
      window.removeEventListener("submit-active-modal", handleSubmitEv);
    };
  }, [error]);

  if (!error) return null;

  const getErrorDetails = (error) => {
    if (!navigator.onLine) {
      return {
        title: "Connection Lost",
        message: "You're offline. Please check your internet connection and try again.",
        icon: <WifiOff className="w-8 h-8 text-rose-500" />,
        type: "network",
        suggestions: ["Check your internet connection", "Try refreshing the page", "Wait a moment and try again"]
      };
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      switch (status) {
        case 400: return { title: "Invalid Request", message: data?.message || "The request contains invalid data.", icon: <AlertCircle className="w-8 h-8 text-amber-500" />, type: "validation", suggestions: ["Check your input data", "Make sure all required fields are filled", "Try again"] };
        case 401: return { title: "Authentication Required", message: "You need to log in to continue.", icon: <AlertCircle className="w-8 h-8 text-rose-500" />, type: "auth", suggestions: ["Log in to your account", "Check if your session has expired"] };
        case 403: return { title: "Access Denied", message: data?.message || "You don't have permission.", icon: <AlertCircle className="w-8 h-8 text-rose-500" />, type: "permission", suggestions: ["Check your account permissions", "Contact support"] };
        case 404: return { title: "Not Found", message: "The requested resource could not be found.", icon: <AlertCircle className="w-8 h-8 text-amber-500" />, type: "not_found", suggestions: ["Check the URL or link", "Try refreshing the page"] };
        case 429: return { title: "Too Many Requests", message: "You're making requests too quickly.", icon: <AlertCircle className="w-8 h-8 text-amber-500" />, type: "rate_limit", suggestions: ["Wait a few seconds", "Reduce the frequency of your actions"] };
        case 500: case 502: case 503: case 504: return { title: "Server Error", message: "Something went wrong on our end.", icon: <AlertCircle className="w-8 h-8 text-rose-500" />, type: "server", suggestions: ["Try again in a few moments", "Check our status page"] };
        default: return { title: "Something Went Wrong", message: data?.message || "An unexpected error occurred.", icon: <AlertCircle className="w-8 h-8 text-rose-500" />, type: "unknown", suggestions: ["Try again", "Refresh the page"] };
      }
    }

    if (error.request) {
      return { title: "Connection Error", message: "Unable to connect to the server.", icon: <Wifi className="w-8 h-8 text-amber-500" />, type: "network", suggestions: ["Check your internet connection", "Try again in a moment"] };
    }

    return { title: "Unexpected Error", message: error.message || "An unexpected error occurred.", icon: <AlertCircle className="w-8 h-8 text-rose-500" />, type: "unknown", suggestions: ["Try refreshing the page", "Clear your browser cache"] };
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div data-context="modal" className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className={`relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl max-w-md w-full transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'} overflow-hidden`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {errorDetails.icon}
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{errorDetails.title}</h3>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-500 dark:hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{errorDetails.message}</p>
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">What you can try:</h4>
            <ul className="space-y-1.5">
              {errorDetails.suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-start gap-2">
                  <span className="text-blue-500 dark:text-blue-400 mt-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-2">
            <button onClick={handleClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all active:scale-[0.98]">Close</button>
            {onRetry && errorDetails.type !== 'auth' && (
              <button onClick={handleRetry} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-all active:scale-[0.98] shadow-sm flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
