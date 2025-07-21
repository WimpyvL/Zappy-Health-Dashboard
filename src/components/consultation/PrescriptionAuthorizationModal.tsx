import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  AlertTriangle, 
  Shield, 
  FileText, 
  Clock,
  User,
  Pill,
  Building,
  CheckCircle
} from 'lucide-react';
import { prescriptionOrchestrator } from '@/services/prescriptionOrchestrator';
import { contraindicationsService } from '@/services/contraindicationsService';
import ContraindicationsDisplay from './ContraindicationsDisplay';
import { useToast } from '@/hooks/use-toast';

const prescriptionSchema = z.object({
  medication: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  instructions: z.string().min(1, "Instructions are required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  refills: z.number().min(0, "Refills cannot be negative").max(11, "Maximum 11 refills allowed"),
  daysSupply: z.number().min(1, "Days supply must be at least 1"),
  pharmacyId: z.string().min(1, "Pharmacy selection is required"),
  patientAllergies: z.array(z.string()).optional(),
  patientMedications: z.array(z.string()).optional(),
  specialInstructions: z.string().optional(),
  acknowledgeRisks: z.boolean().refine(val => val === true, "Must acknowledge risks")
});

interface Pharmacy {
  id: string;
  name: string;
  type: string;
}

interface ComplianceFlag {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  details: string | any[];
}

interface AuthorizationStatus {
  authorized: boolean;
  reason?: string;
}

interface PrescriptionAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  providerId: string;
  patient: any;
  product: any;
  onSuccess?: (prescriptionId: string) => void;
}

export const PrescriptionAuthorizationModal: React.FC<PrescriptionAuthorizationModalProps> = ({
  isOpen,
  onClose,
  orderId,
  providerId,
  patient,
  product,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [complianceFlags, setComplianceFlags] = useState<ComplianceFlag[]>([]);
  const [authorizationStatus, setAuthorizationStatus] = useState<AuthorizationStatus | null>(null);
  const [contraindicationsResult, setContraindicationsResult] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medication: product?.genericName || product?.name || '',
      dosage: product?.strengthDosage || '',
      instructions: '',
      quantity: 30,
      refills: 0,
      daysSupply: 30,
      pharmacyId: '',
      patientAllergies: patient?.allergies || [],
      patientMedications: patient?.currentMedications || [],
      specialInstructions: '',
      acknowledgeRisks: false
    }
  });

  // Load pharmacies and validate provider authorization
  useEffect(() => {
    if (isOpen) {
      loadPharmacies();
      validateProviderAuthorization();
    }
  }, [isOpen, providerId, product?.id]);

  const loadPharmacies = async () => {
    try {
      // This would fetch from your pharmacies collection
      const mockPharmacies = [
        { id: 'pharmacy_1', name: 'CVS Pharmacy - Main St', type: 'Retail' },
        { id: 'pharmacy_2', name: 'Walgreens - Downtown', type: 'Retail' },
        { id: 'pharmacy_3', name: 'Specialty Pharmacy Solutions', type: 'Specialty' }
      ];
      setPharmacies(mockPharmacies);
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    }
  };

  const validateProviderAuthorization = async () => {
    try {
      const authResult = await prescriptionOrchestrator.validateProviderAuthorization(
        providerId, 
        product?.id
      );
      setAuthorizationStatus(authResult);
    } catch (error) {
      console.error('Error validating provider authorization:', error);
      setAuthorizationStatus({ authorized: false, reason: 'Authorization check failed' });
    }
  };

  const checkCompliance = async (data: any) => {
    try {
      const complianceResult = await prescriptionOrchestrator.checkComplianceFlags({
        ...data,
        patientAllergies: patient?.allergies,
        patientMedications: patient?.currentMedications,
        patientMedicalHistory: patient?.medicalHistory,
        patientAge: patient?.age,
        patientGender: patient?.gender,
        isPregnant: patient?.isPregnant
      });
      
      const typedFlags: ComplianceFlag[] = complianceResult.flags?.map((flag: any) => ({
        type: flag.type,
        severity: flag.severity as 'critical' | 'warning' | 'info',
        details: Array.isArray(flag.details) ? flag.details.join(', ') : flag.details || ''
      })) || [];
      
      setComplianceFlags(typedFlags);
      setContraindicationsResult(complianceResult);
      return complianceResult;
    } catch (error) {
      console.error('Error checking compliance:', error);
      const errorResult = { flags: [], hasAbsoluteContraindications: false, recommendationAction: 'MANUAL_REVIEW_REQUIRED' };
      setContraindicationsResult(errorResult);
      return errorResult;
    }
  };

  const handleSubmit = async (data: any) => {
    if (!authorizationStatus?.authorized) {
      toast({
        variant: "destructive",
        title: "Authorization Required",
        description: authorizationStatus?.reason || "Provider not authorized"
      });
      return;
    }

    setLoading(true);
    try {
      // Check compliance before submission
      const complianceResult = await checkCompliance(data);
      
      // Show critical warnings for absolute contraindications
      if (complianceResult.hasAbsoluteContraindications) {
        const shouldContinue = window.confirm(
          `CRITICAL SAFETY ALERT: Absolute contraindications detected. This medication should NOT be prescribed. Continue anyway?`
        );
        if (!shouldContinue) {
          setLoading(false);
          return;
        }
      }

      // Submit prescription
      const result = await prescriptionOrchestrator.authorizePrescription(
        orderId,
        providerId,
        {
          ...data,
          patientAllergies: patient?.allergies,
          patientMedications: patient?.currentMedications,
          patientMedicalHistory: patient?.medicalHistory,
          patientAge: patient?.age,
          patientGender: patient?.gender,
          isPregnant: patient?.isPregnant,
          expiresAt: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) // 1 year
        }
      );

      if (result.success) {
        toast({
          title: "Prescription Authorized",
          description: `Prescription has been sent to ${pharmacies.find(p => p.id === data.pharmacyId)?.name || 'selected pharmacy'}`
        });
        
        // Create audit trail
        await prescriptionOrchestrator.createAuditTrail('prescription_authorized', {
          userId: providerId,
          patientId: patient?.id,
          prescriptionId: result.prescriptionId,
          orderId: orderId,
          details: `Prescription authorized for ${data.medication}`,
          ipAddress: '127.0.0.1', // This would come from request
          userAgent: navigator.userAgent
        });

        onSuccess?.(result.prescriptionId);
        onClose();
      } else {
        throw new Error('Failed to authorize prescription');
      }
    } catch (error) {
      console.error('Error authorizing prescription:', error);
      toast({
        variant: "destructive",
        title: "Authorization Failed",
        description: (error as Error)?.message || "Could not authorize prescription"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info'): 'default' | 'destructive' => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning':
      case 'info':
      default: return 'default';
    }
  };

  if (!authorizationStatus) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <Shield className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Validating provider authorization...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!authorizationStatus.authorized) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Authorization Required
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {authorizationStatus.reason}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Prescription Authorization
          </DialogTitle>
          <DialogDescription>
            Authorize prescription for {patient?.name} - {product?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{patient?.name}</p>
                <p className="text-sm text-muted-foreground">DOB: {patient?.dateOfBirth}</p>
              </div>
              {patient?.allergies?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600">Allergies:</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy: string, idx: number) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {patient?.currentMedications?.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Current Medications:</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.currentMedications.map((med: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{product?.name}</p>
                <p className="text-sm text-muted-foreground">{product?.genericName}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={product?.productType === 'controlled' ? 'destructive' : 'secondary'}>
                  {product?.productType || 'prescription'}
                </Badge>
                {product?.controlledSchedule && (
                  <Badge variant="outline">{product.controlledSchedule}</Badge>
                )}
              </div>
              {product?.complianceFlags && (
                <p className="text-xs text-muted-foreground">{product.complianceFlags}</p>
              )}
            </CardContent>
          </Card>

          {/* Compliance Flags */}
          {complianceFlags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Safety Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {complianceFlags.map((flag, idx) => (
                  <Alert key={idx} variant={getSeverityColor(flag.severity)}>
                    <AlertDescription className="text-xs">
                      <strong>{flag.type}:</strong> {flag.details}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contraindications Display */}
        {contraindicationsResult?.contraindicationsResult?.contraindications && (
          <ContraindicationsDisplay
            contraindications={contraindicationsResult.contraindicationsResult.contraindications}
            hasAbsoluteContraindications={contraindicationsResult.hasAbsoluteContraindications || false}
            recommendationAction={contraindicationsResult.recommendationAction || 'SAFE_TO_PRESCRIBE'}
            medicationName={form.watch("medication") || product?.name || ''}
            patientName={patient?.name || 'Patient'}
            onAcknowledge={(contraindications) => {
              console.log('Contraindications acknowledged:', contraindications);
            }}
            className="my-6"
          />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="medication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 25mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Directions for Use</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Take one tablet daily with food..." 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="refills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refills</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="11" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daysSupply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days Supply</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pharmacyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Pharmacy
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pharmacy" />
                      </SelectTrigger>
                      <SelectContent>
                        {pharmacies.map(pharmacy => (
                          <SelectItem key={pharmacy.id} value={pharmacy.id}>
                            {pharmacy.name} ({pharmacy.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes for pharmacy..." 
                      {...field} 
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acknowledgeRisks"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                    />
                  </FormControl>
                  <FormLabel className="text-sm">
                    I acknowledge that I have reviewed the patient's medical history, allergies, and current medications, and that this prescription is medically appropriate.
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Authorize Prescription
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PrescriptionAuthorizationModal;