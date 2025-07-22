import React from 'react';
import { AlertTriangle, Info, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'critical';
  title: string;
  message: string;
  medications?: string[];
  action?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertCenterCardProps {
  alerts?: Alert[];
  patientAllergies?: string[];
  currentMedications?: string[];
  selectedMedications?: string[];
  onAlertAction?: (alertId: string, action: string) => void;
}

const AlertCenterCard: React.FC<AlertCenterCardProps> = ({
  alerts = [],
  patientAllergies = [],
  currentMedications = [],
  selectedMedications = [],
  onAlertAction
}) => {
  // Generate alerts based on medication interactions and allergies
  const generatedAlerts = React.useMemo(() => {
    const alertList: Alert[] = [...alerts];

    // Check for allergy conflicts
    selectedMedications.forEach((medication, index) => {
      patientAllergies.forEach(allergy => {
        if (medication.toLowerCase().includes(allergy.toLowerCase()) || 
            allergy.toLowerCase().includes(medication.toLowerCase())) {
          alertList.push({
            id: `allergy-${index}`,
            type: 'critical',
            title: 'Allergy Alert',
            message: `Patient is allergic to ${allergy}. Selected medication ${medication} may contain this allergen.`,
            medications: [medication],
            action: 'Remove medication or verify safety',
            severity: 'critical'
          });
        }
      });
    });

    // Check for common drug interactions
    const interactions = checkDrugInteractions(selectedMedications);
    interactions.forEach((interaction, index) => {
      alertList.push({
        id: `interaction-${index}`,
        type: 'warning',
        title: 'Drug Interaction',
        message: interaction.message,
        medications: interaction.medications,
        action: interaction.action,
        severity: interaction.severity
      });
    });

    // Check for dosage concerns
    selectedMedications.forEach((medication, index) => {
      const dosageConcerns = checkDosageConcerns(medication, currentMedications);
      dosageConcerns.forEach((concern, concernIndex) => {
        alertList.push({
          id: `dosage-${index}-${concernIndex}`,
          type: 'info',
          title: 'Dosage Consideration',
          message: concern.message,
          medications: [medication],
          action: concern.action,
          severity: 'medium'
        });
      });
    });

    return alertList;
  }, [alerts, patientAllergies, currentMedications, selectedMedications]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return {
          container: 'bg-red-50 border-l-4 border-l-red-500 text-red-800',
          icon: 'text-red-500',
          badge: 'bg-red-100 text-red-800'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-l-4 border-l-red-400 text-red-700',
          icon: 'text-red-400',
          badge: 'bg-red-100 text-red-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-l-4 border-l-yellow-400 text-yellow-800',
          icon: 'text-yellow-500',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-l-4 border-l-blue-400 text-blue-800',
          icon: 'text-blue-500',
          badge: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          container: 'bg-gray-50 border-l-4 border-l-gray-400 text-gray-800',
          icon: 'text-gray-500',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getSeverityBadge = (severity: Alert['severity']) => {
    const severityStyles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant="outline" className={severityStyles[severity]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  if (generatedAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-green-500" />
            Alert Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded border">
            <Info className="h-4 w-4" />
            <span>No safety alerts detected. All medications appear safe for this patient.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alert Center
          </div>
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            {generatedAlerts.length} Alert{generatedAlerts.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {generatedAlerts.map((alert) => {
          const styles = getAlertStyles(alert.type);
          
          return (
            <div
              key={alert.id}
              className={`p-3 rounded-md ${styles.container}`}
            >
              <div className="flex items-start gap-3">
                <div className={styles.icon}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  
                  <p className="text-sm">{alert.message}</p>
                  
                  {alert.medications && alert.medications.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {alert.medications.map((med, index) => (
                        <Badge key={index} variant="outline" className={styles.badge}>
                          {med}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {alert.action && (
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs font-medium">Action: {alert.action}</span>
                    </div>
                  )}
                  
                  {onAlertAction && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => onAlertAction(alert.id, 'acknowledge')}
                        className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded border hover:bg-opacity-75 transition-colors"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => onAlertAction(alert.id, 'resolve')}
                        className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded border hover:bg-opacity-75 transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {generatedAlerts.some(alert => alert.severity === 'critical' || alert.severity === 'high') && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                High-priority alerts detected. Please review before proceeding with treatment.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to check drug interactions
const checkDrugInteractions = (medications: string[]): Array<{
  message: string;
  medications: string[];
  action: string;
  severity: Alert['severity'];
}> => {
  const interactions: Array<{
    message: string;
    medications: string[];
    action: string;
    severity: Alert['severity'];
  }> = [];
  
  // Common interaction patterns
  const interactionRules = [
    {
      drugs: ['sildenafil', 'semaglutide'],
      message: 'Monitor for hypotension when combining Sildenafil with Semaglutide.',
      action: 'Monitor blood pressure closely',
      severity: 'medium' as Alert['severity']
    },
    {
      drugs: ['tadalafil', 'semaglutide'],
      message: 'Monitor for hypotension when combining Tadalafil with Semaglutide.',
      action: 'Monitor blood pressure closely',
      severity: 'medium' as Alert['severity']
    },
    {
      drugs: ['metformin', 'semaglutide'],
      message: 'Enhanced glucose-lowering effect when combining Metformin with Semaglutide.',
      action: 'Monitor blood glucose levels',
      severity: 'low' as Alert['severity']
    },
    {
      drugs: ['sildenafil', 'tadalafil'],
      message: 'Do not combine PDE5 inhibitors (Sildenafil and Tadalafil).',
      action: 'Choose one PDE5 inhibitor only',
      severity: 'high' as Alert['severity']
    }
  ];

  // Check each interaction rule
  interactionRules.forEach(rule => {
    const foundDrugs = rule.drugs.filter(drug => 
      medications.some(med => med.toLowerCase().includes(drug.toLowerCase()))
    );
    
    if (foundDrugs.length >= 2) {
      interactions.push({
        message: rule.message,
        medications: foundDrugs,
        action: rule.action,
        severity: rule.severity
      });
    }
  });

  return interactions;
};

// Helper function to check dosage concerns
const checkDosageConcerns = (medication: string, currentMedications: string[]): Array<{
  message: string;
  action: string;
}> => {
  const concerns = [];
  
  // Check if patient is already on similar medication
  const similarMeds = currentMedications.filter(current => 
    current.toLowerCase().includes(medication.toLowerCase()) ||
    medication.toLowerCase().includes(current.toLowerCase())
  );
  
  if (similarMeds.length > 0) {
    concerns.push({
      message: `Patient may already be taking similar medication: ${similarMeds.join(', ')}`,
      action: 'Verify current medications and adjust dosing accordingly'
    });
  }
  
  return concerns;
};

export default AlertCenterCard;
