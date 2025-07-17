
import React, { useState } from 'react';
import { Zap, Plus, CheckCircle } from 'lucide-react';

const AIRecommendationsPanel = ({
  recommendations = {},
  onAddRecommendation = () => {},
  selectedProductIds = [],
  loading = false,
}) => {
  const {
    subscriptionUpgrades = [],
    oneTimeAddons = [],
    bundleOptimizations = [],
  } = recommendations;

  const hasAnyRecommendations =
    subscriptionUpgrades.length > 0 ||
    oneTimeAddons.length > 0 ||
    bundleOptimizations.length > 0;

  if (loading) {
    return <LoadingState />;
  }

  if (!hasAnyRecommendations) {
    return null; 
  }

  return (
    <div className="ai-recommendations-panel bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mt-6">
      <div className="flex items-center mb-4">
        <div className="flex items-center">
          <div className="bg-purple-600 rounded-full p-2 mr-3">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900">
              Recommended for You
            </h3>
            <p className="text-sm text-purple-700">
              Based on your health profile and goals
            </p>
          </div>
        </div>
      </div>

      {subscriptionUpgrades.length > 0 && (
        <RecommendationSection
          title="Enhanced Treatment Plans"
          icon={<Plus className="w-4 h-4" />}
          recommendations={subscriptionUpgrades}
          selectedProductIds={selectedProductIds}
          onAddRecommendation={onAddRecommendation}
          type="subscription"
        />
      )}

      {oneTimeAddons.length > 0 && (
        <RecommendationSection
          title="Supplemental Products"
          icon={<Plus className="w-4 h-4" />}
          recommendations={oneTimeAddons}
          selectedProductIds={selectedProductIds}
          onAddRecommendation={onAddRecommendation}
          type="one_time"
        />
      )}

    </div>
  );
};

const RecommendationSection = ({ title, icon, recommendations, selectedProductIds, onAddRecommendation, type }) => (
  <div className="mb-6 last:mb-0">
    <div className="flex items-center mb-3">
      <span className="text-purple-600 mr-2">{icon}</span>
      <h4 className="text-sm font-medium text-gray-800">{title}</h4>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          isSelected={selectedProductIds.includes(rec.id)}
          onAdd={() => onAddRecommendation(rec)}
          type={type}
        />
      ))}
    </div>
  </div>
);

const RecommendationCard = ({ recommendation, isSelected, onAdd, type }) => {
  const priceDisplay = type === 'subscription' ? `$${recommendation.price}/month` : `$${recommendation.price}`;

  return (
    <div className={`bg-white border rounded-lg p-4 transition-all duration-200 ${isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
      <div className="flex-1">
        <h5 className="text-sm font-semibold text-gray-900">{recommendation.name}</h5>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{recommendation.description}</p>
        {recommendation.reason && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-2 mt-2">
            <p className="text-xs text-purple-700 italic">💡 {recommendation.reason}</p>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-bold text-gray-900">{priceDisplay}</span>
          {!isSelected ? (
            <button onClick={onAdd} className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-purple-700">
              Add to Cart
            </button>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" /> Added
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="ai-recommendations-panel bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mt-6 animate-pulse">
    <div className="flex items-center mb-4">
      <div className="bg-purple-200 rounded-full p-2 mr-3 h-9 w-9"></div>
      <div>
        <div className="h-5 bg-purple-200 rounded w-48 mb-1"></div>
        <div className="h-4 bg-purple-100 rounded w-64"></div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="h-24 bg-white rounded-lg"></div>
      <div className="h-24 bg-white rounded-lg"></div>
    </div>
  </div>
);

export default AIRecommendationsPanel;

    