/**
 * @fileoverview Enhanced Order Timeline component with prescription integration
 */
'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Truck,
  MapPin,
  User,
  Pill,
  FileText,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';

// Type definitions
interface TimelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface StepStatus {
  status: 'completed' | 'current' | 'upcoming' | 'pending';
  timestamp?: any;
  details?: string | null;
  completedBy?: string | null;
}

interface OrderTimelineProps {
  order: any;
  className?: string;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ order, className = '' }) => {
  const [expandedSteps, setExpandedSteps] = useState(new Set());

  // Timeline step configurations
  const getTimelineSteps = () => {
    const isPrescriptionOrder = order?.isPrescriptionRequired;
    
    const baseSteps = [
      {
        id: 'order_placed',
        title: 'Order Placed',
        description: 'Order has been submitted and payment processed',
        icon: <DollarSign className="w-4 h-4" />,
        color: 'blue'
      }
    ];

    const prescriptionSteps = [
      {
        id: 'consultation_pending',
        title: 'Consultation Scheduled',
        description: 'Medical consultation has been scheduled',
        icon: <Calendar className="w-4 h-4" />,
        color: 'yellow'
      },
      {
        id: 'intake_completed',
        title: 'Intake Form Completed',
        description: 'Patient has completed medical intake form',
        icon: <FileText className="w-4 h-4" />,
        color: 'blue'
      },
      {
        id: 'provider_review',
        title: 'Under Medical Review',
        description: 'Healthcare provider is reviewing your case',
        icon: <User className="w-4 h-4" />,
        color: 'yellow'
      },
      {
        id: 'provider_approved',
        title: 'Medically Approved',
        description: 'Healthcare provider has approved your treatment',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'green'
      },
      {
        id: 'prescription_sent',
        title: 'Prescription Sent',
        description: 'Prescription has been sent to pharmacy',
        icon: <Pill className="w-4 h-4" />,
        color: 'blue'
      },
      {
        id: 'pharmacy_received',
        title: 'Pharmacy Received',
        description: 'Pharmacy has received the prescription',
        icon: <Package className="w-4 h-4" />,
        color: 'blue'
      },
      {
        id: 'pharmacy_filling',
        title: 'Being Filled',
        description: 'Pharmacy is filling your prescription',
        icon: <Clock className="w-4 h-4" />,
        color: 'yellow'
      },
      {
        id: 'pharmacy_ready',
        title: 'Ready for Pickup',
        description: 'Prescription is ready for pickup at pharmacy',
        icon: <MapPin className="w-4 h-4" />,
        color: 'green'
      },
      {
        id: 'pharmacy_dispensed',
        title: 'Picked Up',
        description: 'Prescription has been picked up',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'green'
      }
    ];

    const shippingSteps = [
      {
        id: 'order_processing',
        title: 'Processing Order',
        description: 'Order is being prepared for shipment',
        icon: <Package className="w-4 h-4" />,
        color: 'yellow'
      },
      {
        id: 'order_shipped',
        title: 'Shipped',
        description: 'Order has been shipped and is on its way',
        icon: <Truck className="w-4 h-4" />,
        color: 'blue'
      },
      {
        id: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Package is out for delivery',
        icon: <Truck className="w-4 h-4" />,
        color: 'yellow'
      },
      {
        id: 'order_delivered',
        title: 'Delivered',
        description: 'Order has been delivered successfully',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'green'
      }
    ];

    if (isPrescriptionOrder) {
      return [...baseSteps, ...prescriptionSteps];
    } else {
      return [...baseSteps, ...shippingSteps];
    }
  };

  const timelineSteps = getTimelineSteps();

  // Get status information for each step
  const getStepStatus = (stepId: string): StepStatus => {
    const statusHistory = order?.statusHistory || [];
    const stepHistory = statusHistory.find((h: any) => h.status === stepId);
    
    if (stepHistory) {
      return {
        status: 'completed',
        timestamp: stepHistory.timestamp,
        details: stepHistory.details,
        completedBy: stepHistory.completedBy
      };
    }

    // Check if this is the current status
    if (order?.status === stepId) {
      return {
        status: 'current',
        timestamp: order?.updatedAt,
        details: order?.statusDetails
      };
    }

    // Check if this step should be shown as upcoming
    const currentStepIndex = timelineSteps.findIndex(step => step.id === order?.status);
    const thisStepIndex = timelineSteps.findIndex(step => step.id === stepId);
    
    if (thisStepIndex > currentStepIndex) {
      return {
        status: 'upcoming',
        timestamp: null,
        details: null
      };
    }

    return {
      status: 'pending',
      timestamp: null,
      details: null
    };
  };

  // Toggle expanded step details
  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  // Get color classes for status
  const getStatusColor = (status: string, stepColor: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'current':
        return `text-${stepColor}-600 bg-${stepColor}-100 border-${stepColor}-200`;
      case 'upcoming':
        return 'text-gray-400 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  // Get icon color for status
  const getIconColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-blue-600';
      case 'upcoming':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  // Render step details
  const renderStepDetails = (step: TimelineStep, stepStatus: StepStatus) => {
    if (stepStatus.status === 'upcoming') return null;

    return (
      <div className="mt-3 space-y-2 text-sm text-gray-600">
        {stepStatus.timestamp && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{format(stepStatus.timestamp.toDate(), 'PPp')}</span>
          </div>
        )}
        
        {stepStatus.completedBy && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Completed by: {stepStatus.completedBy}</span>
          </div>
        )}

        {stepStatus.details && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium mb-1">Details:</h4>
            <p>{stepStatus.details}</p>
          </div>
        )}

        {/* Additional context based on step type */}
        {step.id === 'prescription_sent' && order?.prescriptionDetails && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Prescription Details
            </h4>
            <div className="space-y-1 text-xs">
              <p><strong>Medication:</strong> {order.prescriptionDetails.medication}</p>
              <p><strong>Dosage:</strong> {order.prescriptionDetails.dosage}</p>
              <p><strong>Quantity:</strong> {order.prescriptionDetails.quantity}</p>
              <p><strong>Refills:</strong> {order.prescriptionDetails.refills || 0}</p>
              {order.prescriptionDetails.instructions && (
                <p><strong>Instructions:</strong> {order.prescriptionDetails.instructions}</p>
              )}
            </div>
          </div>
        )}

        {step.id === 'pharmacy_ready' && order?.pharmacyDetails && (
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Pickup Information
            </h4>
            <div className="space-y-1 text-xs">
              <p><strong>Pharmacy:</strong> {order.pharmacyDetails.name}</p>
              <p><strong>Address:</strong> {order.pharmacyDetails.address}</p>
              <p><strong>Phone:</strong> {order.pharmacyDetails.phone}</p>
              <p><strong>Hours:</strong> {order.pharmacyDetails.hours}</p>
            </div>
          </div>
        )}

        {step.id === 'order_shipped' && order?.shippingDetails && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Shipping Information
            </h4>
            <div className="space-y-1 text-xs">
              <p><strong>Carrier:</strong> {order.shippingDetails.carrier}</p>
              <p><strong>Tracking Number:</strong> {order.shippingDetails.trackingNumber}</p>
              <p><strong>Estimated Delivery:</strong> {order.shippingDetails.estimatedDelivery}</p>
              {order.shippingDetails.trackingUrl && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs"
                  onClick={() => window.open(order.shippingDetails.trackingUrl, '_blank')}
                >
                  Track Package <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Order Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Order ID</p>
                <p className="font-medium">{order?.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge variant="outline" className={getStatusColor(getStepStatus(order?.status).status, 'blue')}>
                  {order?.status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-medium">${order?.total}</p>
              </div>
              <div>
                <p className="text-gray-500">Type</p>
                <p className="font-medium">{order?.isPrescriptionRequired ? 'Prescription' : 'Over-the-counter'}</p>
              </div>
            </div>
          </div>

          {/* Timeline Steps */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {timelineSteps.map((step, index) => {
                const stepStatus = getStepStatus(step.id);
                const isExpanded = expandedSteps.has(step.id);
                const hasDetails = stepStatus.status !== 'upcoming' && (
                  stepStatus.details || 
                  stepStatus.completedBy || 
                  (step.id === 'prescription_sent' && order?.prescriptionDetails) ||
                  (step.id === 'pharmacy_ready' && order?.pharmacyDetails) ||
                  (step.id === 'order_shipped' && order?.shippingDetails)
                );

                return (
                  <div key={step.id} className="relative flex gap-4">
                    {/* Timeline node */}
                    <div className={`
                      relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2
                      ${getStatusColor(stepStatus.status, step.color)}
                    `}>
                      <div className={getIconColor(stepStatus.status)}>
                        {stepStatus.status === 'completed' ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : stepStatus.status === 'current' ? (
                          <div className="w-3 h-3 bg-current rounded-full animate-pulse"></div>
                        ) : (
                          step.icon
                        )}
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`
                            font-medium
                            ${stepStatus.status === 'completed' ? 'text-green-800' : 
                              stepStatus.status === 'current' ? 'text-blue-800' : 
                              'text-gray-500'}
                          `}>
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </p>
                          {stepStatus.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              {format(stepStatus.timestamp.toDate(), 'MMM d, yyyy \'at\' h:mm a')}
                            </p>
                          )}
                        </div>

                        {hasDetails && (
                          <Collapsible open={isExpanded} onOpenChange={() => toggleStepExpansion(step.id)}>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="ml-2">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        )}
                      </div>

                      {hasDetails && (
                        <Collapsible open={isExpanded} onOpenChange={() => toggleStepExpansion(step.id)}>
                          <CollapsibleContent>
                            {renderStepDetails(step, stepStatus)}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Support */}
          <div className="border-t pt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Need Help?
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                If you have questions about your order or need assistance, our support team is here to help.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Support
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderTimeline;