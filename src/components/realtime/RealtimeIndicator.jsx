
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const RealtimeIndicator = ({ isConnected, connectionStatus, onReconnect, className }) => {
  const statusConfig = {
    connected: {
      color: 'text-green-500',
      icon: <Wifi className="h-4 w-4" />,
      text: 'Live',
    },
    disconnected: {
      color: 'text-red-500',
      icon: <WifiOff className="h-4 w-4" />,
      text: 'Offline',
    },
    reconnecting: {
      color: 'text-yellow-500',
      icon: <Wifi className="h-4 w-4 animate-pulse" />,
      text: 'Connecting...',
    },
  };

  const currentStatus = isConnected ? 'connected' : (connectionStatus === 'connecting' ? 'reconnecting' : 'disconnected');
  const config = statusConfig[currentStatus];

  return (
    <div className={`flex items-center gap-2 ${config.color} ${className}`} title={`Real-time status: ${connectionStatus}`}>
      {config.icon}
      <span className="font-medium text-xs">{config.text}</span>
      {!isConnected && (
        <button onClick={onReconnect} className="text-xs underline hover:text-blue-400">
          Reconnect
        </button>
      )}
    </div>
  );
};

export default RealtimeIndicator;
