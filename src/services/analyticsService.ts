import { 
  analyticsEventsService, 
  analyticsSessionsService, 
  analyticsExperimentsService,
  BaseDocument 
} from '@/lib/database';

// --- Types and Interfaces ---

export interface AnalyticsEvent {
  event_name: string;
  timestamp: string;
  session_id: string;
  user_id?: string;
  page_url: string;
  page_path: string;
  page_title: string;
  properties: Record<string, any>;
  immediate?: boolean;
}

export interface AnalyticsSession extends BaseDocument {
  session_id: string;
  user_id?: string;
  start_time: string;
  end_time?: string;
  page_views: number;
  events_count: number;
  user_agent: string;
  screen_resolution: string;
  viewport_size: string;
  referrer: string;
  landing_page: string;
  exit_page?: string;
  duration_ms?: number;
  is_active: boolean;
}

export interface ExperimentVariant extends BaseDocument {
  experiment_name: string;
  user_id?: string;
  session_id: string;
  variant: string;
  assigned_at: string;
  converted?: boolean;
  conversion_goals: string[];
}

export interface TrackingOptions {
  immediate?: boolean;
  skipQueue?: boolean;
}

export interface UserProperties {
  user_type?: string;
  subscription_status?: string;
  registration_date?: string;
  email_verified?: boolean;
  [key: string]: any;
}

export interface ExperimentOptions {
  sticky?: boolean;
  trafficAllocation?: number;
  targetingRules?: Record<string, any>;
}

// --- Analytics Service Class ---

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private experiments: Map<string, string>;
  private eventQueue: AnalyticsEvent[];
  private isInitialized: boolean;
  private flushInterval?: NodeJS.Timeout;
  private sessionStartTime: number;
  private pageViewCount: number;
  private eventCount: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.experiments = new Map();
    this.eventQueue = [];
    this.isInitialized = false;
    this.sessionStartTime = Date.now();
    this.pageViewCount = 0;
    this.eventCount = 0;
  }

  /**
   * Initialize analytics service
   */
  async initialize(userId?: string, userProperties: UserProperties = {}): Promise<void> {
    if (userId) {
      this.userId = userId;
    }
    this.isInitialized = true;

    // Set up automatic event flushing
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 5000); // Flush every 5 seconds

    // Create session record
    await this.createSession(userProperties);

    // Track session start
    this.track('session_start', {
      session_id: this.sessionId,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
      viewport_size: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      landing_page: typeof window !== 'undefined' ? window.location.pathname : '',
      ...userProperties
    });

    // Load active A/B tests
    await this.loadActiveExperiments();

    console.log('Analytics service initialized');
  }

  /**
   * Track user events
   */
  track(eventName: string, properties: Record<string, any> = {}, options: TrackingOptions = {}): void {
    if (!this.isInitialized && eventName !== 'session_start') {
      console.warn('Analytics not initialized. Call initialize() first.');
      return;
    }

    const event: AnalyticsEvent = {
      event_name: eventName,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
      properties: {
        ...properties,
        // Add experiment data to all events
        active_experiments: Object.fromEntries(this.experiments)
      }
    };

    if (this.userId) {
      event.user_id = this.userId;
    }

    if (options.immediate !== undefined) {
      event.immediate = options.immediate;
    }

    if (!options.skipQueue) {
      this.eventQueue.push(event);
      this.eventCount++;
    }

    // Flush immediately for critical events
    if (options.immediate || this.isCriticalEvent(eventName)) {
      this.flushEvents();
    }
  }

  /**
   * Track page views
   */
  trackPageView(pagePath?: string, properties: Record<string, any> = {}): void {
    const path = pagePath || (typeof window !== 'undefined' ? window.location.pathname : '');
    
    this.track('page_view', {
      page_path: path,
      page_title: typeof document !== 'undefined' ? document.title : '',
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      ...properties
    });

    this.pageViewCount++;
    this.updateSession();
  }

  /**
   * Track conversion funnel events
   */
  trackFunnelStep(funnelName: string, step: string, properties: Record<string, any> = {}): void {
    this.track('funnel_step', {
      funnel_name: funnelName,
      funnel_step: step,
      step_timestamp: new Date().toISOString(),
      ...properties
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(conversionType: string, value: number = 0, properties: Record<string, any> = {}): void {
    this.track('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      conversion_timestamp: new Date().toISOString(),
      ...properties
    }, { immediate: true });
  }

  /**
   * Track user interactions
   */
  trackInteraction(element: string, action: string, properties: Record<string, any> = {}): void {
    this.track('user_interaction', {
      element_id: element,
      interaction_type: action,
      ...properties
    });
  }

  /**
   * Track form events
   */
  trackForm(formName: string, action: string, properties: Record<string, any> = {}): void {
    this.track('form_event', {
      form_name: formName,
      form_action: action,
      ...properties
    });
  }

  /**
   * Track errors
   */
  trackError(errorType: string, errorMessage: string, context: Record<string, any> = {}): void {
    this.track('error', {
      error_type: errorType,
      error_message: errorMessage,
      error_context: context,
      stack_trace: context.stack || null
    }, { immediate: true });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName: string, value: number, properties: Record<string, any> = {}): void {
    this.track('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      ...properties
    });
  }

  /**
   * A/B Testing: Get experiment variant
   */
  async getExperimentVariant(
    experimentName: string, 
    variants: string[] = ['control', 'treatment'], 
    options: ExperimentOptions = {}
  ): Promise<string> {
    try {
      // Check if user already has a variant assigned
      if (this.experiments.has(experimentName)) {
        return this.experiments.get(experimentName)!;
      }

      // For now, use simple random assignment
      // In production, this would call a backend service
      const variant = this.assignVariant(variants, options);
      this.experiments.set(experimentName, variant);

      // Store experiment assignment in database
      await this.storeExperimentAssignment(experimentName, variant, variants);

      // Track experiment exposure
      this.track('experiment_exposure', {
        experiment_name: experimentName,
        variant: variant,
        variants_available: variants
      });

      return variant;

    } catch (error) {
      console.error('Failed to get experiment variant:', error);
      // Fallback to control variant
      const fallbackVariant = variants[0] || 'control';
      this.experiments.set(experimentName, fallbackVariant);
      return fallbackVariant;
    }
  }

  /**
   * Track experiment conversion
   */
  trackExperimentConversion(experimentName: string, goalName: string, value: number = 1): void {
    const variant = this.experiments.get(experimentName);
    if (!variant) {
      console.warn(`No variant found for experiment: ${experimentName}`);
      return;
    }

    this.track('experiment_conversion', {
      experiment_name: experimentName,
      variant: variant,
      goal_name: goalName,
      goal_value: value
    }, { immediate: true });

    // Update experiment record
    this.updateExperimentConversion(experimentName, goalName);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties): void {
    this.track('user_properties_updated', {
      updated_properties: properties
    });
  }

  /**
   * Identify user
   */
  identify(userId: string, properties: UserProperties = {}): void {
    this.userId = userId;
    this.track('user_identified', {
      user_id: userId,
      ...properties
    });
    this.updateSession();
  }

  // --- E-commerce Events ---

  trackProductView(productId: string, productName: string, category: string, price: number): void {
    this.track('product_view', {
      product_id: productId,
      product_name: productName,
      product_category: category,
      product_price: price
    });
  }

  trackAddToCart(productId: string, productName: string, price: number, quantity: number = 1): void {
    this.track('add_to_cart', {
      product_id: productId,
      product_name: productName,
      product_price: price,
      quantity: quantity,
      cart_value: price * quantity
    });
  }

  trackPurchase(orderId: string, totalValue: number, items: any[]): void {
    this.trackConversion('purchase', totalValue, {
      order_id: orderId,
      items: items,
      item_count: items.length
    });
  }

  // --- Healthcare-specific Events ---

  trackConsultationStart(consultationType: string, providerId: string): void {
    this.trackFunnelStep('consultation_funnel', 'consultation_start', {
      consultation_type: consultationType,
      provider_id: providerId
    });
  }

  trackPrescriptionApproval(prescriptionId: string, medicationName: string): void {
    this.trackConversion('prescription_approval', 1, {
      prescription_id: prescriptionId,
      medication_name: medicationName
    });
  }

  trackAppointmentBooked(appointmentId: string, appointmentType: string, providerId: string): void {
    this.trackConversion('appointment_booking', 1, {
      appointment_id: appointmentId,
      appointment_type: appointmentType,
      provider_id: providerId
    });
  }

  // --- Private Methods ---

  private async createSession(userProperties: UserProperties): Promise<void> {
    try {
      const sessionData: any = {
        session_id: this.sessionId,
        start_time: new Date().toISOString(),
        page_views: 0,
        events_count: 0,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
        viewport_size: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        landing_page: typeof window !== 'undefined' ? window.location.pathname : '',
        is_active: true
      };

      if (this.userId) {
        sessionData.user_id = this.userId;
      }

      await analyticsSessionsService.create(sessionData);
    } catch (error) {
      console.error('Failed to create analytics session:', error);
    }
  }

  private async updateSession(): Promise<void> {
    try {
      const { data: sessions } = await analyticsSessionsService.getMany({
        filters: [{ field: 'session_id', operator: '==', value: this.sessionId }],
        limit: 1
      });

      if (sessions.length > 0) {
        const session = sessions[0];
        const updateData: any = {
          page_views: this.pageViewCount,
          events_count: this.eventCount,
          duration_ms: Date.now() - this.sessionStartTime,
          exit_page: typeof window !== 'undefined' ? window.location.pathname : ''
        };

        if (this.userId) {
          updateData.user_id = this.userId;
        }

        if (session) {
          await analyticsSessionsService.update(session.id, updateData);
        }
      }
    } catch (error) {
      console.error('Failed to update analytics session:', error);
    }
  }

  private async loadActiveExperiments(): Promise<void> {
    try {
      const filters: Array<{ field: string; operator: '=='; value: any }> = [];
      if (this.userId) {
        filters.push({ field: 'user_id', operator: '==', value: this.userId });
      } else {
        filters.push({ field: 'session_id', operator: '==', value: this.sessionId });
      }

      const { data: experiments } = await analyticsExperimentsService.getMany({
        filters
      });

      experiments.forEach((exp: any) => {
        this.experiments.set(exp.experiment_name, exp.variant);
      });

    } catch (error) {
      console.error('Failed to load active experiments:', error);
    }
  }

  private async storeExperimentAssignment(
    experimentName: string, 
    variant: string, 
    variants: string[]
  ): Promise<void> {
    try {
      const experimentData: any = {
        experiment_name: experimentName,
        session_id: this.sessionId,
        variant: variant,
        assigned_at: new Date().toISOString(),
        converted: false,
        conversion_goals: []
      };

      if (this.userId) {
        experimentData.user_id = this.userId;
      }

      await analyticsExperimentsService.create(experimentData);
    } catch (error) {
      console.error('Failed to store experiment assignment:', error);
    }
  }

  private async updateExperimentConversion(experimentName: string, goalName: string): Promise<void> {
    try {
      const filters: Array<{ field: string; operator: '=='; value: any }> = [
        { field: 'experiment_name', operator: '==', value: experimentName }
      ];
      
      if (this.userId) {
        filters.push({ field: 'user_id', operator: '==', value: this.userId });
      } else {
        filters.push({ field: 'session_id', operator: '==', value: this.sessionId });
      }

      const { data: experiments } = await analyticsExperimentsService.getMany({
        filters,
        limit: 1
      });

      if (experiments.length > 0) {
        const experiment: any = experiments[0];
        const goals = experiment.conversion_goals || [];
        if (!goals.includes(goalName)) {
          goals.push(goalName);
        }

        await analyticsExperimentsService.update(experiment.id, {
          converted: true,
          conversion_goals: goals
        });
      }
    } catch (error) {
      console.error('Failed to update experiment conversion:', error);
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Store events in batches
      const batchSize = 10;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        const eventPromises = batch.map(event => {
          const eventData: any = {
            event_name: event.event_name,
            timestamp: event.timestamp,
            session_id: event.session_id,
            page_url: event.page_url,
            page_path: event.page_path,
            page_title: event.page_title,
            properties: event.properties
          };

          if (event.user_id) {
            eventData.user_id = event.user_id;
          }

          return analyticsEventsService.create(eventData);
        });
        
        await Promise.all(eventPromises);
      }

      console.log(`Flushed ${events.length} analytics events`);

    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private assignVariant(variants: string[], options: ExperimentOptions): string {
    // Simple random assignment for now
    // In production, this would use more sophisticated algorithms
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString();
    const randomPart = Math.floor(Math.random() * 1000000000).toString(36);
    // @ts-ignore - TypeScript strict mode issue with string concatenation
    return 'session_' + timestamp + '_' + randomPart;
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = [
      'conversion',
      'error',
      'experiment_conversion',
      'purchase',
      'prescription_approval'
    ];
    return criticalEvents.includes(eventName);
  }

  /**
   * Cleanup on page unload
   */
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents();
    this.endSession();
  }

  private async endSession(): Promise<void> {
    try {
      const { data: sessions } = await analyticsSessionsService.getMany({
        filters: [{ field: 'session_id', operator: '==', value: this.sessionId }],
        limit: 1
      });

      if (sessions.length > 0) {
        const session = sessions[0];
        if (session) {
          await analyticsSessionsService.update(session.id, {
            end_time: new Date().toISOString(),
            is_active: false,
            duration_ms: Date.now() - this.sessionStartTime,
            page_views: this.pageViewCount,
            events_count: this.eventCount
          });
        }
      }
    } catch (error) {
      console.error('Failed to end analytics session:', error);
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Auto-cleanup on page unload (browser only)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analyticsService.cleanup();
  });
}

export default analyticsService;

// Named exports for convenience
export const {
  initialize,
  track,
  trackPageView,
  trackFunnelStep,
  trackConversion,
  trackInteraction,
  trackForm,
  trackError,
  trackPerformance,
  getExperimentVariant,
  trackExperimentConversion,
  setUserProperties,
  identify,
  trackProductView,
  trackAddToCart,
  trackPurchase,
  trackConsultationStart,
  trackPrescriptionApproval,
  trackAppointmentBooked
} = analyticsService;
