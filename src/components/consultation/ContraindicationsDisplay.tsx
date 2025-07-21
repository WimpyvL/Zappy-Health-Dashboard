import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ShieldAlert,
  Clock,
  User,
  Pill,
  Heart,
  Activity,
  AlertOctagon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contraindication {
  type: string;
  severity: 'absolute' | 'relative' | 'warning' | 'caution';
  title: string;
  description: string;
  details: string;
  recommendation: string;
  source: string;
  medication?: string;
  condition?: string;
  interactingMedication?: string;
  patientAge?: number;
  pregnancyCategory?: string;
}

interface ContraindicationsDisplayProps {
  contraindications: Contraindication[];
  hasAbsoluteContraindications: boolean;
  recommendationAction: string;
  medicationName: string;
  patientName: string;
  onAcknowledge?: (contraindications: Contraindication[]) => void;
  className?: string;
}

export const ContraindicationsDisplay: React.FC<ContraindicationsDisplayProps> = ({
  contraindications,
  hasAbsoluteContraindications,
  recommendationAction,
  medicationName,
  patientName,
  onAcknowledge,
  className
}) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'absolute':
        return {
          icon: AlertOctagon,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeVariant: 'destructive' as const,
          label: 'ABSOLUTE CONTRAINDICATION'
        };
      case 'relative':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          badgeVariant: 'destructive' as const,
          label: 'RELATIVE CONTRAINDICATION'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badgeVariant: 'default' as const,
          label: 'WARNING'
        };
      case 'caution':
        return {
          icon: Info,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeVariant: 'secondary' as const,
          label: 'CAUTION'
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeVariant: 'outline' as const,
          label: 'NOTICE'
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'allergy':
        return ShieldAlert;
      case 'medical_condition':
        return Heart;
      case 'drug_interaction':
        return Pill;
      case 'age_contraindication':
      case 'geriatric_caution':
      case 'pregnancy_contraindication':
        return User;
      case 'renal_contraindication':
      case 'hepatic_contraindication':
        return Activity;
      default:
        return AlertCircle;
    }
  };

  const getActionMessage = (action: string) => {
    switch (action) {
      case 'DO_NOT_PRESCRIBE':
        return {
          message: 'This medication should NOT be prescribed to this patient.',
          color: 'text-red-600',
          icon: AlertOctagon
        };
      case 'USE_WITH_EXTREME_CAUTION':
        return {
          message: 'Use only with extreme caution and close monitoring.',
          color: 'text-orange-600',
          icon: AlertTriangle
        };
      case 'MONITOR_CLOSELY':
        return {
          message: 'Proceed with close monitoring for adverse effects.',
          color: 'text-yellow-600',
          icon: AlertCircle
        };
      case 'MANUAL_REVIEW_REQUIRED':
        return {
          message: 'Manual clinical review required before prescribing.',
          color: 'text-blue-600',
          icon: Clock
        };
      default:
        return {
          message: 'Review contraindications before prescribing.',
          color: 'text-gray-600',
          icon: Info
        };
    }
  };

  if (contraindications.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-600">
            <Info className="h-5 w-5" />
            <span className="font-medium">No contraindications identified</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {medicationName} appears safe to prescribe for {patientName} based on available information.
          </p>
        </CardContent>
      </Card>
    );
  }

  const actionConfig = getActionMessage(recommendationAction);
  const ActionIcon = actionConfig.icon;

  // Group contraindications by severity
  const groupedContraindications = contraindications.reduce((acc, contra) => {
    if (!acc[contra.severity]) {
      acc[contra.severity] = [];
    }
    acc[contra.severity]!.push(contra);
    return acc;
  }, {} as Record<string, Contraindication[]>);

  const severityOrder = ['absolute', 'relative', 'warning', 'caution'];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          Contraindications Assessment
        </CardTitle>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
          <ActionIcon className={cn("h-5 w-5", actionConfig.color)} />
          <span className={cn("font-medium", actionConfig.color)}>
            {actionConfig.message}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {severityOrder.map(severity => {
          const contrasForSeverity = groupedContraindications[severity];
          if (!contrasForSeverity || contrasForSeverity.length === 0) return null;

          const severityConfig = getSeverityConfig(severity);
          const SeverityIcon = severityConfig.icon;

          return (
            <div key={severity} className="space-y-3">
              <div className="flex items-center gap-2">
                <SeverityIcon className={cn("h-4 w-4", severityConfig.color)} />
                <Badge variant={severityConfig.badgeVariant} className="text-xs">
                  {severityConfig.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({contrasForSeverity.length} {contrasForSeverity.length === 1 ? 'issue' : 'issues'})
                </span>
              </div>

              {contrasForSeverity.map((contra, index) => {
                const TypeIcon = getTypeIcon(contra.type);
                
                return (
                  <Alert 
                    key={`${severity}-${index}`}
                    className={cn(
                      "border-l-4",
                      severityConfig.bgColor,
                      severityConfig.borderColor
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <TypeIcon className={cn("h-4 w-4 mt-0.5", severityConfig.color)} />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className={cn("font-medium", severityConfig.color)}>
                            {contra.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {contra.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <AlertDescription className="text-sm">
                          <div className="space-y-1">
                            <p><strong>Issue:</strong> {contra.description}</p>
                            <p><strong>Details:</strong> {contra.details}</p>
                            <p><strong>Recommendation:</strong> {contra.recommendation}</p>
                            
                            {/* Additional context based on type */}
                            {contra.interactingMedication && (
                              <p><strong>Interacting Medication:</strong> {contra.interactingMedication}</p>
                            )}
                            {contra.condition && (
                              <p><strong>Patient Condition:</strong> {contra.condition}</p>
                            )}
                            {contra.patientAge && (
                              <p><strong>Patient Age:</strong> {contra.patientAge} years</p>
                            )}
                            {contra.pregnancyCategory && (
                              <p><strong>Pregnancy Category:</strong> {contra.pregnancyCategory}</p>
                            )}
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                );
              })}
            </div>
          );
        })}

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {groupedContraindications.absolute?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Absolute</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {groupedContraindications.relative?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Relative</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {groupedContraindications.warning?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {groupedContraindications.caution?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Cautions</div>
          </div>
        </div>

        {/* Action Button */}
        {onAcknowledge && (
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={() => onAcknowledge(contraindications)}
              variant={hasAbsoluteContraindications ? "destructive" : "default"}
              className="gap-2"
            >
              <ShieldAlert className="h-4 w-4" />
              {hasAbsoluteContraindications 
                ? "Acknowledge Critical Warnings"
                : "Acknowledge & Continue"
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContraindicationsDisplay;