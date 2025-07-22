"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  TrendingUp, 
  Heart, 
  Pill, 
  Calendar,
  AlertCircle,
  Loader2,
  ChevronRight,
  CheckCircle,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { productRecommendationService, ProductRecommendation } from '@/services/productRecommendationService';
import { FormRecommendation } from '@/services/formRecommendationService';

interface PostFormRecommendationFlowProps {
  formData: Record<string, any>;
  onPlanSelect?: (plan: any) => void;
  onBack?: () => void;
  onContinue?: (selectedRecommendations: FormRecommendation[]) => void;
  className?: string;
}

type FlowStep = 'treatment-recommendation' | 'billing-plan-selection' | 'checkout' | 'confirmation';

interface PlanOption {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  unit: string;
  badge?: string;
  badgeColor?: string;
  icon: string;
  confidence?: number;
  reasoning?: string;
  category?: string;
  features: string[];
  personalizedRecommendation?: FormRecommendation;
  isSelected: boolean;
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

export const PostFormRecommendationFlow: React.FC<PostFormRecommendationFlowProps> = ({
  formData,
  onPlanSelect,
  onBack,
  onContinue,
  className = ""
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('treatment-recommendation');
  const [recommendations, setRecommendations] = useState<FormRecommendation[]>([]);
  const [selectedRecommendations, setSelectedRecommendations] = useState<FormRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedBillingPlan, setSelectedBillingPlan] = useState('monthly');

  const steps = {
    'treatment-recommendation': { title: 'Treatment Recommendation', progress: 25 },
    'billing-plan-selection': { title: 'Select Billing Plan', progress: 50 },
    'checkout': { title: 'Checkout', progress: 75 },
    'confirmation': { title: 'Confirmation', progress: 100 }
  };

  useEffect(() => {
    generateRecommendations();
  }, [formData]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // Generate product recommendations from your database
      const productRecs = await productRecommendationService.generateProductRecommendations(formData, {
        maxRecommendations: 3,
        categories: ['treatment', 'subscription', 'supplement', 'lifestyle'],
        includeServices: true,
        includeBundles: true
      });
      
      // Convert ProductRecommendation to FormRecommendation for compatibility
      const formRecs: FormRecommendation[] = productRecs.map(productRec => ({
        id: productRec.id,
        title: productRec.title,
        description: productRec.description,
        price: productRec.price || 0,
        category: productRec.category,
        confidence: productRec.confidence,
        priority: productRec.priority,
        actionable: productRec.actionable,
        reasoning: productRec.reasoning
      }));
      
      setRecommendations(formRecs);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback to empty recommendations
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationSelect = (recommendation: FormRecommendation) => {
    setSelectedRecommendations(prev => {
      const exists = prev.find(r => r.id === recommendation.id);
      if (exists) {
        return prev.filter(r => r.id !== recommendation.id);
      }
      return [...prev, recommendation];
    });
  };

  const handleContinue = () => {
    if (currentStep === 'treatment-recommendation') {
      setCurrentStep('billing-plan-selection');
    } else if (currentStep === 'billing-plan-selection') {
      setCurrentStep('checkout');
    } else if (currentStep === 'checkout') {
      setCurrentStep('confirmation');
    } else {
      onContinue?.(selectedRecommendations);
    }
  };

  const handleBack = () => {
    if (currentStep === 'billing-plan-selection') {
      setCurrentStep('treatment-recommendation');
    } else if (currentStep === 'checkout') {
      setCurrentStep('billing-plan-selection');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('checkout');
    } else {
      onBack?.();
    }
  };

  const renderAIAnalysis = () => (
    <div className="space-y-6">
      {/* AI Badge */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center mb-3">
          <span className="text-3xl mr-3">🤖</span>
          <h2 className="text-2xl font-semibold">
            {loading ? 'Analyzing Your Profile...' : 'AI Analysis Complete'}
          </h2>
        </div>
        <p className="text-white/90">
          {loading 
            ? 'Our AI is analyzing your responses and medical history to provide personalized recommendations.'
            : 'Based on your responses, our AI has analyzed your profile and generated personalized treatment recommendations.'
          }
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing your health profile...</p>
            <div className="mt-4 w-64 mx-auto">
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.slice(0, 3).map((rec, index) => (
            <div key={rec.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-green-800">{rec.title}</strong>
                    <Badge variant="outline" className={categoryColors[rec.category]}>
                      {rec.category}
                    </Badge>
                  </div>
                  <p className="text-green-700 text-sm mb-2">{rec.description}</p>
                  <div className="text-xs text-green-600">
                    Confidence: {Math.round(rec.confidence * 100)}% • 
                    {rec.price ? ` $${rec.price}/month` : ' Included'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPlanSelection = () => {
    // Create plans that incorporate the personalized recommendations
    const plans = recommendations.length > 0 ? recommendations.map((rec, index) => {
      // Map recommendations to plan structure
      const planTemplates = [
        {
          id: rec.id,
          title: rec.title,
          subtitle: rec.description,
          price: rec.price || 296,
          unit: 'month',
          badge: index === 0 ? 'Recommended' : undefined,
          badgeColor: index === 0 ? 'bg-green-500 text-white' : undefined,
          icon: rec.category === 'treatment' ? '🏥' : rec.category === 'supplement' ? '💊' : rec.category === 'subscription' ? '📅' : '🌟',
          confidence: rec.confidence,
          reasoning: rec.reasoning,
          category: rec.category,
          features: [
            'Personalized for your profile',
            `${Math.round(rec.confidence * 100)}% AI confidence match`,
            'Based on your health assessment',
            'Provider reviewed and approved',
            'Monthly progress monitoring',
            '24/7 medical support'
          ],
          personalizedRecommendation: rec,
          isSelected: false
        }
      ];
      return planTemplates[0];
    }) : [
      // Fallback plans if no recommendations
      {
        id: 'glp1-weight-loss',
        title: 'Advanced GLP-1 Weight Management',
        subtitle: 'Comprehensive metabolic support program',
        price: 296,
        unit: 'month',
        badge: 'Most Popular',
        badgeColor: 'bg-blue-500 text-white',
        icon: '🏥',
        confidence: 0.85,
        reasoning: 'Popular treatment option',
        category: 'treatment',
        features: [
          'Weekly GLP-1 injections',
          'Complete injection kit included',
          'Monthly medication delivery',
          'HSA/FSA eligible',
          'Dedicated care coordinator',
          '24/7 medical support'
        ],
        isSelected: false
      }
    ];

    const handleCardClick = (planId: string) => {
      // Check if this plan is already selected
      const isCurrentlySelected = selectedRecommendations.some(r => r.id === planId);
      
      if (isCurrentlySelected) {
        // Deselect if already selected
        setSelectedRecommendations([]);
        setExpandedCard(null);
      } else {
        // Single selection with auto-expand
        const selectedPlan = plans.find(p => p?.id === planId);
        if (selectedPlan) {
          setSelectedRecommendations([{
            id: selectedPlan.id,
            title: selectedPlan.title,
            price: selectedPlan.price,
            category: (selectedPlan.category as any) || 'treatment',
            confidence: selectedPlan.confidence || 0.9,
            priority: 1,
            actionable: true,
            description: selectedPlan.subtitle || '',
            reasoning: selectedPlan.reasoning || 'Based on your profile analysis'
          }]);
          // Auto-expand selected card
          setExpandedCard(planId);
        }
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Recommended Treatment Options
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Based on your health assessment, our medical team has identified these personalized treatment plans for you.
          </p>
        </div>

        <div className="space-y-4">
          {plans.filter(plan => plan != null).map((plan) => {
            const isSelected = selectedRecommendations.some(r => r.id === plan.id);
            const isExpanded = isSelected; // Expand only when selected
            
            return (
              <div
                key={plan.id}
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isSelected 
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md' 
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
                onClick={() => handleCardClick(plan.id)}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-sm font-semibold ${plan.badgeColor}`}>
                    {plan.badge}
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {plan.icon}
                    </div>
                    
                    {/* Plan Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">{plan.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{plan.subtitle}</p>
                          {plan.reasoning && (
                            <p className="text-sm text-blue-600 mt-2 italic">
                              {plan.reasoning}
                            </p>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                            ${plan.price}
                          </div>
                          <div className="text-sm text-gray-500">per {plan.unit}</div>
                        </div>
                      </div>
                      
                      {/* Features - Show when selected */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {plan.features.map((feature, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-gray-700 text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  <div className="ml-4 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Pricing Summary */}
        {selectedRecommendations.length > 0 && selectedRecommendations[0] && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Treatment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{selectedRecommendations[0].title}</span>
                <span className="font-semibold">${selectedRecommendations[0].price || 0}.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-medium">First Month Discount</span>
                <span className="text-green-600 font-semibold">-$100.00</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Due if prescribed</span>
                  <span className="font-semibold">${Math.max(0, (selectedRecommendations[0].price || 0) - 100)}.00</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-blue-600 font-semibold">Due Today</span>
                  <span className="text-blue-600 font-bold text-lg">$0</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBillingPlanSelection = () => {
    const selectedPlan = selectedRecommendations[0];
    const basePrice = selectedPlan?.price || 296;
    const quarterlySavings = Math.round(basePrice * 3 * 0.07); // 7% savings
    
    const billingPlans = [
      {
        id: 'monthly',
        title: 'Monthly',
        subtitle: 'Billed monthly,\nshipped monthly',
        price: basePrice,
        unit: 'per month',
        features: [
          'Same price, every dose. No hidden fees',
          'Home injection kit included'
        ],
        isSelected: selectedBillingPlan === 'monthly'
      },
      {
        id: 'quarterly',
        title: 'Quarterly Plan',
        subtitle: 'Billed every 3 months,\nshipped every 3 months',
        price: Math.round((basePrice * 3) - quarterlySavings), // 7% discount
        originalPrice: basePrice * 3,
        unit: 'per 3 months',
        badge: `Save $${quarterlySavings}`,
        badgeColor: 'bg-green-500 text-white',
        features: [
          'Same price, every dose. No hidden fees',
          'Home injection kit included',
          '7% savings vs monthly billing'
        ],
        isSelected: selectedBillingPlan === 'quarterly'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Review your treatment options</h2>
          <h3 className="text-xl text-gray-700 mb-6">Select your billing plan</h3>
        </div>

        <div className="space-y-4">
          {billingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                plan.isSelected 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 hover:border-green-300 bg-white'
              }`}
              onClick={() => setSelectedBillingPlan(plan.id)}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 right-6 px-3 py-1 rounded-full text-sm font-semibold ${plan.badgeColor}`}>
                  {plan.badge}
                </div>
              )}
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-2xl text-gray-900 mb-2">{plan.title}</h3>
                      <p className="text-gray-600 text-sm whitespace-pre-line">{plan.subtitle}</p>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      <div className="text-4xl font-bold text-gray-900">
                        ${plan.price}
                      </div>
                      <div className="text-sm text-gray-500">{plan.unit}</div>
                      {plan.originalPrice && (
                        <div className="text-sm text-gray-400 line-through">
                          ${plan.originalPrice}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="text-green-500 w-5 h-5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Selection Indicator */}
                <div className="ml-6 flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    plan.isSelected 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {plan.isSelected && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended Add-Ons */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-8">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">💊</span>
            <h3 className="font-bold text-lg text-blue-900">Enhance Your Treatment</h3>
            <Badge className="ml-2 bg-blue-100 text-blue-700">Recommended</Badge>
          </div>
          <p className="text-blue-700 text-sm mb-4">
            Based on your health profile, these additional services could enhance your treatment results:
          </p>
          
          <div className="space-y-3">
            {/* Nutrition Coaching Bundle */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    🥗
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Personalized Nutrition Coaching</h4>
                    <p className="text-sm text-gray-600">Weekly 1-on-1 sessions with certified nutritionist</p>
                    <p className="text-xs text-green-600 mt-1">Highly recommended for weight management goals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">+$99/month</p>
                  <label className="flex items-center mt-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Add to plan</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Lab Monitoring Bundle */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    🧪
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Advanced Lab Monitoring</h4>
                    <p className="text-sm text-gray-600">Quarterly comprehensive metabolic panels</p>
                    <p className="text-xs text-green-600 mt-1">Essential for safe medication monitoring</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">+$149/quarter</p>
                  <label className="flex items-center mt-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Add to plan</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Mental Health Support */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    🧠
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Mental Health Support</h4>
                    <p className="text-sm text-gray-600">Access to licensed therapists and wellness coaching</p>
                    <p className="text-xs text-green-600 mt-1">Supports comprehensive wellness approach</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">+$199/month</p>
                  <label className="flex items-center mt-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Add to plan</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 <strong>Clinical Insight:</strong> Patients who added nutrition coaching saw 34% better results in their first 3 months.
            </p>
          </div>
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="font-semibold text-blue-800 mb-3">Selected Treatment</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">{selectedPlan.title}</p>
                <p className="text-blue-700 text-sm">{selectedPlan.reasoning}</p>
                <p className="text-blue-600 text-xs mt-1">
                  {Math.round((selectedPlan.confidence || 0.9) * 100)}% AI Match
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-800 font-semibold">
                  {selectedBillingPlan === 'quarterly' ? 'Quarterly Plan' : 'Monthly Plan'}
                </p>
                <p className="text-blue-600 text-sm">
                  ${billingPlans.find(p => p.id === selectedBillingPlan)?.price} {billingPlans.find(p => p.id === selectedBillingPlan)?.unit}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckout = () => {
    const selectedPlan = selectedRecommendations[0];
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Secure Checkout</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete your order details below. You'll only be charged if your treatment is prescribed by a provider.
          </p>
        </div>

        {/* Order Summary */}
        {selectedPlan && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-xl text-gray-900 mb-4">Order Summary</h3>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                  Rx
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedPlan.title}</h4>
                  <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {Math.round((selectedPlan.confidence || 0.9) * 100)}% AI Match
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">${selectedPlan.price || 0}</div>
                <div className="text-sm text-gray-500">per month</div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Shipping Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={formData?.firstName || ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={formData?.lastName || ''}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="San Diego"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="CA">California</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
                {/* Add more states as needed */}
              </select>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        {selectedPlan && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Monthly Treatment</span>
                <span className="font-medium">${selectedPlan.price || 0}.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600">First Month Discount</span>
                <span className="text-green-600 font-medium">-$100.00</span>
              </div>
              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Due if prescribed</span>
                  <span className="font-semibold">${Math.max(0, (selectedPlan.price || 0) - 100)}.00</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-blue-600 font-semibold">Due Today</span>
                  <span className="text-blue-600 font-bold text-xl">$0.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-yellow-600 w-5 h-5 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Important Notice</h4>
              <p className="text-yellow-700 text-sm mt-1">
                You will only be charged if a licensed healthcare provider prescribes your treatment. 
                No payment will be processed today.
              </p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="text-sm text-gray-600">
          <p>
            By proceeding, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>. 
            You authorize us to charge your payment method for the amount shown if your treatment is prescribed.
          </p>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Recommendations Ready</h2>
        <p className="text-gray-600">
          Your personalized treatment plan has been prepared for provider review.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-800 mb-4">Selected Treatment Plans</h3>
        <div className="space-y-3">
          {selectedRecommendations.map(rec => (
            <div key={rec.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-500" size={20} />
                <span className="font-medium">{rec.title}</span>
              </div>
              <span className="text-green-700">
                {rec.price ? `$${rec.price}/month` : 'Included'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Next Steps:</strong> Your selected plans will be reviewed by a licensed healthcare provider. 
          If prescribed, you'll receive your treatment plan and can proceed with shipping and payment.
        </p>
      </div>
    </div>
  );

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {steps[currentStep].title}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {steps[currentStep].progress}% Complete
          </span>
        </div>
        <Progress value={steps[currentStep].progress} className="h-2" />
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading recommendations...</p>
              </div>
            </div>
          ) : (
            <>
              {currentStep === 'treatment-recommendation' && renderPlanSelection()}
              {currentStep === 'billing-plan-selection' && renderBillingPlanSelection()}
              {currentStep === 'checkout' && renderCheckout()}
              {currentStep === 'confirmation' && renderConfirmation()}
            </>
          )}

          {/* Navigation */}
          {!loading && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 'treatment-recommendation'}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button
                onClick={handleContinue}
                disabled={currentStep === 'treatment-recommendation' && selectedRecommendations.length === 0}
                className="min-w-[120px]"
              >
                {currentStep === 'confirmation' ? 'Continue to Checkout' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostFormRecommendationFlow;
