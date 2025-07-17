
import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useAIPrompts,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
} from '../../apis/ai/hooks';
import { toast } from 'react-toastify';
import { Loader2, Plus, Filter, Search } from 'lucide-react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';

const AIPromptSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('prompts');

  const {
    data: promptsData,
    isLoading: isLoadingPrompts,
    error: promptsError,
    refetch: refetchPrompts,
  } = useAIPrompts();
  const createPromptMutation = useCreatePrompt();
  const updatePromptMutation = useUpdatePrompt();
  const deletePromptMutation = useDeletePrompt();

  const [editingPromptId, setEditingPromptId] = useState(null);
  const [formPromptName, setFormPromptName] = useState('');
  const [formPromptContent, setFormPromptContent] = useState('');
  const [formPromptCategory, setFormPromptCategory] = useState('general');
  const [formPromptType, setFormPromptType] = useState('initial');
  const [formPromptSection, setFormPromptSection] = useState('summary');

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'general', name: 'General Health' },
    { id: 'weight_management', name: 'Weight Management' },
    { id: 'ed', name: 'ED' },
    { id: 'hair_loss', name: 'Hair Loss' },
  ];

  const promptTypes = [
    { id: 'initial', name: 'Initial Consultation' },
    { id: 'followup', name: 'Follow-up Consultation' },
  ];

  const promptSections = [
    { id: 'summary', name: 'Summary' },
    { id: 'assessment', name: 'Assessment' },
    { id: 'plan', name: 'Plan' },
    { id: 'patient_message', name: 'Patient Message' },
  ];

  const getFilteredPrompts = useMemo(() => {
    if (!promptsData) return [];
    return promptsData.filter((prompt) => {
      const categoryMatch = filterCategory === 'all' || prompt.category === filterCategory;
      const typeMatch = filterType === 'all' || prompt.prompt_type === filterType;
      const sectionMatch = filterSection === 'all' || prompt.section === filterSection;
      const searchLower = debouncedSearchTerm.toLowerCase();
      const searchMatch = debouncedSearchTerm
        ? (prompt.name || '').toLowerCase().includes(searchLower) ||
          (prompt.prompt || '').toLowerCase().includes(searchLower)
        : true;
      return categoryMatch && typeMatch && sectionMatch && searchMatch;
    });
  }, [promptsData, filterCategory, filterType, filterSection, debouncedSearchTerm]);

  useEffect(() => {
    if (editingPromptId && promptsData) {
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

  const handleSubmitPrompt = async (e) => {
    e.preventDefault();
    if (!formPromptName || !formPromptContent) {
      toast.error('Please fill in all required fields');
      return;
    }

    const mutation = editingPromptId ? updatePromptMutation : createPromptMutation;
    const promptData = {
      id: editingPromptId,
      name: formPromptName,
      prompt: formPromptContent,
      category: formPromptCategory,
      prompt_type: formPromptType,
      section: formPromptSection,
    };

    await mutation.mutateAsync(promptData);
    setEditingPromptId(null);
  };

  const handleDeletePrompt = async (id) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      await deletePromptMutation.mutateAsync(id);
    }
  };
  
  const resetFilters = () => {
    setFilterCategory('all');
    setFilterType('all');
    setFilterSection('all');
    setSearchTerm('');
  };

  const getCategoryName = (categoryId) => categories.find((c) => c.id === categoryId)?.name || categoryId;
  const getTypeName = (typeId) => promptTypes.find((t) => t.id === typeId)?.name || typeId;
  const getSectionName = (sectionId) => promptSections.find((s) => s.id === sectionId)?.name || sectionId;

  return (
    <AdminLayout title="AI Prompt Settings">
        {/* Prompts List */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Existing Prompts</h3>
            {isLoadingPrompts ? (
                <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : promptsError ? (
                <div className="text-red-500 py-4">
                Error loading prompts: {promptsError.message}
                </div>
            ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredPrompts.map((prompt) => (
                        <tr key={prompt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{prompt.name || 'Unnamed Prompt'}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                            {prompt.prompt && prompt.prompt.length > 100
                                ? `${prompt.prompt.substring(0, 100)}...`
                                : prompt.prompt || 'No content'}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{getCategoryName(prompt.category || 'general')}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prompt.prompt_type === 'initial' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>{getTypeName(prompt.prompt_type || 'initial')}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{getSectionName(prompt.section || 'summary')}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => setEditingPromptId(prompt.id)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                            <button onClick={() => handleDeletePrompt(prompt.id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            )}
        </div>

        {/* Add/Edit Form */}
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">{editingPromptId ? 'Edit Prompt' : 'Add New Prompt'}</h3>
            <form onSubmit={handleSubmitPrompt}>
                {/* Form fields... */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="col-span-3">
                <label htmlFor="promptName" className="block text-gray-700 font-semibold mb-2">Prompt Name <span className="text-red-500">*</span></label>
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
                <label htmlFor="promptCategory" className="block text-gray-700 font-semibold mb-2">Category <span className="text-red-500">*</span></label>
                <select id="promptCategory" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100" value={formPromptCategory} onChange={(e) => setFormPromptCategory(e.target.value)}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="promptType" className="block text-gray-700 font-semibold mb-2">Consultation Type <span className="text-red-500">*</span></label>
                <select id="promptType" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100" value={formPromptType} onChange={(e) => setFormPromptType(e.target.value)}>
                  {promptTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="promptSection" className="block text-gray-700 font-semibold mb-2">Section <span className="text-red-500">*</span></label>
                <select id="promptSection" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100" value={formPromptSection} onChange={(e) => setFormPromptSection(e.target.value)}>
                  {promptSections.map((section) => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="promptContent" className="block text-gray-700 font-semibold mb-2">Prompt Content <span className="text-red-500">*</span></label>
              <textarea
                id="promptContent"
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-100"
                value={formPromptContent}
                onChange={(e) => setFormPromptContent(e.target.value)}
                placeholder="Enter the prompt content here..."
              ></textarea>
              <p className="text-sm text-gray-500 mt-1">Use variables like {'{patient_name}'}, {'{medical_history}'} etc.</p>
            </div>
                <div className="flex space-x-4">
                    <button type="submit" disabled={createPromptMutation.isLoading || updatePromptMutation.isLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-100 disabled:opacity-50 flex items-center">
                    {(createPromptMutation.isLoading || updatePromptMutation.isLoading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingPromptId ? 'Save Changes' : 'Add Prompt'}
                    </button>
                    {editingPromptId && <button type="button" onClick={() => setEditingPromptId(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">Cancel</button>}
                </div>
            </form>
        </div>
    </AdminLayout>
  );
};

export default AIPromptSettingsPage;

    