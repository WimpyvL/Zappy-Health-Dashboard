
import React from 'react';
import { X, Undo } from 'lucide-react';

const UndoNotification = ({ message, timeLeft, onUndo, onDismiss, isProcessing }) => {
  const progress = (timeLeft / 5) * 100;

  return (
    <div 
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 rounded-lg shadow-lg bg-gray-800 text-white"
      role="alert"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{isProcessing ? 'Processing...' : message}</p>
        <div className="flex items-center gap-2">
          <button onClick={onUndo} disabled={isProcessing} className="text-sm font-bold text-blue-400 hover:text-blue-300 disabled:opacity-50">
            <Undo className="inline-block h-4 w-4 mr-1" />
            Undo
          </button>
          <button onClick={onDismiss} disabled={isProcessing} className="text-gray-400 hover:text-white disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      {!isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000 linear" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default UndoNotification;
