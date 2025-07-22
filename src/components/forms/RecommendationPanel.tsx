"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Lightbulb, 
  TrendingUp, 
  Heart, 
  Pill, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { formRecommendationService, FormRecommendation, RecommendationConfig } from '@/services/formRecommendationService';

interface RecommendationPanelProps {
  formData: Record<string, any>;
  config?: RecommendationConfig;
  onRecommendationSelect?: (recommendation: FormRecommendation) => void;
  onRecommendationDismiss?: (recommendationId: string) => void;
  className?: string;
  showHeader?: boolean;
  maxRecommendations?: number;
}

const categoryIcons = {
  treatment: Heart,
  subscription: Calendar,
  supplement: Pill,
  lifestyle: TrendingUp,
};

const categoryColors = {
  treatment: 'bg-red-50 text-red-700 border-red-200',
  subscription: 'bg-blue-50 text-blue-700 border-blue-200',
  supplement: 'bg-green-50 text-green-700 border-green-200',
  lifestyle: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  formData,
  config,
  onRecommendationSelect,
  onRecommendationDismiss,
  className = "",
  showHeader = true,
  maxRecommendations = 3
}) => {
  const [recommendations, setRecommendations] = useState<FormRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const generateRecommendations = async () => {
      // Only generate if we have meaningful form data
      const hasRelevantData = Object.keys(formData).some(key => 
        ['weight', 'height', 'age', 'goals', 'conditions', 'medications'].some(field => 
          key.includes(field)
        )
      );

      if (!hasRelevantData) {
        setRecommendations([]);
        return;
      }

      // Check if recommendations should be triggered based on config
      if (config && !formRecommendationService.shouldTriggerRecommendations(formData, config)) {
        return;
      }

      setLoading(true);
      try {
        const recs = await formRecommendationService.generateRecommendations(
          formData, 
          { ...config, maxRecommendations }
        );
        setRecommendations(recs);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [formData, config, maxRecommendations]);

  const handleRecommendationSelect = (recommendation: FormRecommendation) => {
    onRecommendationSelect?.(recommendation);
  };

  const handleRecommendationDismiss = (recommendationId: string) => {
    setDismissedIds(prev => new Set([...prev, recommendationId]));
    onRecommendationDismiss?.(recommendationId);
  };

  const visibleRecommendations = recommendations.filter(rec => !dismissedIds.has(rec.id));

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating personalized recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleRecommendations.length === 0) {
    return null;
  }

  return (
    <Card className={`w-full ${className}`}>
      {showHeader && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Personalized Recommendations</span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {visibleRecommendations.map((recommendation, index) => {
          const IconComponent = categoryIcons[recommendation.category] || Lightbulb;
          const categoryColor = categoryColors[recommendation.category] || 'bg-gray-50 text-gray-700 border-gray-200';
          
          return (
            <div key={recommendation.id} className="space-y-3">
              {index > 0 && <Separator />}
              
              <div className="flex items-start justify-between space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">{recommendation.title}</h4>
                    <Badge variant="outline" className={`text-xs ${categoryColor}`}>
                      {recommendation.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {recommendation.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Confidence: {Math.round(recommendation.confidence * 100)}%</span>
                    </div>
                    {recommendation.price && recommendation.price > 0 && (
                      <div className="flex items-center space-x-1">
                        <span>${recommendation.price}/month</span>
                      </div>
                    )}
                    {recommendation.savings && recommendation.savings > 0 && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <span>Save ${recommendation.savings}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Why this is recommended:</strong> {recommendation.reasoning}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  {recommendation.actionable && (
                    <Button
                      size="sm"
                      onClick={() => handleRecommendationSelect(recommendation)}
                      className="text-xs"
                    >
                      <ChevronRight className="h-3 w-3 mr-1" />
                      Select
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRecommendationDismiss(recommendation.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        
        {visibleRecommendations.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Recommendations are generated based on your current form responses and may update as you provide more information.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationPanel;
