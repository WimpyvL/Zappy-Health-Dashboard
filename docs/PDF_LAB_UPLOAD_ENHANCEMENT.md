# 📄 PDF Lab Upload Enhancement

## 🎯 **Current Limitation**
The current system only allows manual entry of lab values. When providers receive PDF lab reports from external labs, they need a way to:
1. Upload the PDF file
2. Store it securely
3. Extract/enter the key values for display
4. Link the PDF to the structured data

## 🚀 **Enhanced Solution: Hybrid PDF + Data Approach**

### **User Workflow**
```
1. Provider clicks "Upload Lab Results"
2. Provider selects PDF file from computer
3. PDF uploads to Supabase Storage
4. Provider manually enters key values from the PDF
5. System stores both PDF and structured data
6. UI shows structured data with "View PDF" link
```

### **Technical Implementation**

#### **Enhanced API Hook**
```javascript
// Enhanced src/apis/labResults/hooks.js
export const useUploadLabPDF = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadLabPDF = async (patientId, file, labData) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Upload PDF to Supabase Storage
      const filePath = `lab-results/${patientId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Create database record with both PDF and structured data
      const { data, error } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          document_type: 'lab_result',
          file_name: file.name,
          storage_path: filePath,
          notes: JSON.stringify({
            testDate: labData.testDate,
            orderingProvider: labData.orderingProvider,
            labName: labData.labName,
            tests: labData.tests,
            hasPDF: true,
            pdfPath: filePath
          }),
          status: 'verified'
        });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { uploadLabPDF, loading, error };
};

// Get PDF download URL
export const useLabPDFUrl = () => {
  const getPDFUrl = async (filePath) => {
    const { data, error } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  return { getPDFUrl };
};
```

#### **Enhanced Upload Modal**
```javascript
// Enhanced Upload Modal Component
const LabUploadModal = ({ patientId, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1); // 1: Upload PDF, 2: Enter Data
  const [labData, setLabData] = useState({
    testDate: '',
    orderingProvider: '',
    labName: '',
    tests: [{ name: '', value: '', unit: '', referenceRange: '', status: 'normal' }]
  });

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStep(2); // Move to data entry step
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file && labData.testDate && labData.tests[0].name) {
      onUpload({ file, labData });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {step === 1 ? (
          // Step 1: PDF Upload
          <div>
            <h3>Upload Lab Results PDF</h3>
            <div className="file-upload-area">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="file-upload-label">
                <div className="upload-icon">📄</div>
                <div>Click to select PDF file</div>
                <div className="upload-hint">PDF files only</div>
              </label>
            </div>
          </div>
        ) : (
          // Step 2: Data Entry
          <div>
            <h3>Enter Lab Values</h3>
            <div className="file-info">
              📄 {file.name}
              <button onClick={() => setStep(1)}>Change File</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Lab info fields */}
              <div className="form-group">
                <label>Test Date *</label>
                <input
                  type="date"
                  value={labData.testDate}
                  onChange={(e) => setLabData(prev => ({ ...prev, testDate: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Lab Name</label>
                <input
                  type="text"
                  value={labData.labName}
                  onChange={(e) => setLabData(prev => ({ ...prev, labName: e.target.value }))}
                  placeholder="e.g., Quest Diagnostics"
                />
              </div>

              {/* Test results */}
              <h4>Test Results</h4>
              {labData.tests.map((test, index) => (
                <div key={index} className="test-input-group">
                  <input
                    placeholder="Test Name *"
                    value={test.name}
                    onChange={(e) => {
                      const newTests = [...labData.tests];
                      newTests[index].name = e.target.value;
                      setLabData(prev => ({ ...prev, tests: newTests }));
                    }}
                    required
                  />
                  <input
                    placeholder="Value *"
                    value={test.value}
                    onChange={(e) => {
                      const newTests = [...labData.tests];
                      newTests[index].value = e.target.value;
                      setLabData(prev => ({ ...prev, tests: newTests }));
                    }}
                    required
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
        )}
      </div>
    </div>
  );
};
```

#### **Enhanced Results Display**
```javascript
// Enhanced PatientLabResults.jsx
{labResults.map((result) => (
  <tr key={result.id}>
    <td>
      <div style={{ fontWeight: '600' }}>{result.name}</div>
      <div className="lab-reference">{result.category}</div>
    </td>
    <td>
      <div className={`lab-value ${result.status}`} style={{ color: valueColor }}>
        {result.value} {result.unit}
      </div>
    </td>
    <td>
      <div>{result.referenceRange}</div>
      <div className="lab-reference">{result.referenceNote}</div>
    </td>
    <td>
      <span className="tag" style={{ /* status styling */ }}>
        {result.status}
      </span>
    </td>
    <td>{formatDate(result.date)}</td>
    <td>
      {result.hasPDF && (
        <button 
          className="btn btn-sm btn-secondary"
          onClick={() => viewPDF(result.pdfPath)}
        >
          📄 View PDF
        </button>
      )}
    </td>
  </tr>
))}
```

## 🎯 **Benefits of This Approach**

### **For Providers**
- ✅ Upload actual PDF lab reports
- ✅ Store original documents securely
- ✅ Quick data entry for key values
- ✅ View original PDF when needed
- ✅ Professional data display

### **For Patients**
- ✅ Access to original lab reports
- ✅ Easy-to-read structured data
- ✅ Historical tracking
- ✅ Downloadable documents

### **Technical Benefits**
- ✅ Uses existing Supabase Storage
- ✅ Secure file access with signed URLs
- ✅ Flexible data structure
- ✅ No OCR complexity initially
- ✅ Can add OCR later for automation

## 🚀 **Future Enhancements**

1. **OCR Integration**: Automatically extract values from PDFs
2. **Template Recognition**: Recognize common lab formats
3. **Bulk Upload**: Upload multiple lab reports at once
4. **Lab Integration**: Direct API connections to major labs
5. **AI Parsing**: Use AI to extract and categorize lab values

This hybrid approach gives providers the best of both worlds: secure document storage with structured data for analysis and trending.
