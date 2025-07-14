# 🧪 Lab Results Integration - Detailed Technical Plan

## 🎯 **Overview**
This document provides a comprehensive technical plan for integrating lab results into the patient management system using a hybrid document-based approach.

## 📊 **Current State Analysis**

### **Existing Assets**
- ✅ **UI Component**: `PatientLabResults.jsx` with beautiful design and sample data
- ✅ **Database Table**: `patient_documents` table available for storage
- ✅ **Storage**: Supabase Storage for file uploads
- ✅ **Infrastructure**: Authentication and API patterns established

### **Missing Components**
- ❌ **API Hooks**: No lab results data fetching
- ❌ **Upload System**: No lab result upload functionality
- ❌ **Data Integration**: Component uses sample data only
- ❌ **File Management**: No PDF viewing/download

## 🏗️ **Technical Architecture**

### **Data Storage Strategy**
```sql
-- Leverage existing patient_documents table
-- Structure for lab results:
{
  patient_id: "uuid",
  document_type: "lab_result",
  file_name: "Lipid_Panel_2025-06-03.pdf",
  storage_path: "lab-results/patient-123/lipid-panel-2025-06-03.pdf",
  notes: JSON.stringify({
    testDate: "2025-06-03",
    orderingProvider: "Dr. Sarah Chen",
    labName: "Quest Diagnostics",
    tests: [
      {
        name: "Total Cholesterol",
        value: 210,
        unit: "mg/dL",
        referenceRange: "< 200",
        status: "elevated",
        flagged: true
      }
    ],
    summary: "Lipid panel shows elevated cholesterol levels",
    recommendations: ["Dietary modifications recommended"]
  }),
  status: "verified",
  created_at: "2025-06-03T10:30:00Z"
}
```

### **API Layer Design**
```javascript
// src/apis/labResults/api.js
export const labResultsApi = {
  // Fetch lab results for a patient
  getLabResults: async (patientId) => {
    const { data, error } = await supabase
      .from('patient_documents')
      .select('*')
      .eq('patient_id', patientId)
      .eq('document_type', 'lab_result')
      .order('created_at', { ascending: false });
    
    return data?.map(doc => ({
      ...doc,
      labData: JSON.parse(doc.notes || '{}')
    }));
  },

  // Upload new lab result
  uploadLabResult: async (file, patientId, labData) => {
    // 1. Upload PDF to storage
    const filePath = `lab-results/${patientId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(filePath, file);

    // 2. Create database record
    const { data, error } = await supabase
      .from('patient_documents')
      .insert({
        patient_id: patientId,
        document_type: 'lab_result',
        file_name: file.name,
        storage_path: filePath,
        notes: JSON.stringify(labData),
        status: 'pending'
      });

    return { data, error };
  },

  // Get lab result trends
  getLabTrends: async (patientId, testName) => {
    const results = await this.getLabResults(patientId);
    return results
      .filter(result => 
        result.labData.tests?.some(test => test.name === testName)
      )
      .map(result => ({
        date: result.labData.testDate,
        value: result.labData.tests.find(test => test.name === testName)?.value
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }
};
```

### **React Hooks Implementation**
```javascript
// src/apis/labResults/hooks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labResultsApi } from './api';

export const useLabResults = (patientId) => {
  return useQuery({
    queryKey: ['labResults', patientId],
    queryFn: () => labResultsApi.getLabResults(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUploadLabResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, patientId, labData }) => 
      labResultsApi.uploadLabResult(file, patientId, labData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch lab results
      queryClient.invalidateQueries(['labResults', variables.patientId]);
    },
  });
};

export const useLabTrends = (patientId, testName) => {
  return useQuery({
    queryKey: ['labTrends', patientId, testName],
    queryFn: () => labResultsApi.getLabTrends(patientId, testName),
    enabled: !!patientId && !!testName,
  });
};
```

## 🎨 **UI Component Integration**

### **Enhanced PatientLabResults Component**
```javascript
// Modified src/pages/patients/components/PatientLabResults.jsx
import React, { useState } from 'react';
import { useLabResults, useUploadLabResult } from '../../../apis/labResults/hooks';
import LabUploadModal from './LabUploadModal';
import PDFViewer from './PDFViewer';

const PatientLabResults = ({ patient }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  
  const { data: labResults, isLoading, error } = useLabResults(patient.id);
  const uploadMutation = useUploadLabResult();

  // Transform lab results for display
  const transformedResults = labResults?.flatMap(result => 
    result.labData.tests?.map(test => ({
      ...test,
      date: result.labData.testDate,
      provider: result.labData.orderingProvider,
      pdfPath: result.storage_path
    })) || []
  ) || [];

  if (isLoading) return <div>Loading lab results...</div>;
  if (error) return <div>Error loading lab results: {error.message}</div>;

  return (
    <div>
      {/* Header with Upload Button */}
      <div className="card-header">
        <h2 className="card-title h2">🧪 Lab Results</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowUploadModal(true)}
        >
          Upload Lab Results
        </button>
      </div>

      {/* Results Table */}
      <table className="lab-table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Value</th>
            <th>Reference Range</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transformedResults.map((result, index) => (
            <tr key={index}>
              <td>{result.name}</td>
              <td style={{ color: getValueColor(result.status) }}>
                {result.value} {result.unit}
              </td>
              <td>{result.referenceRange}</td>
              <td>
                <span className={`status-badge ${result.status}`}>
                  {result.status}
                </span>
              </td>
              <td>{formatDate(result.date)}</td>
              <td>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSelectedPDF(result.pdfPath)}
                >
                  View PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modals */}
      {showUploadModal && (
        <LabUploadModal
          patientId={patient.id}
          onClose={() => setShowUploadModal(false)}
          onUpload={(data) => uploadMutation.mutate(data)}
        />
      )}

      {selectedPDF && (
        <PDFViewer
          filePath={selectedPDF}
          onClose={() => setSelectedPDF(null)}
        />
      )}
    </div>
  );
};
```

### **Lab Upload Modal Component**
```javascript
// src/pages/patients/components/LabUploadModal.jsx
import React, { useState } from 'react';

const LabUploadModal = ({ patientId, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [labData, setLabData] = useState({
    testDate: '',
    orderingProvider: '',
    labName: '',
    tests: [{ name: '', value: '', unit: '', referenceRange: '', status: 'normal' }]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file && labData.testDate) {
      onUpload({ file, patientId, labData });
      onClose();
    }
  };

  const addTest = () => {
    setLabData(prev => ({
      ...prev,
      tests: [...prev.tests, { name: '', value: '', unit: '', referenceRange: '', status: 'normal' }]
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Upload Lab Results</h3>
        
        <form onSubmit={handleSubmit}>
          {/* File Upload */}
          <div className="form-group">
            <label>Lab Report PDF</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>

          {/* Lab Info */}
          <div className="form-group">
            <label>Test Date</label>
            <input
              type="date"
              value={labData.testDate}
              onChange={(e) => setLabData(prev => ({ ...prev, testDate: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Ordering Provider</label>
            <input
              type="text"
              value={labData.orderingProvider}
              onChange={(e) => setLabData(prev => ({ ...prev, orderingProvider: e.target.value }))}
            />
          </div>

          {/* Test Results */}
          <h4>Test Results</h4>
          {labData.tests.map((test, index) => (
            <div key={index} className="test-input-group">
              <input
                placeholder="Test Name"
                value={test.name}
                onChange={(e) => {
                  const newTests = [...labData.tests];
                  newTests[index].name = e.target.value;
                  setLabData(prev => ({ ...prev, tests: newTests }));
                }}
              />
              <input
                placeholder="Value"
                value={test.value}
                onChange={(e) => {
                  const newTests = [...labData.tests];
                  newTests[index].value = e.target.value;
                  setLabData(prev => ({ ...prev, tests: newTests }));
                }}
              />
              <input
                placeholder="Unit"
                value={test.unit}
                onChange={(e) => {
                  const newTests = [...labData.tests];
                  newTests[index].unit = e.target.value;
                  setLabData(prev => ({ ...prev, tests: newTests }));
                }}
              />
              <select
                value={test.status}
                onChange={(e) => {
                  const newTests = [...labData.tests];
                  newTests[index].status = e.target.value;
                  setLabData(prev => ({ ...prev, tests: newTests }));
                }}
              >
                <option value="normal">Normal</option>
                <option value="elevated">Elevated</option>
                <option value="low">Low</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          ))}
          
          <button type="button" onClick={addTest}>Add Another Test</button>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Upload Lab Results</button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

## 🚀 **Implementation Phases**

### **Phase 1: Basic Integration (Day 1)**
1. ✅ Create `src/apis/labResults/` directory
2. ✅ Implement basic API functions
3. ✅ Create React hooks for data fetching
4. ✅ Modify `PatientLabResults.jsx` to use real data
5. ✅ Add loading and error states

### **Phase 2: Upload Functionality (Day 2)**
1. ✅ Create `LabUploadModal` component
2. ✅ Implement file upload to Supabase Storage
3. ✅ Add form for manual lab data entry
4. ✅ Connect upload to database

### **Phase 3: Enhanced Features (Day 3)**
1. ✅ Create `PDFViewer` component
2. ✅ Add lab result trends/history
3. ✅ Implement status management
4. ✅ Add clinical recommendations

### **Phase 4: Polish & Testing (Day 4)**
1. ✅ Error handling and validation
2. ✅ Performance optimization
3. ✅ User experience improvements
4. ✅ Integration testing

## 🔧 **Technical Benefits**

### **Scalability**
- Uses existing database infrastructure
- No new tables required
- Flexible JSON storage for different lab formats

### **Performance**
- Efficient querying with proper indexing
- Cached results with React Query
- Lazy loading of PDF files

### **User Experience**
- Seamless integration with existing UI
- Real-time data updates
- Professional medical data presentation

### **Maintainability**
- Clean separation of concerns
- Reusable API patterns
- Type-safe data structures

## 📊 **Data Flow Architecture**

```
1. Provider uploads PDF → Supabase Storage
2. Provider enters test values → Structured JSON
3. System creates patient_documents record
4. UI fetches structured data for display
5. PDF viewer loads files on demand
6. Trends calculated from historical data
```

## 🎯 **Success Metrics**

- [ ] Lab results display real patient data
- [ ] Upload functionality works seamlessly
- [ ] PDF viewing integrated
- [ ] Performance meets standards (<2s load time)
- [ ] Error handling covers edge cases
- [ ] Mobile responsive design

This approach provides a **production-ready lab results system** that integrates seamlessly with existing infrastructure while providing room for future enhancements like OCR, automated alerts, and advanced analytics.
