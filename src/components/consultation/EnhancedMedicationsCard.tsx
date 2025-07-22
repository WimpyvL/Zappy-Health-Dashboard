import React from 'react';
import { Plus, ArrowUp, ArrowDown, XCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface Medication {
  id: string;
  name: string;
  category: 'wm' | 'ed' | 'pc' | 'mh' | 'derm' | 'hair';
  dosages: string[];
  defaultDosage: string;
  frequency: string;
  instructions: string;
  isSelected: boolean;
  currentDosage?: string;
  approach?: 'Maint.' | 'Escalation' | 'De-Escal.' | 'PRN' | 'Daily';
  duration?: string;
  isPatientPreference?: boolean;
  contraindications?: string[];
}

interface EnhancedMedicationsCardProps {
  medications?: Medication[];
  selectedMedications?: string[];
  medicationDosages?: Record<string, string>;
  onMedicationToggle?: (medicationId: string, selected: boolean) => void;
  onDosageChange?: (medicationId: string, dosage: string) => void;
  onApproachChange?: (medicationId: string, approach: string) => void;
  onInstructionsChange?: (medicationId: string, instructions: string) => void;
  isLoading?: boolean;
  error?: string | null;
  intakeData?: any;
}

const EnhancedMedicationsCard: React.FC<EnhancedMedicationsCardProps> = ({
  medications = [],
  selectedMedications = [],
  medicationDosages = {},
  onMedicationToggle,
  onDosageChange,
  onApproachChange,
  onInstructionsChange,
  isLoading = false,
  error = null,
  intakeData
}) => {
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});
  const [showMoreMeds, setShowMoreMeds] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Category display names and colors
  const categoryConfig = {
    wm: { name: 'Weight Management', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    ed: { name: 'Erectile Dysfunction', color: 'bg-purple-500', bgColor: 'bg-purple-50' },
    pc: { name: 'Primary Care', color: 'bg-green-500', bgColor: 'bg-green-50' },
    mh: { name: 'Mental Health', color: 'bg-orange-500', bgColor: 'bg-orange-50' },
    derm: { name: 'Dermatology', color: 'bg-pink-500', bgColor: 'bg-pink-50' },
    hair: { name: 'Hair Loss', color: 'bg-indigo-500', bgColor: 'bg-indigo-50' }
  };

  // Group medications by category
  const medicationsByCategory = React.useMemo(() => {
    const grouped = medications.reduce((acc, med) => {
      if (!acc[med.category]) {
        acc[med.category] = [];
      }
      acc[med.category].push(med);
      return acc;
    }, {} as Record<string, Medication[]>);

    // Filter by search term if provided
    if (searchTerm) {
      Object.keys(grouped).forEach(category => {
        const categoryMeds = grouped[category];
        if (categoryMeds) {
          grouped[category] = categoryMeds.filter(med =>
            med.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      });
    }

    return grouped;
  }, [medications, searchTerm]);

  // Get selected medications for display
  const selectedMeds = React.useMemo(() => {
    return medications.filter(med => selectedMedications.includes(med.id));
  }, [medications, selectedMedications]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleDosageSelect = (medicationId: string, dosage: string) => {
    onDosageChange?.(medicationId, dosage);
  };

  const handleApproachChange = (medicationId: string, approach: string) => {
    onApproachChange?.(medicationId, approach);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin h-6 w-6 mr-2" />
            <span>Loading medications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error loading medications: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Medications</CardTitle>
        <Button size="sm" onClick={() => setShowMoreMeds(!showMoreMeds)}>
          <Plus className="mr-2 h-4 w-4" />
          {showMoreMeds ? 'Hide' : 'Add'} Medications
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intake Integration Indicator */}
        {intakeData && (
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded border">
            ✅ Medications suggested based on intake form data
          </div>
        )}

        {/* Selected Medications */}
        {selectedMeds.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Selected Medications</h4>
            {Object.entries(medicationsByCategory).map(([category, meds]) => {
              const selectedInCategory = meds.filter(med => selectedMedications.includes(med.id));
              if (selectedInCategory.length === 0) return null;

              const config = categoryConfig[category as keyof typeof categoryConfig];
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span className="font-medium text-sm">{config.name}</span>
                  </div>
                  
                  {selectedInCategory.map((med) => (
                    <MedicationItem
                      key={med.id}
                      medication={med}
                      isSelected={true}
                      currentDosage={medicationDosages[med.id] || med.defaultDosage}
                      onToggle={onMedicationToggle}
                      onDosageChange={handleDosageSelect}
                      onApproachChange={handleApproachChange}
                      onInstructionsChange={onInstructionsChange}
                      categoryConfig={config}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Add More Medications Section */}
        {showMoreMeds && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Available Medications</h4>
              <Input
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
            </div>

            {Object.entries(medicationsByCategory).map(([category, meds]) => {
              const availableMeds = meds.filter(med => !selectedMedications.includes(med.id));
              if (availableMeds.length === 0) return null;

              const config = categoryConfig[category as keyof typeof categoryConfig];
              const isExpanded = expandedCategories[category];
              
              return (
                <div key={category} className="space-y-2">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${config.color}`} />
                      <span className="font-medium text-sm">{config.name}</span>
                      <Badge variant="outline">{availableMeds.length}</Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="space-y-2 pl-4">
                      {availableMeds.map((med) => (
                        <MedicationItem
                          key={med.id}
                          medication={med}
                          isSelected={false}
                          currentDosage={med.defaultDosage}
                          onToggle={onMedicationToggle}
                          onDosageChange={handleDosageSelect}
                          onApproachChange={handleApproachChange}
                          onInstructionsChange={onInstructionsChange}
                          categoryConfig={config}
                          isCompact={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedMeds.length === 0 && !showMoreMeds && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No medications selected</p>
            <p className="text-xs mt-1">Click "Add Medications" to browse available options</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Individual Medication Item Component
interface MedicationItemProps {
  medication: Medication;
  isSelected: boolean;
  currentDosage: string;
  onToggle?: ((medicationId: string, selected: boolean) => void) | undefined;
  onDosageChange?: ((medicationId: string, dosage: string) => void) | undefined;
  onApproachChange?: ((medicationId: string, approach: string) => void) | undefined;
  onInstructionsChange?: ((medicationId: string, instructions: string) => void) | undefined;
  categoryConfig: { name: string; color: string; bgColor: string };
  isCompact?: boolean;
}

const MedicationItem: React.FC<MedicationItemProps> = ({
  medication,
  isSelected,
  currentDosage,
  onToggle,
  onDosageChange,
  onApproachChange,
  onInstructionsChange,
  categoryConfig,
  isCompact = false
}) => {
  const [showControls, setShowControls] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);

  if (isCompact) {
    return (
      <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onToggle?.(medication.id, !!checked)}
          />
          <span className="text-sm">{medication.name}</span>
          {medication.isPatientPreference && (
            <Badge variant="outline" className="text-xs">Patient Preference</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {medication.dosages.map((dosage) => (
            <Button
              key={dosage}
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => onDosageChange?.(medication.id, dosage)}
            >
              {dosage}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${categoryConfig.bgColor} border-opacity-50`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onToggle?.(medication.id, !!checked)}
          />
          <div>
            <div className="font-semibold text-sm">{medication.name}</div>
            <div className="text-xs text-gray-600">
              Previous: {medication.currentDosage || 'None'}
            </div>
          </div>
        </div>
        <Select defaultValue={medication.frequency}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="prn">As Needed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Medication Controls */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowControls(!showControls)}
        >
          <ArrowUp className="h-3 w-3 mr-1" />
          Increase
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-primary/10 border-primary/50 text-primary hover:bg-primary/20"
        >
          Maintain
        </Button>
        <Button variant="outline" size="sm">
          <ArrowDown className="h-3 w-3 mr-1" />
          Decrease
        </Button>
        <Button variant="outline" size="sm">
          <XCircle className="h-3 w-3 mr-1" />
          Stop
        </Button>
      </div>

      {/* Dosage Selection */}
      <div className="flex flex-wrap gap-2 mb-3">
        {medication.dosages.map((dosage) => (
          <Button
            key={dosage}
            variant={currentDosage === dosage ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => onDosageChange?.(medication.id, dosage)}
          >
            {dosage}
          </Button>
        ))}
      </div>

      {/* Plan and Approach */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Duration</label>
          <Select defaultValue={medication.duration || "6m"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 month</SelectItem>
              <SelectItem value="3m">3 months</SelectItem>
              <SelectItem value="6m">6 months</SelectItem>
              <SelectItem value="12m">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Approach</label>
          <Select
            defaultValue={medication.approach || "Maint."}
            onValueChange={(value) => onApproachChange?.(medication.id, value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Maint.">Maintain</SelectItem>
              <SelectItem value="Escalation">Escalation</SelectItem>
              <SelectItem value="De-Escal.">De-Escalation</SelectItem>
              <SelectItem value="PRN">As Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="text-xs font-medium text-gray-600">Instructions</label>
        <div className="relative">
          <Input
            defaultValue={medication.instructions}
            className="pr-10"
            onBlur={(e) => onInstructionsChange?.(medication.id, e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 right-1 h-7 w-7"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            {showInstructions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Contraindications Warning */}
      {medication.contraindications && medication.contraindications.length > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>Contraindications:</strong> {medication.contraindications.join(', ')}
        </div>
      )}
    </div>
  );
};

export default EnhancedMedicationsCard;
