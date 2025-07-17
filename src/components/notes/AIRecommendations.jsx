import React from 'react';
import { Button } from 'antd';
import { CheckOutlined, CloseOutlined, BulbOutlined } from '@ant-design/icons';

/**
 * Renders a list of AI-generated recommendations
 *
 * @param {Object} props - The component props
 * @param {Array} props.recommendations - The list of recommendations to display
 * @param {Function} props.onAccept - Callback when a recommendation is accepted
 * @param {Function} props.onReject - Callback when a recommendation is rejected
 */
export const AIRecommendations = ({
  recommendations,
  onAccept,
  onReject,
  sectionType,
}) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <BulbOutlined className="text-2xl mb-2" />
        <p>No recommendations available for this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <div
          key={index}
          className="bg-gray-50 p-3 rounded-lg flex items-start justify-between"
        >
          <div className="flex-1">
            <p className="text-sm text-gray-800">{rec.text}</p>
            <div className="text-xs text-gray-500 mt-1">
              Confidence: {Math.round(rec.confidence * 100)}%
            </div>
            {rec.reasoning && (
              <p className="text-xs text-gray-500 italic mt-1">
                Reason: {rec.reasoning}
              </p>
            )}
          </div>
          <div className="flex space-x-2 ml-4">
            <Button
              type="primary"
              shape="circle"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => onAccept(rec, index)}
              title="Accept recommendation"
            />
            <Button
              shape="circle"
              icon={<CloseOutlined />}
              size="small"
              onClick={() => onReject(rec, index)}
              title="Reject recommendation"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
