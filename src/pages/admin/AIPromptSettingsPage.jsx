import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useAIPrompts,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
} from '../../apis/ai/hooks';
import {
  useRecommendationRules,
  useCreateRecommendationRule,
  useUpdateRecommendationRule,
  useDeleteRecommendationRule,
} from '../../apis/productRecommendations/hooks';
import { toast } from 'react-toastify';
import { Loader2, Plus, Filter, Search, Sparkles } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';

const AIPromptSettingsPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('prompts'); // 'prompts' or 'recommendations'

  // State for prompts
  const {
    data: promptsData,
    isLoading: isLoadingPrompts,
    error: promptsError,
    refetch: refetchPrompts,
  } = useAIPrompts();
  const createPromptMutation = useCreatePrompt();
  const updatePromptMutation = useUpdatePrompt();
  const deletePromptMutation = useDeletePrompt();

  // State for recommendation rules
  const {
    data: rulesData = [],
    isLoading: isLoadingRules,
    error: rulesError,
    refetch: refetchRules,
  } = useRecommendationRules();
  const createRuleMutation = useCreateRecommendationRule();
  const updateRuleMutation = useUpdateRecommendationRule();
  const deleteRuleMutation = useDeleteRecommendationRule();

  // Form state for prompts
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [formPromptName, setFormPromptName] = useState('');
  const [formPromptContent, setFormPromptContent] = useState('');
  const [formPromptCategory, setFormPromptCategory] = useState('general');
  const [formPromptType, setFormPromptType] = useState('initial');
  const [formPromptSection, setFormPromptSection] = useState('summary');

  // Form state for recommendation rules
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [formRuleName, setFormRuleName] = useState('');
  const [formRuleDescription, setFormRuleDescription] = useState('');
  const [formRuleConditionType, setFormRuleConditionType] = useState('bmi');
  const [formRuleConditionValue, setFormRuleConditionValue] = useState({});
  const [formRulePriority, setFormRulePriority] = useState(10);
  const [formRuleProductTitle, setFormRuleProductTitle] = useState('');
  const [formRuleProductDescription, setFormRuleProductDescription] =
    useState('');
  const [formRuleReasonText, setFormRuleReasonText] = useState('');

  // Filter state for prompts
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state for recommendation rules
  const [filterRuleConditionType, setFilterRuleConditionType] = useState('all');
  const [searchRuleTerm, setSearchRuleTerm] = useState('');
  const [showRuleFilters, setShowRuleFilters] = useState(false);

  // Categories
  const categories = [
    { id: 'general', name: 'General Health' },
    { id: 'weight_management', name: 'Weight Management' },
    { id: 'ed', name: 'ED' },
    { id: 'hair_loss', name: 'Hair Loss' },
  ];

  // Prompt types
  const promptTypes = [
    { id: 'initial', name: 'Initial Consultation' },
    { id: 'followup', name: 'Follow-up Consultation' },
  ];

  // Prompt sections
  const promptSections = [
    { id: 'summary', name: 'Summary' },
    { id: 'assessment', name: 'Assessment' },
    { id: 'plan', name: 'Plan' },
    { id: 'patient_message', name: 'Patient Message' },
  ];

  // Get filtered prompts
  const getFilteredPrompts = () => {
    if (!promptsData) {
      return [];
    }

    return promptsData.filter((prompt) => {
      // Apply category filter
      if (filterCategory !== 'all' && prompt.category !== filterCategory) {
        return false;
      }

      // Apply type filter
      if (filterType !== 'all' && prompt.prompt_type !== filterType) {
        return false;
      }

      // Apply section filter
      if (filterSection !== 'all' && prompt.section !== filterSection) {
        return false;
      }

      // Apply search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (prompt.name || '').toLowerCase().includes(searchLower) ||
          (prompt.prompt || '').toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  // Effect to populate form when editing a prompt
  useEffect(() => {
    if (editingPromptId !== null && promptsData) {
      const promptToEdit = promptsData.find((p) => p.id === editingPromptId);
      if (promptToEdit) {
        setFormPromptName(promptToEdit.name);
        setFormPromptContent(promptToEdit.prompt);
        setFormPromptCategory(promptToEdit.category || 'general');
        setFormPromptType(promptToEdit.prompt_type || 'initial');
        setFormPromptSection(promptToEdit.section || 'summary');
      }
    } else {
      setFormPromptName('');
      setFormPromptContent('');
      setFormPromptCategory('general');
      setFormPromptType('initial');
      setFormPromptSection('summary');
    }
  }, [editingPromptId, promptsData]);

  // Handle adding a new prompt
  const handleAddPrompt = async () => {
    if (!formPromptName || !formPromptContent) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createPromptMutation.mutateAsync({
        name: formPromptName,
        prompt: formPromptContent,
        category: formPromptCategory,
        prompt_type: formPromptType,
        section: formPromptSection,
      });

      toast.success('Prompt added successfully');
      setFormPromptName('');
      setFormPromptContent('');
      setFormPromptCategory('general');
      setFormPromptType('initial');
      setFormPromptSection('summary');
    } catch (error) {
      console.error('Error adding prompt:', error);
      toast.error('Failed to add prompt');
    }
  };

  // Handle editing a prompt
  const handleEditClick = (prompt) => {
    setEditingPromptId(prompt.id);
  };

  // Handle updating a prompt
  const handleUpdatePrompt = async () => {
    if (!formPromptName || !formPromptContent || editingPromptId === null) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await updatePromptMutation.mutateAsync({
        id: editingPromptId,
        name: formPromptName,
        prompt: formPromptContent,
        category: formPromptCategory,
        prompt_type: formPromptType,
        section: formPromptSection,
      });

      toast.success('Prompt updated successfully');
      setEditingPromptId(null);
      setFormPromptName('');
      setFormPromptContent('');
      setFormPromptCategory('general');
      setFormPromptType('initial');
      setFormPromptSection('summary');
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast.error('Failed to update prompt');
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingPromptId(null);
    setFormPromptName('');
    setFormPromptContent('');
    setFormPromptCategory('general');
    setFormPromptType('initial');
    setFormPromptSection('summary');
  };

  // Handle deleting a prompt
  const handleDeletePrompt = async (id) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await deletePromptMutation.mutateAsync(id);
        toast.success('Prompt deleted successfully');
      } catch (error) {
        console.error('Error deleting prompt:', error);
        toast.error('Failed to delete prompt');
      }
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilterCategory('all');
    setFilterType('all');
    setFilterSection('all');
    setSearchTerm('');
  };

  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Get type name
  const getTypeName = (typeId) => {
    const type = promptTypes.find((t) => t.id === typeId);
    return type ? type.name : typeId;
  };

  // Get section name
  const getSectionName = (sectionId) => {
    const section = promptSections.find((s) => s.id === sectionId);
    return section ? section.name : sectionId;
  };

  // Get filtered prompts (memoized to prevent unnecessary re-renders)
  const filteredPrompts = useMemo(() => {
    return getFilteredPrompts();
  }, [promptsData, filterCategory, filterType, filterSection, searchTerm]);

  // Condition type options for recommendation rules
  const conditionTypes = [
    { id: 'bmi', name: 'BMI' },
    { id: 'goal', name: 'Goal' },
    { id: 'condition', name: 'Medical Condition' },
    { id: 'age', name: 'Age' },
    { id: 'combination', name: 'Combination' },
  ];

  // Get filtered recommendation rules
  const getFilteredRules = () => {
    if (!rulesData) return [];

    return rulesData.filter((rule) => {
      // Apply condition type filter
      if (
        filterRuleConditionType !== 'all' &&
        rule.condition_type !== filterRuleConditionType
      ) {
        return false;
      }

      // Apply search term
      if (searchRuleTerm) {
        const searchLower = searchRuleTerm.toLowerCase();
        return (
          rule.name.toLowerCase().includes(searchLower) ||
          rule.description?.toLowerCase().includes(searchLower) ||
          rule.product_title.toLowerCase().includes(searchLower) ||
          rule.product_description.toLowerCase().includes(searchLower) ||
          rule.reason_text.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  // Effect to populate form when editing a rule
  useEffect(() => {
    if (editingRuleId !== null && rulesData) {
      const ruleToEdit = rulesData.find((r) => r.id === editingRuleId);
      if (ruleToEdit) {
        setFormRuleName(ruleToEdit.name);
        setFormRuleDescription(ruleToEdit.description || '');
        setFormRuleConditionType(ruleToEdit.condition_type);
        setFormRuleConditionValue(ruleToEdit.condition_value);
        setFormRulePriority(ruleToEdit.priority);
        setFormRuleProductTitle(ruleToEdit.product_title);
        setFormRuleProductDescription(ruleToEdit.product_description);
        setFormRuleReasonText(ruleToEdit.reason_text);
      }
    } else {
      setFormRuleName('');
      setFormRuleDescription('');
      setFormRuleConditionType('bmi');
      setFormRuleConditionValue({});
      setFormRulePriority(10);
      setFormRuleProductTitle('');
      setFormRuleProductDescription('');
      setFormRuleReasonText('');
    }
  }, [editingRuleId, rulesData]);

  // Handle adding a new rule
  const handleAddRule = async () => {
    if (
      !formRuleName ||
      !formRuleProductTitle ||
      !formRuleProductDescription ||
      !formRuleReasonText
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createRuleMutation.mutateAsync({
        name: formRuleName,
        description: formRuleDescription,
        condition_type: formRuleConditionType,
        condition_value: formRuleConditionValue,
        priority: formRulePriority,
        product_title: formRuleProductTitle,
        product_description: formRuleProductDescription,
        reason_text: formRuleReasonText,
      });

      toast.success('Recommendation rule added successfully');
      setFormRuleName('');
      setFormRuleDescription('');
      setFormRuleConditionType('bmi');
      setFormRuleConditionValue({});
      setFormRulePriority(10);
      setFormRuleProductTitle('');
      setFormRuleProductDescription('');
      setFormRuleReasonText('');
    } catch (error) {
      console.error('Error adding recommendation rule:', error);
      toast.error('Failed to add recommendation rule');
    }
  };

  // Handle editing a rule
  const handleEditRuleClick = (rule) => {
    setEditingRuleId(rule.id);
  };

  // Handle updating a rule
  const handleUpdateRule = async () => {
    if (
      !formRuleName ||
      !formRuleProductTitle ||
      !formRuleProductDescription ||
      !formRuleReasonText ||
      editingRuleId === null
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await updateRuleMutation.mutateAsync({
        id: editingRuleId,
        name: formRuleName,
        description: formRuleDescription,
        condition_type: formRuleConditionType,
        condition_value: formRuleConditionValue,
        priority: formRulePriority,
        product_title: formRuleProductTitle,
        product_description: formRuleProductDescription,
        reason_text: formRuleReasonText,
      });

      toast.success('Recommendation rule updated successfully');
      setEditingRuleId(null);
      setFormRuleName('');
      setFormRuleDescription('');
      setFormRuleConditionType('bmi');
      setFormRuleConditionValue({});
      setFormRulePriority(10);
      setFormRuleProductTitle('');
      setFormRuleProductDescription('');
      setFormRuleReasonText('');
    } catch (error) {
      console.error('Error updating recommendation rule:', error);
      toast.error('Failed to update recommendation rule');
    }
  };

  // Handle canceling edit for rule
  const handleCancelRuleEdit = () => {
    setEditingRuleId(null);
    setFormRuleName('');
    setFormRuleDescription('');
    setFormRuleConditionType('bmi');
    setFormRuleConditionValue({});
    setFormRulePriority(10);
    setFormRuleProductTitle('');
    setFormRuleProductDescription('');
    setFormRuleReasonText('');
  };

  // Handle deleting a rule
  const handleDeleteRule = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to delete this recommendation rule?'
      )
    ) {
      try {
        await deleteRuleMutation.mutateAsync(id);
        toast.success('Recommendation rule deleted successfully');
      } catch (error) {
        console.error('Error deleting recommendation rule:', error);
        toast.error('Failed to delete recommendation rule');
      }
    }
  };

  // Reset rule filters
  const resetRuleFilters = () => {
    setFilterRuleConditionType('all');
    setSearchRuleTerm('');
  };

  // Get condition type name
  const getConditionTypeName = (conditionTypeId) => {
    const conditionType = conditionTypes.find((c) => c.id === conditionTypeId);
    return conditionType ? conditionType.name : conditionTypeId;
  };

  // Get filtered rules (memoized to prevent unnecessary re-renders)
  const filteredRules = useMemo(() => {
    return getFilteredRules();
  }, [rulesData, filterRuleConditionType, searchRuleTerm]);

  return (
    <AdminLayout
      title="AI & Recommendation Settings"
      actions={
        <div className="flex space-x-2">
          {activeTab === 'prompts' ? (
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </button>
              <button
                onClick={refetchPrompts}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              >
                Refresh
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowRuleFilters(!showRuleFilters)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </button>
              <button
                onClick={refetchRules}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              >
                Refresh
              </button>
            </>
          )}
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'prompts'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('prompts')}
        >
          AI Prompts
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'recommendations'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('recommendations')}
        >
          <div className="flex items-center">
            <Sparkles className="h-4 w-4 mr-1" />
            Product Recommendations
          </div>
        </button>
      </div>

      {/* Show content based on active tab */}
      {activeTab === 'prompts' ? (
        <>
          {/* Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                      placeholder="Search prompts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    {promptTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                  >
                    <option value="all">All Sections</option>
                    {promptSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Prompts List */}
          <div className="bg-blue-600 shadow rounded-lg p-6 mb-6 hover:bg-blue-700 hover:border-blue-700">
            <h3 className="text-xl font-semibold mb-4">Existing Prompts</h3>

            {isLoadingPrompts ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : promptsError ? (
              <div className="text-red-500 py-4">
                Error loading prompts: {promptsError.message}
              </div>
            ) : filteredPrompts.length === 0 ? (
              <p className="text-gray-500 py-4">
                {promptsData && promptsData.length > 0
                  ? 'No prompts match the current filters.'
                  : 'No prompts defined yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredPrompts || []).map((prompt) => (
                      <tr key={prompt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {prompt.name || 'Unnamed Prompt'}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {prompt.prompt && prompt.prompt.length > 100
                              ? `${prompt.prompt.substring(0, 100)}...`
                              : prompt.prompt || 'No content'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getCategoryName(prompt.category || 'general')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              prompt.prompt_type === 'initial'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {getTypeName(prompt.prompt_type || 'initial')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {getSectionName(prompt.section || 'summary')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(prompt)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(prompt.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add/Edit Prompt Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingPromptId !== null ? 'Edit Prompt' : 'Add New Prompt'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="col-span-3">
                <label
                  htmlFor="promptName"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Prompt Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="promptName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formPromptName}
                  onChange={(e) => setFormPromptName(e.target.value)}
                  placeholder="e.g., Weight Management Initial Summary"
                />
              </div>

              <div>
                <label
                  htmlFor="promptCategory"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="promptCategory"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formPromptCategory}
                  onChange={(e) => setFormPromptCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="promptType"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Consultation Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="promptType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formPromptType}
                  onChange={(e) => setFormPromptType(e.target.value)}
                >
                  {promptTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="promptSection"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  id="promptSection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formPromptSection}
                  onChange={(e) => setFormPromptSection(e.target.value)}
                >
                  {promptSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="promptContent"
                className="block text-gray-700 font-semibold mb-2"
              >
                Prompt Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="promptContent"
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                value={formPromptContent}
                onChange={(e) => setFormPromptContent(e.target.value)}
                placeholder="Enter the prompt content here..."
              ></textarea>
              <p className="text-sm text-gray-500 mt-1">
                Use variables like {'{patient_name}'}, {'{medical_history}'},{' '}
                {'{current_medications}'}, etc. to reference patient data.
              </p>
            </div>

            {editingPromptId !== null ? (
              <div className="flex space-x-4">
                <button
                  onClick={handleUpdatePrompt}
                  disabled={
                    createPromptMutation.isLoading ||
                    updatePromptMutation.isLoading
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-100 disabled:opacity-50 flex items-center"
                >
                  {updatePromptMutation.isLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring focus:ring-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddPrompt}
                disabled={createPromptMutation.isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-100 disabled:opacity-50 flex items-center"
              >
                {createPromptMutation.isLoading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Plus className="h-4 w-4 mr-2" />
                Add Prompt
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Recommendation Rules Filters */}
          {showRuleFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                      placeholder="Search rules..."
                      value={searchRuleTerm}
                      onChange={(e) => setSearchRuleTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                    value={filterRuleConditionType}
                    onChange={(e) => setFilterRuleConditionType(e.target.value)}
                  >
                    <option value="all">All Condition Types</option>
                    {conditionTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={resetRuleFilters}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation Rules List */}
          <div className="bg-blue-600 shadow rounded-lg p-6 mb-6 hover:bg-blue-700 hover:border-blue-700">
            <h3 className="text-xl font-semibold mb-4">
              Existing Recommendation Rules
            </h3>

            {isLoadingRules ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : rulesError ? (
              <div className="text-red-500 py-4">
                Error loading recommendation rules:{' '}
                {rulesError.message ||
                  'The recommendation rules feature is not available.'}
              </div>
            ) : filteredRules.length === 0 ? (
              <p className="text-gray-500 py-4">
                {rulesData && rulesData.length > 0
                  ? 'No recommendation rules match the current filters.'
                  : 'No recommendation rules defined yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Condition Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredRules || []).map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {rule.name || 'Unnamed Rule'}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {rule.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getConditionTypeName(rule.condition_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rule.priority || 10}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {rule.product_title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {rule.product_description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditRuleClick(rule)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add/Edit Recommendation Rule Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingRuleId !== null
                ? 'Edit Recommendation Rule'
                : 'Add New Recommendation Rule'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="ruleName"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Rule Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="ruleName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formRuleName}
                  onChange={(e) => setFormRuleName(e.target.value)}
                  placeholder="e.g., Weight Loss BMI Rule"
                />
              </div>

              <div>
                <label
                  htmlFor="ruleConditionType"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Condition Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="ruleConditionType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formRuleConditionType}
                  onChange={(e) => setFormRuleConditionType(e.target.value)}
                >
                  {conditionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="ruleDescription"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Description
                </label>
                <textarea
                  id="ruleDescription"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formRuleDescription}
                  onChange={(e) => setFormRuleDescription(e.target.value)}
                  placeholder="Brief description of when this rule applies..."
                />
              </div>

              <div>
                <label
                  htmlFor="rulePriority"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Priority (1-100)
                </label>
                <input
                  type="number"
                  id="rulePriority"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formRulePriority}
                  onChange={(e) =>
                    setFormRulePriority(parseInt(e.target.value) || 10)
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="ruleProductTitle"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="ruleProductTitle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formRuleProductTitle}
                  onChange={(e) => setFormRuleProductTitle(e.target.value)}
                  placeholder="e.g., Semaglutide Weight Loss Program"
                />
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="ruleProductDescription"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Product Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="ruleProductDescription"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formRuleProductDescription}
                  onChange={(e) =>
                    setFormRuleProductDescription(e.target.value)
                  }
                  placeholder="Detailed description of the recommended product..."
                />
              </div>

              <div className="col-span-2">
                <label
                  htmlFor="ruleReasonText"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Reason Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="ruleReasonText"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                  value={formRuleReasonText}
                  onChange={(e) => setFormRuleReasonText(e.target.value)}
                  placeholder="Explanation for why this product is recommended..."
                />
              </div>
            </div>

            {editingRuleId !== null ? (
              <div className="flex space-x-4">
                <button
                  onClick={handleUpdateRule}
                  disabled={
                    createRuleMutation.isLoading || updateRuleMutation.isLoading
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-100 disabled:opacity-50 flex items-center"
                >
                  {updateRuleMutation.isLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={handleCancelRuleEdit}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring focus:ring-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddRule}
                disabled={createRuleMutation.isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-100 disabled:opacity-50 flex items-center"
              >
                {createRuleMutation.isLoading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Plus className="h-4 w-4 mr-2" />
                Add Recommendation Rule
              </button>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AIPromptSettingsPage;
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  fetchPrompts,
  fetchPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  testPrompt,
  fetchAISettings,
  updateAISettings,
  fetchAILogs,
  fetchAIMetrics,
} from './api';

// Query keys
const queryKeys = {
  prompts: {
    all: ['ai', 'prompts'],
    detail: (id) => [...queryKeys.prompts.all, id],
    byCategory: (category) => [...queryKeys.prompts.all, 'category', category],
    byType: (type) => [...queryKeys.prompts.all, 'type', type],
    bySection: (section) => [...queryKeys.prompts.all, 'section', section],
    byCategoryAndType: (category, type) => [
      ...queryKeys.prompts.all,
      'category',
      category,
      'type',
      type,
    ],
    byCategoryAndSection: (category, section) => [
      ...queryKeys.prompts.all,
      'category',
      category,
      'section',
      section,
    ],
    byTypeAndSection: (type, section) => [
      ...queryKeys.prompts.all,
      'type',
      type,
      'section',
      section,
    ],
    byCategoryTypeAndSection: (category, type, section) => [
      ...queryKeys.prompts.all,
      'category',
      category,
      'type',
      type,
      'section',
      section,
    ],
  },
  settings: () => ['ai', 'settings'],
  logs: (options) => ['ai', 'logs', options],
  metrics: () => ['ai', 'metrics'],
};

// Prompts hooks
export const useAIPrompts = () => {
  return useQuery({
    queryKey: queryKeys.prompts.all,
    queryFn: fetchPrompts,
    initialData: [], // Add default empty array to prevent undefined data
  });
};

export const useAIPrompt = (promptId) => {
  return useQuery({
    queryKey: queryKeys.prompts.detail(promptId),
    queryFn: () => fetchPrompt(promptId),
    enabled: !!promptId,
  });
};

export const useAIPromptsByCategory = (category) => {
  return useQuery({
    queryKey: queryKeys.prompts.byCategory(category),
    queryFn: async () => {
      try {
        const prompts = await fetchPrompts();
        const filtered = prompts.filter(
          (prompt) => prompt.category === category
        );

        // If no prompts found for category, provide helpful fallback
        if (filtered.length === 0) {
          console.warn(`No prompts found for category: ${category}`);
          // Return a basic prompt for the category if available
          const { fallbackProvider } = await import(
            '../../utils/errorHandling'
          );
          return fallbackProvider.getFallback(`ai_prompts_${category}`, []);
        }

        return filtered;
      } catch (error) {
        console.error('Error fetching prompts by category:', error);
        const { fallbackProvider } = await import('../../utils/errorHandling');
        return fallbackProvider.getFallback(`ai_prompts_${category}`, []);
      }
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      return failureCount < 2 && error.message?.includes('network');
    },
  });
};

export const useAIPromptsByType = (type) => {
  return useQuery({
    queryKey: queryKeys.prompts.byType(type),
    queryFn: async () => {
      try {
        const prompts = await fetchPrompts();
        const filtered = prompts.filter(
          (prompt) => prompt.prompt_type === type
        );

        if (filtered.length === 0) {
          console.warn(`No prompts found for type: ${type}`);
          const { fallbackProvider } = await import(
            '../../utils/errorHandling'
          );
          return fallbackProvider.getFallback(`ai_prompts_${type}`, []);
        }

        return filtered;
      } catch (error) {
        console.error('Error fetching prompts by type:', error);
        const { fallbackProvider } = await import('../../utils/errorHandling');
        return fallbackProvider.getFallback(`ai_prompts_${type}`, []);
      }
    },
    enabled: !!type,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      return failureCount < 2 && error.message?.includes('network');
    },
  });
};

export const useAIPromptsBySection = (section) => {
  return useQuery({
    queryKey: queryKeys.prompts.bySection(section),
    queryFn: async () => {
      try {
        const prompts = await fetchPrompts();
        const filtered = prompts.filter((prompt) => prompt.section === section);

        if (filtered.length === 0) {
          console.warn(`No prompts found for section: ${section}`);
        }

        return filtered;
      } catch (error) {
        console.error('Error fetching prompts by section:', error);
        return []; // Return empty array as fallback for sections
      }
    },
    enabled: !!section,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      return failureCount < 2 && error.message?.includes('network');
    },
  });
};

export const useAIPromptsByCategoryAndType = (category, type) => {
  return useQuery({
    queryKey: queryKeys.prompts.byCategoryAndType(category, type),
    queryFn: async () => {
      const prompts = await fetchPrompts();
      return prompts.filter(
        (prompt) => prompt.category === category && prompt.prompt_type === type
      );
    },
    enabled: !!(category && type),
  });
};

export const useAIPromptsByCategoryAndSection = (category, section) => {
  return useQuery({
    queryKey: queryKeys.prompts.byCategoryAndSection(category, section),
    queryFn: async () => {
      const prompts = await fetchPrompts();
      return prompts.filter(
        (prompt) => prompt.category === category && prompt.section === section
      );
    },
    enabled: !!(category && section),
  });
};

export const useAIPromptsByTypeAndSection = (type, section) => {
  return useQuery({
    queryKey: queryKeys.prompts.byTypeAndSection(type, section),
    queryFn: async () => {
      const prompts = await fetchPrompts();
      return prompts.filter(
        (prompt) => prompt.prompt_type === type && prompt.section === section
      );
    },
    enabled: !!(type && section),
  });
};

export const useAIPromptsByCategoryTypeAndSection = (
  category,
  type,
  section
) => {
  return useQuery({
    queryKey: queryKeys.prompts.byCategoryTypeAndSection(
      category,
      type,
      section
    ),
    queryFn: async () => {
      const prompts = await fetchPrompts();
      return prompts.filter(
        (prompt) =>
          prompt.category === category &&
          prompt.prompt_type === type &&
          prompt.section === section
      );
    },
    enabled: !!(category && type && section),
  });
};

export const useCreatePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      toast.success('Prompt created successfully');
    },
    onError: (error) => {
      console.error('Error creating prompt:', error);
      toast.error(`Failed to create prompt: ${error.message}`);
    },
  });
};

export const useUpdatePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrompt,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.detail(data.id),
      });
      toast.success('Prompt updated successfully');
    },
    onError: (error) => {
      console.error('Error updating prompt:', error);
      toast.error(`Failed to update prompt: ${error.message}`);
    },
  });
};

export const useDeletePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrompt,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts.all });
      queryClient.removeQueries({
        queryKey: queryKeys.prompts.detail(variables),
      });
      toast.success('Prompt deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting prompt:', error);
      toast.error(`Failed to delete prompt: ${error.message}`);
    },
  });
};

export const useTestPrompt = () => {
  return useMutation({
    mutationFn: testPrompt,
    onSuccess: () => {
      toast.success('Prompt tested successfully');
    },
    onError: (error) => {
      console.error('Error testing prompt:', error);
      toast.error(`Failed to test prompt: ${error.message}`);
    },
  });
};

// Settings hooks
export const useAISettings = () => {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: fetchAISettings,
  });
};

export const useUpdateAISettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAISettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
      toast.success('AI settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating AI settings:', error);
      toast.error(`Failed to update AI settings: ${error.message}`);
    },
  });
};

// Logs hooks
export const useAILogs = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.logs(options),
    queryFn: () => fetchAILogs(options),
  });
};

// Metrics hooks
export const useAIMetrics = () => {
  return useQuery({
    queryKey: queryKeys.metrics(),
    queryFn: fetchAIMetrics,
  });
};
```