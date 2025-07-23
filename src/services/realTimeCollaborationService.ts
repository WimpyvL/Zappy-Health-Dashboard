/**
 * Real-time Collaboration Service
 * 
 * Enables multi-user editing and collaboration on patient notes, forms, and documents.
 * Provides presence awareness, conflict resolution, and collaborative editing features.
 * Adapted from the old repository to work with Firebase and modern TypeScript.
 */

import { getDatabase, ref, onValue, set, push, update, remove, off, serverTimestamp, onDisconnect } from 'firebase/database';
import { getFirebaseApp } from '@/lib/firebase';

// Real-time collaboration interfaces
export interface CollaborationSession {
  id: string;
  documentId: string;
  documentType: 'patient_notes' | 'form' | 'consultation' | 'treatment_plan';
  participants: Participant[];
  status: 'active' | 'inactive' | 'locked';
  createdAt: number;
  lastActivity: number;
  metadata?: Record<string, any>;
}

export interface Participant {
  userId: string;
  userName: string;
  userRole: 'provider' | 'admin' | 'nurse' | 'assistant';
  status: 'active' | 'idle' | 'away' | 'offline';
  cursor?: CursorPosition;
  selection?: TextSelection;
  permissions: ParticipantPermissions;
  joinedAt: number;
  lastActivity: number;
}

export interface CursorPosition {
  line: number;
  column: number;
  fieldId?: string;
  sectionId?: string;
}

export interface TextSelection {
  start: CursorPosition;
  end: CursorPosition;
  text?: string;
}

export interface ParticipantPermissions {
  canEdit: boolean;
  canComment: boolean;
  canView: boolean;
  canShare: boolean;
  restrictedFields?: string[];
}

export interface CollaborativeEdit {
  id: string;
  sessionId: string;
  userId: string;
  operation: 'insert' | 'delete' | 'replace' | 'format';
  position: CursorPosition;
  content: string;
  previousContent?: string | undefined;
  timestamp: number;
  applied: boolean;
  conflicted?: boolean;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  content: string;
  position?: CursorPosition | undefined;
  thread?: Comment[];
  status: 'active' | 'resolved' | 'deleted';
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface DocumentLock {
  documentId: string;
  fieldId?: string | undefined;
  lockedBy: string;
  lockedAt: number;
  expiresAt: number;
  reason: 'editing' | 'reviewing' | 'system_update';
}

export interface PresenceInfo {
  userId: string;
  userName: string;
  status: 'online' | 'offline' | 'idle';
  currentDocument?: string;
  lastSeen: number;
  activeConnections: number;
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'edit_made' | 'comment_added' | 'document_locked' | 'document_unlocked';
  sessionId: string;
  userId: string;
  data: any;
  timestamp: number;
}

/**
 * Real-time Collaboration Service Class
 */
export class RealTimeCollaborationService {
  private database = getDatabase(getFirebaseApp());
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private userPresence: Map<string, PresenceInfo> = new Map();
  private documentLocks: Map<string, DocumentLock> = new Map();
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the collaboration service
   */
  private initialize(): void {
    // Set up presence system
    this.setupPresenceSystem();
    
    console.log('Real-time Collaboration Service initialized');
  }

  /**
   * Set current user information
   */
  setCurrentUser(userId: string, userName: string): void {
    this.currentUserId = userId;
    this.currentUserName = userName;
    
    // Update user presence
    this.updateUserPresence(userId, 'online');
  }

  /**
   * Join a collaboration session
   */
  async joinCollaborationSession(
    documentId: string,
    documentType: 'patient_notes' | 'form' | 'consultation' | 'treatment_plan',
    permissions: ParticipantPermissions
  ): Promise<string | null> {
    if (!this.currentUserId || !this.currentUserName) {
      throw new Error('User not set. Call setCurrentUser first.');
    }

    try {
      // Check for existing session
      let sessionId = await this.findExistingSession(documentId);
      
      if (!sessionId) {
        // Create new session
        sessionId = await this.createCollaborationSession(documentId, documentType);
      }

      // Add participant to session
      const participant: Participant = {
        userId: this.currentUserId,
        userName: this.currentUserName,
        userRole: 'provider', // Would be determined from user data
        status: 'active',
        permissions,
        joinedAt: Date.now(),
        lastActivity: Date.now()
      };

      await this.addParticipant(sessionId, participant);

      // Set up real-time listeners for this session
      this.setupSessionListeners(sessionId);

      console.log(`Joined collaboration session: ${sessionId} for document: ${documentId}`);
      return sessionId;
    } catch (error) {
      console.error('Error joining collaboration session:', error);
      return null;
    }
  }

  /**
   * Leave a collaboration session
   */
  async leaveCollaborationSession(sessionId: string): Promise<boolean> {
    if (!this.currentUserId) return false;

    try {
      // Remove participant from session
      const sessionRef = ref(this.database, `collaboration_sessions/${sessionId}/participants/${this.currentUserId}`);
      await remove(sessionRef);

      // Clean up listeners
      this.cleanupSessionListeners(sessionId);

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      console.log(`Left collaboration session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error leaving collaboration session:', error);
      return false;
    }
  }

  /**
   * Make a collaborative edit
   */
  async makeEdit(
    sessionId: string,
    operation: 'insert' | 'delete' | 'replace' | 'format',
    position: CursorPosition,
    content: string,
    previousContent?: string
  ): Promise<boolean> {
    if (!this.currentUserId) return false;

    try {
      const edit: CollaborativeEdit = {
        id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        userId: this.currentUserId,
        operation,
        position,
        content,
        previousContent,
        timestamp: Date.now(),
        applied: false
      };

      // Apply operational transformation if needed
      const transformedEdit = await this.applyOperationalTransform(edit);

      // Save edit to database
      const editsRef = ref(this.database, `collaboration_sessions/${sessionId}/edits`);
      const newEditRef = push(editsRef);
      await set(newEditRef, transformedEdit);

      // Update participant activity
      await this.updateParticipantActivity(sessionId, this.currentUserId);

      console.log(`Made collaborative edit: ${edit.id}`);
      return true;
    } catch (error) {
      console.error('Error making collaborative edit:', error);
      return false;
    }
  }

  /**
   * Add a comment
   */
  async addComment(
    documentId: string,
    content: string,
    position?: CursorPosition,
    parentCommentId?: string
  ): Promise<string | null> {
    if (!this.currentUserId || !this.currentUserName) return null;

    try {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const comment: Comment = {
        id: commentId,
        documentId,
        userId: this.currentUserId,
        userName: this.currentUserName,
        content,
        position,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Save comment
      const commentPath = parentCommentId 
        ? `comments/${documentId}/${parentCommentId}/thread/${commentId}`
        : `comments/${documentId}/${commentId}`;
      
      const commentRef = ref(this.database, commentPath);
      await set(commentRef, comment);

      console.log(`Added comment: ${commentId} to document: ${documentId}`);
      return commentId;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  /**
   * Update cursor position
   */
  async updateCursorPosition(sessionId: string, position: CursorPosition): Promise<boolean> {
    if (!this.currentUserId) return false;

    try {
      const cursorRef = ref(this.database, `collaboration_sessions/${sessionId}/participants/${this.currentUserId}/cursor`);
      await set(cursorRef, {
        ...position,
        timestamp: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating cursor position:', error);
      return false;
    }
  }

  /**
   * Lock a document or field for editing
   */
  async lockDocument(
    documentId: string,
    reason: 'editing' | 'reviewing' | 'system_update',
    fieldId?: string,
    duration = 300000 // 5 minutes default
  ): Promise<boolean> {
    if (!this.currentUserId) return false;

    try {
      const lockId = fieldId ? `${documentId}_${fieldId}` : documentId;
      
      const lock: DocumentLock = {
        documentId,
        fieldId,
        lockedBy: this.currentUserId,
        lockedAt: Date.now(),
        expiresAt: Date.now() + duration,
        reason
      };

      const lockRef = ref(this.database, `document_locks/${lockId}`);
      await set(lockRef, lock);

      // Set up auto-unlock on disconnect
      onDisconnect(lockRef).remove();

      this.documentLocks.set(lockId, lock);

      console.log(`Locked document: ${documentId}${fieldId ? ` field: ${fieldId}` : ''}`);
      return true;
    } catch (error) {
      console.error('Error locking document:', error);
      return false;
    }
  }

  /**
   * Unlock a document or field
   */
  async unlockDocument(documentId: string, fieldId?: string): Promise<boolean> {
    if (!this.currentUserId) return false;

    try {
      const lockId = fieldId ? `${documentId}_${fieldId}` : documentId;
      
      const lockRef = ref(this.database, `document_locks/${lockId}`);
      await remove(lockRef);

      this.documentLocks.delete(lockId);

      console.log(`Unlocked document: ${documentId}${fieldId ? ` field: ${fieldId}` : ''}`);
      return true;
    } catch (error) {
      console.error('Error unlocking document:', error);
      return false;
    }
  }

  /**
   * Get active participants in a session
   */
  getActiveParticipants(sessionId: string): Participant[] {
    const session = this.activeSessions.get(sessionId);
    return session ? session.participants.filter(p => p.status === 'active') : [];
  }

  /**
   * Get comments for a document
   */
  async getDocumentComments(documentId: string): Promise<Comment[]> {
    try {
      const commentsRef = ref(this.database, `comments/${documentId}`);
      
      return new Promise((resolve) => {
        onValue(commentsRef, (snapshot) => {
          const commentsData = snapshot.val();
          const comments: Comment[] = [];
          
          if (commentsData) {
            Object.values(commentsData).forEach((comment: any) => {
              comments.push(comment);
              
              // Add threaded comments
              if (comment.thread) {
                Object.values(comment.thread).forEach((threadComment: any) => {
                  comments.push(threadComment);
                });
              }
            });
          }
          
          resolve(comments.sort((a, b) => a.createdAt - b.createdAt));
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.error('Error getting document comments:', error);
      return [];
    }
  }

  /**
   * Subscribe to collaboration events
   */
  subscribeToCollaborationEvents(
    sessionId: string,
    callback: (event: CollaborationEvent) => void
  ): () => void {
    const eventsRef = ref(this.database, `collaboration_sessions/${sessionId}/events`);
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const eventsData = snapshot.val();
      if (eventsData) {
        Object.values(eventsData).forEach((event: any) => {
          callback(event as CollaborationEvent);
        });
      }
    });

    return () => off(eventsRef, 'value', unsubscribe);
  }

  /**
   * Get user presence information
   */
  getUserPresence(userId: string): PresenceInfo | null {
    return this.userPresence.get(userId) || null;
  }

  /**
   * Private helper methods
   */
  private async findExistingSession(documentId: string): Promise<string | null> {
    try {
      const sessionsRef = ref(this.database, 'collaboration_sessions');
      
      return new Promise((resolve) => {
        onValue(sessionsRef, (snapshot) => {
          const sessionsData = snapshot.val();
          
          if (sessionsData) {
            for (const [sessionId, session] of Object.entries(sessionsData)) {
              const sessionData = session as any;
              if (sessionData.documentId === documentId && sessionData.status === 'active') {
                resolve(sessionId);
                return;
              }
            }
          }
          
          resolve(null);
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.error('Error finding existing session:', error);
      return null;
    }
  }

  private async createCollaborationSession(
    documentId: string,
    documentType: string
  ): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CollaborationSession = {
      id: sessionId,
      documentId,
      documentType: documentType as any,
      participants: [],
      status: 'active',
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    const sessionRef = ref(this.database, `collaboration_sessions/${sessionId}`);
    await set(sessionRef, session);

    this.activeSessions.set(sessionId, session);
    return sessionId;
  }

  private async addParticipant(sessionId: string, participant: Participant): Promise<void> {
    const participantRef = ref(this.database, `collaboration_sessions/${sessionId}/participants/${participant.userId}`);
    await set(participantRef, participant);

    // Update local session
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.participants.push(participant);
      this.activeSessions.set(sessionId, session);
    }

    // Emit join event
    await this.emitCollaborationEvent(sessionId, 'user_joined', participant.userId, { participant });
  }

  private setupSessionListeners(sessionId: string): void {
    // Listen for participant changes
    const participantsRef = ref(this.database, `collaboration_sessions/${sessionId}/participants`);
    onValue(participantsRef, (snapshot) => {
      const participantsData = snapshot.val();
      const session = this.activeSessions.get(sessionId);
      
      if (session && participantsData) {
        session.participants = Object.values(participantsData) as Participant[];
        this.activeSessions.set(sessionId, session);
      }
    });

    // Listen for edits
    const editsRef = ref(this.database, `collaboration_sessions/${sessionId}/edits`);
    onValue(editsRef, (snapshot) => {
      const editsData = snapshot.val();
      if (editsData) {
        // Process new edits
        Object.values(editsData).forEach((edit: any) => {
          if (!edit.applied && edit.userId !== this.currentUserId) {
            this.applyRemoteEdit(edit as CollaborativeEdit);
          }
        });
      }
    });
  }

  private cleanupSessionListeners(sessionId: string): void {
    const participantsRef = ref(this.database, `collaboration_sessions/${sessionId}/participants`);
    const editsRef = ref(this.database, `collaboration_sessions/${sessionId}/edits`);
    
    off(participantsRef);
    off(editsRef);
  }

  private async applyOperationalTransform(edit: CollaborativeEdit): Promise<CollaborativeEdit> {
    // Simplified operational transformation
    // In a real implementation, this would be more sophisticated
    return edit;
  }

  private async applyRemoteEdit(edit: CollaborativeEdit): Promise<void> {
    // Apply remote edit to local document
    // This would integrate with the document editing system
    console.log('Applying remote edit:', edit);
  }

  private async updateParticipantActivity(sessionId: string, userId: string): Promise<void> {
    const participantRef = ref(this.database, `collaboration_sessions/${sessionId}/participants/${userId}/lastActivity`);
    await set(participantRef, serverTimestamp());
  }

  private setupPresenceSystem(): void {
    if (!this.currentUserId) return;

    const presenceRef = ref(this.database, `presence/${this.currentUserId}`);
    const connectedRef = ref(this.database, '.info/connected');

    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // Set user as online
        set(presenceRef, {
          status: 'online',
          lastSeen: serverTimestamp(),
          activeConnections: 1
        });

        // Set user as offline when disconnected
        onDisconnect(presenceRef).set({
          status: 'offline',
          lastSeen: serverTimestamp(),
          activeConnections: 0
        });
      }
    });
  }

  private async updateUserPresence(userId: string, status: 'online' | 'offline' | 'idle'): Promise<void> {
    const presenceRef = ref(this.database, `presence/${userId}`);
    await update(presenceRef, {
      status,
      lastSeen: serverTimestamp()
    });
  }

  private async emitCollaborationEvent(
    sessionId: string,
    type: CollaborationEvent['type'],
    userId: string,
    data: any
  ): Promise<void> {
    const event: CollaborationEvent = {
      type,
      sessionId,
      userId,
      data,
      timestamp: Date.now()
    };

    const eventsRef = ref(this.database, `collaboration_sessions/${sessionId}/events`);
    const newEventRef = push(eventsRef);
    await set(newEventRef, event);
  }
}

// Export singleton instance
export const realTimeCollaborationService = new RealTimeCollaborationService();
export default realTimeCollaborationService;
