# Phase 2: Integration Guide for Telehealth Flow Foundation

## Overview
This guide addresses how to integrate the new telehealth flow foundation with your existing site components, answering your specific questions about category selection, subscription options, enhanced intake forms, and flow progress indicators.

---

## 🛍️ **1. Category Selection Pages with Product Recommendations**

### **Current State Analysis**
Your existing `ShopPage.jsx` already has:
- ✅ Category cards and product cards
- ✅ Product recommendations via `SmartProductRecommendation`
- ✅ Cart functionality
- ✅ Category-based product organization

### **Integration Strategy: ENHANCE, Don't Replace**

#### **A. Enhance Existing ShopPage with Flow Integration**

```javascript
// Add to src/pages/patients/ShopPage.jsx
import { useTelehealthFlow } from '../../hooks/useTelehealthFlow';
import { CategoryProductOrchestrator } from '../../services/categoryProductOrchestrator';

const ShopPage = () => {
  const { initializeFlow, getProductRecommendations } = useTelehealthFlow();
  
  // Enhance existing openCategory function
  const openCategory = async (categoryId) => {
    setSelectedCategory(categoryId);
    
    // NEW: Initialize telehealth flow when category is selected
    const flowResult = await initializeFlow({ 
      categoryId,
      patientId: user?.id 
    });
    
    if (flowResult.success) {
      // Show AI-powered recommendations for this category
      const recommendations = await getProductRecommendations(categoryId);
      setRecommendations(recommendations);
    }
    
    console.log('Category selected:', categoryId);
  };

  // Enhance existing handleAddToCart function
  const handleAddToCart = async (product) => {
    if (product.requiresPrescription) {
      // NEW: Start telehealth flow instead of just showing message
      const flowResult = await initializeFlow({
        categoryId: product.category,
        productId: product.id,
        patientId: user?.id
      });
      
      if (flowResult.success) {
        // Navigate to intake form with flow context
        navigate('/intake', { 
          state: { 
            flowId: flowResult.flow.id,
            productCategory: product.category,
            prescriptionItems: [product]
          }
        });
      }
    } else {
      // Existing cart logic for non-prescription items
      addItem(enhancedProduct, defaultDose);
      message.success(`${product.name} added to cart!`);
    }
  };
};
```

#### **B. Add Flow-Aware Product Recommendations**

```javascript
// Enhance SmartProductRecommendation component
const SmartProductRecommendation = ({ categoryId, handleViewBundle, handleSkip }) => {
  const { getProductRecommendations } = useTelehealthFlow();
  const [aiRecommendations, setAiRecommendations] = useState([]);

  useEffect(() => {
    if (categoryId) {
      getProductRecommendations(categoryId).then(setAiRecommendations);
    }
  }, [categoryId]);

  return (
    <div className="ai-recommendations">
      <h3>Recommended for You</h3>
      {aiRecommendations.map(rec => (
        <ProductRecommendationCard 
          key={rec.product.id}
          product={rec.product}
          reason={rec.recommendation_reason}
          confidence={rec.recommendation_score}
          onSelect={() => handleProductSelect(rec.product)}
        />
      ))}
    </div>
  );
};
```

---

## 💳 **2. Subscription Option Selection Components**

### **Current State Analysis**
You mentioned having subscription placeholders. Let's enhance them with the new foundation.

#### **A. Enhanced Product Card with Subscription Options**

```javascript
// Enhance existing ProductCard component
const ProductCard = ({ product, onSelect, programClass, ...props }) => {
  const { getSubscriptionOptions, calculatePricing } = useTelehealthFlow();
  const [subscriptionOptions, setSubscriptionOptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    // Load subscription options for this product
    getSubscriptionOptions(product.id).then(setSubscriptionOptions);
  }, [product.id]);

  const handleSubscriptionSelect = async (subscriptionId) => {
    setSelectedSubscription(subscriptionId);
    
    // Calculate real-time pricing
    const pricingResult = await calculatePricing(
      product.id, 
      subscriptionId, 
      product.category_id
    );
    setPricing(pricingResult);
  };

  return (
    <div className={`product-card ${programClass}`}>
      {/* Existing product card content */}
      
      {/* NEW: Subscription Options */}
      {subscriptionOptions.length > 0 && (
        <div className="subscription-options">
          <h4>Subscription Options</h4>
          {subscriptionOptions.map(option => (
            <div 
              key={option.id}
              className={`subscription-option ${selectedSubscription === option.id ? 'selected' : ''}`}
              onClick={() => handleSubscriptionSelect(option.id)}
            >
              <span className="duration">{option.subscription_durations.name}</span>
              <span className="price">${option.discounted_price}/month</span>
              {option.discount_percentage > 0 && (
                <span className="savings">Save {option.discount_percentage}%</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NEW: Dynamic Pricing Display */}
      {pricing && (
        <div className="pricing-summary">
          <div className="final-price">${pricing.final_price}</div>
          {pricing.total_savings > 0 && (
            <div className="savings">Save ${pricing.total_savings}</div>
          )}
        </div>
      )}

      <button onClick={() => onSelect(product, selectedSubscription)}>
        {product.requiresPrescription ? 'Start Consultation' : 'Add to Cart'}
      </button>
    </div>
  );
};
```

#### **B. Subscription Selection Modal**

```javascript
// New component: src/components/shop/SubscriptionSelectionModal.jsx
const SubscriptionSelectionModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const { getSubscriptionOptions, calculatePricing } = useTelehealthFlow();
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    if (product && isOpen) {
      loadSubscriptionOptions();
    }
  }, [product, isOpen]);

  const loadSubscriptionOptions = async () => {
    const subscriptionOptions = await getSubscriptionOptions(product.id);
    setOptions(subscriptionOptions);
    
    if (subscriptionOptions.length > 0) {
      // Auto-select the best value option
      const bestValue = subscriptionOptions.reduce((best, current) => 
        current.discount_percentage > best.discount_percentage ? current : best
      );
      setSelected(bestValue.id);
      handlePricingUpdate(bestValue.id);
    }
  };

  const handlePricingUpdate = async (subscriptionId) => {
    const pricingResult = await calculatePricing(
      product.id, 
      subscriptionId, 
      product.category_id
    );
    setPricing(pricingResult);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="subscription-modal">
        <h2>Choose Your Plan</h2>
        <div className="product-info">
          <h3>{product.name}</h3>
          <p>Base price: ${product.price}</p>
        </div>

        <div className="subscription-options">
          {options.map(option => (
            <div 
              key={option.id}
              className={`option ${selected === option.id ? 'selected' : ''}`}
              onClick={() => {
                setSelected(option.id);
                handlePricingUpdate(option.id);
              }}
            >
              <div className="duration">{option.subscription_durations.name}</div>
              <div className="pricing">
                <span className="price">${option.discounted_price}/month</span>
                {option.discount_percentage > 0 && (
                  <span className="discount">Save {option.discount_percentage}%</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {pricing && (
          <div className="pricing-summary">
            <div className="total">Total: ${pricing.final_price}/month</div>
            {pricing.total_savings > 0 && (
              <div className="savings">You save ${pricing.total_savings}/month</div>
            )}
          </div>
        )}

        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          <button 
            onClick={() => onConfirm(selected, pricing)}
            disabled={!selected}
          >
            Continue to Consultation
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

---

## 📝 **3. Enhanced Intake Forms with Category-Specific Rendering**

### **Current State Analysis**
Your existing `IntakeFormPage.jsx` already has:
- ✅ Multi-step form structure
- ✅ Category-based form logic (`productCategory`)
- ✅ Dynamic step rendering

### **Integration Strategy: Enhance Form Steps**

#### **A. Flow-Aware Intake Form**

```javascript
// Enhance src/pages/intake/IntakeFormPage.jsx
import { useTelehealthFlow } from '../../hooks/useTelehealthFlow';

const IntakeFormPage = () => {
  const { flowId } = useParams();
  const { 
    flow, 
    loading, 
    loadFlow, 
    submitIntakeForm,
    getProductsByCategory 
  } = useTelehealthFlow(flowId);

  // Load flow if flowId is provided
  useEffect(() => {
    if (flowId && !flow) {
      loadFlow(flowId);
    }
  }, [flowId]);

  // Enhanced form submission with flow integration
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (flow) {
        // Submit through telehealth flow orchestrator
        const result = await submitIntakeForm(formData, {
          flowId: flow.id,
          productCategory
        });

        if (result.success) {
          setOrderId(result.order?.id);
          setConsultationId(result.consultation?.id);
          handleNext();
        }
      } else {
        // Fallback to existing submission logic
        // ... existing code
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rest of existing component logic...
};
```

#### **B. Category-Specific Form Steps**

```javascript
// Enhanced BasicInfoStep with category-aware fields
const BasicInfoStep = ({ formData, updateFormData, productCategory, flow, ...props }) => {
  const [categoryFields, setCategoryFields] = useState([]);

  useEffect(() => {
    // Load category-specific form fields
    if (flow?.category_id) {
      loadCategorySpecificFields();
    }
  }, [flow?.category_id]);

  const loadCategorySpecificFields = async () => {
    // Get form modifications from the flow orchestrator
    const modifications = await CategoryProductOrchestrator.getProductFormModifications(
      flow.product_id
    );
    
    if (modifications?.additional_questions) {
      setCategoryFields(modifications.additional_questions);
    }
  };

  return (
    <div className="basic-info-step">
      {/* Existing form fields */}
      
      {/* NEW: Category-specific fields */}
      {categoryFields.map(field => (
        <DynamicFormField 
          key={field.id}
          field={field}
          value={formData[field.id]}
          onChange={(value) => updateFormData('basicInfo', { [field.id]: value })}
        />
      ))}
      
      {/* Category-specific conditional fields */}
      {productCategory === 'weight_management' && (
        <>
          <FormField label="Goal Weight" name="goalWeight" />
          <FormField label="Previous Weight Loss Attempts" name="previousAttempts" />
        </>
      )}
      
      {productCategory === 'hair_loss' && (
        <>
          <FormField label="Hair Loss Pattern" name="hairLossPattern" />
          <FormField label="Family History" name="familyHistory" />
        </>
      )}
      
      {productCategory === 'ed' && (
        <>
          <FormField label="Duration of Symptoms" name="symptomDuration" />
          <FormField label="Previous Treatments" name="previousTreatments" />
        </>
      )}
    </div>
  );
};
```

#### **C. Dynamic Form Field Component**

```javascript
// New component: src/components/forms/DynamicFormField.jsx
const DynamicFormField = ({ field, value, onChange }) => {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        );
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="radio-group">
            {field.options.map(option => (
              <label key={option}>
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  required={field.required}
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="dynamic-form-field">
      <label>
        {field.label}
        {field.required && <span className="required">*</span>}
      </label>
      {renderField()}
      {field.reason && (
        <div className="field-reason">{field.reason}</div>
      )}
    </div>
  );
};
```

---

## 📊 **4. Flow Progress Indicators and Recommendation Widgets**

### **A. Flow Progress Component**

```javascript
// New component: src/components/flow/FlowProgressIndicator.jsx
const FlowProgressIndicator = ({ flow }) => {
  const { completionPercentage, nextSteps } = useTelehealthFlow();

  if (!flow) return null;

  const getStatusColor = (status) => {
    const colors = {
      'category_selected': '#3B82F6',
      'product_selected': '#10B981',
      'subscription_configured': '#8B5CF6',
      'intake_completed': '#F59E0B',
      'consultation_approved': '#EF4444',
      'completed': '#059669'
    };
    return colors[status] || '#6B7280';
  };

  return (
    <div className="flow-progress-indicator">
      <div className="progress-header">
        <h3>Your Journey Progress</h3>
        <span className="percentage">{completionPercentage}% Complete</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${completionPercentage}%`,
            backgroundColor: getStatusColor(flow.current_status)
          }}
        />
      </div>
      
      <div className="current-status">
        <div className="status-badge" style={{ backgroundColor: getStatusColor(flow.current_status) }}>
          {flow.current_status.replace('_', ' ').toUpperCase()}
        </div>
        <div className="status-description">
          {getStatusDescription(flow.current_status)}
        </div>
      </div>
      
      <div className="next-steps">
        <h4>Next Steps:</h4>
        <ul>
          {nextSteps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const getStatusDescription = (status) => {
  const descriptions = {
    'category_selected': 'You\'ve selected a category. Choose a product to continue.',
    'product_selected': 'Product selected. Configure your subscription options.',
    'subscription_configured': 'Ready for intake form. Complete your medical history.',
    'intake_completed': 'Form submitted. Awaiting provider review.',
    'consultation_approved': 'Approved! Processing your order.',
    'completed': 'Journey complete! Your order is being fulfilled.'
  };
  return descriptions[status] || 'Processing...';
};
```

### **B. Recommendation Widget**

```javascript
// New component: src/components/flow/RecommendationWidget.jsx
const RecommendationWidget = ({ categoryId, onProductSelect }) => {
  const { getProductRecommendations } = useTelehealthFlow();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryId) {
      loadRecommendations();
    }
  }, [categoryId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await getProductRecommendations(categoryId);
      setRecommendations(recs.slice(0, 3)); // Show top 3
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading recommendations...</div>;
  if (recommendations.length === 0) return null;

  return (
    <div className="recommendation-widget">
      <div className="widget-header">
        <h3>🎯 Recommended for You</h3>
        <span className="ai-badge">AI Powered</span>
      </div>
      
      <div className="recommendations">
        {recommendations.map(rec => (
          <div key={rec.product.id} className="recommendation-card">
            <div className="product-info">
              <h4>{rec.product.name}</h4>
              <p className="reason">{rec.recommendation_reason}</p>
              <div className="confidence">
                Confidence: {Math.round(rec.recommendation_score)}%
              </div>
            </div>
            
            <div className="pricing">
              {rec.best_pricing && (
                <>
                  <span className="price">${rec.best_pricing.price}</span>
                  {rec.best_pricing.savings > 0 && (
                    <span className="savings">Save ${rec.best_pricing.savings}</span>
                  )}
                </>
              )}
            </div>
            
            <button 
              className="select-btn"
              onClick={() => onProductSelect(rec.product)}
            >
              Select This Product
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔧 **Integration Implementation Steps**

### **Step 1: Enhance ShopPage (Week 1)**
1. Add `useTelehealthFlow` hook to existing ShopPage
2. Enhance `openCategory` and `handleAddToCart` functions
3. Test category selection → flow initialization

### **Step 2: Subscription Components (Week 1-2)**
1. Create `SubscriptionSelectionModal` component
2. Enhance existing `ProductCard` with subscription options
3. Test subscription selection → pricing calculation

### **Step 3: Enhanced Intake Forms (Week 2)**
1. Add flow awareness to `IntakeFormPage`
2. Create `DynamicFormField` component
3. Enhance form steps with category-specific fields
4. Test form submission → flow progression

### **Step 4: Progress & Recommendations (Week 2-3)**
1. Create `FlowProgressIndicator` component
2. Create `RecommendationWidget` component
3. Integrate widgets into existing pages
4. Test end-to-end flow tracking

---

## 🎯 **Key Benefits of This Integration Approach**

1. **Non-Breaking**: Enhances existing components without replacing them
2. **Progressive**: Can be implemented incrementally
3. **Backward Compatible**: Existing functionality continues to work
4. **Flow-Aware**: New features automatically integrate with telehealth flow
5. **AI-Powered**: Leverages the new recommendation engine
6. **Real-Time**: Dynamic pricing and progress tracking

---

## 📋 **Next Actions**

1. **Apply database migration**: `./apply-category-product-subscription-integration-migration.sh`
2. **Start with ShopPage enhancement** (lowest risk, highest impact)
3. **Test flow initialization** with existing categories
4. **Gradually add subscription components**
5. **Enhance intake forms** with category-specific fields
6. **Add progress indicators** for user experience

This integration strategy leverages your existing site structure while adding the powerful new telehealth flow capabilities seamlessly.
