import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ErrorHandler } from '../../utils/errorHandling';

const errorHandler = new ErrorHandler('AI API');

// Fetch all AI prompts with enhanced error handling
export const fetchPrompts = async () => {
  try {
    const promptsCollection = collection(db, 'ai_prompts');
    const q = query(promptsCollection, orderBy('created_at', 'desc'));
    const promptsSnapshot = await getDocs(q);
    const prompts = promptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log('✅ Successfully fetched', prompts.length, 'AI prompts');
    return prompts;
  } catch (error) {
    errorHandler.handleError(error, 'Fetch AI Prompts', {
      toastId: 'fetch-prompts-error',
    });
    throw error;
  }
};

// Fetch a single AI prompt by ID
export const fetchPrompt = async (promptId) => {
  try {
    const docRef = doc(db, 'ai_prompts', promptId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error(`Prompt ${promptId} not found`);
  } catch (error) {
    console.error('Error in fetchPrompt:', error);
    throw error;
  }
};

// Create a new AI prompt
export const createPrompt = async (promptData) => {
  try {
    const docRef = await addDoc(collection(db, 'ai_prompts'), {
        name: promptData.name,
        prompt: promptData.prompt,
        category: promptData.category,
        prompt_type: promptData.prompt_type,
        section: promptData.section,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });
    const newDocSnap = await getDoc(docRef);
    return { id: newDocSnap.id, ...newDocSnap.data() };
  } catch (error) {
    console.error('Error in createPrompt:', error);
    throw error;
  }
};

// Update an existing AI prompt
export const updatePrompt = async (promptData) => {
  try {
    const docRef = doc(db, 'ai_prompts', promptData.id);
    await updateDoc(docRef, {
        name: promptData.name,
        prompt: promptData.prompt,
        category: promptData.category,
        prompt_type: promptData.prompt_type,
        section: promptData.section,
        updated_at: new Date().toISOString(),
    });
    const updatedDocSnap = await getDoc(docRef);
    return { id: updatedDocSnap.id, ...updatedDocSnap.data() };
  } catch (error) {
    console.error('Error in updatePrompt:', error);
    throw error;
  }
};

// Delete an AI prompt
export const deletePrompt = async (promptId) => {
  try {
    const docRef = doc(db, 'ai_prompts', promptId);
    await deleteDoc(docRef);
    return { success: true, id: promptId };
  } catch (error) {
    console.error('Error in deletePrompt:', error);
    throw error;
  }
};

// Fetch AI settings
export const fetchAISettings = async () => {
  try {
    // Assuming settings are stored in a single document 'singleton'
    const docRef = doc(db, 'ai_settings', 'singleton');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null; // No settings found
  } catch (error) {
    console.error('Error in fetchAISettings:', error);
    throw error;
  }
};

// Update AI settings
export const updateAISettings = async (settingsData) => {
  try {
    // Assuming settings are stored in a single document 'singleton'
    const docRef = doc(db, 'ai_settings', 'singleton');
    // Use set with merge:true to create or update
    await updateDoc(docRef, {
        ...settingsData,
        updated_at: new Date().toISOString(),
    }, { merge: true });
    const updatedDocSnap = await getDoc(docRef);
    return { id: updatedDocSnap.id, ...updatedDocSnap.data() };
  } catch (error) {
    console.error('Error in updateAISettings:', error);
    throw error;
  }
};

// Fetch AI logs
export const fetchAILogs = async (options = {}) => {
  try {
    const { limit = 100, offset = 0, promptId } = options;
    const logsCollection = collection(db, 'ai_logs');
    let q = query(logsCollection, orderBy('created_at', 'desc'), limit(limit));

    if (promptId) {
      q = query(q, where('prompt_id', '==', promptId));
    }
    // Note: Firestore pagination is cursor-based (startAfter), not offset-based.
    // This is a simplified implementation.

    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Getting total count requires a separate query in Firestore.
    // This is simplified for now.
    return {
      logs,
      totalLogs: logs.length,
    };
  } catch (error) {
    console.error('Error in fetchAILogs:', error);
    throw error;
  }
};

// Get prompt by category, type, and section
export const getPromptByCategoryTypeAndSection = async (
  category,
  type,
  section
) => {
  try {
    const promptsCollection = collection(db, 'ai_prompts');
    const q = query(
      promptsCollection,
      where('category', '==', category),
      where('prompt_type', '==', type),
      where('section', '==', section),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error in getPromptByCategoryTypeAndSection:', error);
    throw error;
  }
};
