import 'dart:convert';

import 'package:flutter/material.dart';

import 'services/event_ai_api_service.dart';

typedef PromptBuilder = String Function(Map<String, String> values);

String _value(Map<String, String> values, String key) =>
    (values[key] ?? '').trim();

class AIModuleField {
  const AIModuleField({
    required this.key,
    required this.label,
    required this.placeholder,
    this.keyboardType = TextInputType.text,
    this.maxLines = 1,
  });

  final String key;
  final String label;
  final String placeholder;
  final TextInputType keyboardType;
  final int maxLines;
}

class AIModuleConfig {
  const AIModuleConfig({
    required this.id,
    required this.title,
    required this.goal,
    required this.systemPrompt,
    required this.promptBuilder,
    required this.fields,
    required this.expectedKeys,
    required this.exampleValues,
  });

  final String id;
  final String title;
  final String goal;
  final String systemPrompt;
  final PromptBuilder promptBuilder;
  final List<AIModuleField> fields;
  final List<String> expectedKeys;
  final Map<String, String> exampleValues;
}

class AIModuleCatalog {
  static final eventDna = AIModuleConfig(
    id: 'event_dna_generator',
    title: 'AI Event DNA Generator',
    goal:
        'Analyze user preferences and generate a personalized event style profile.',
    systemPrompt:
        'You are an expert event strategist and creative director. '
        'Analyze user preferences and generate a personalized event style profile. '
        'Be concise, structured, and strategic. Return output in JSON format.',
    promptBuilder: (values) => '''
User preferences:
- Event type: ${_value(values, 'eventType')}
- Budget range: ${_value(values, 'budget')}
- Guest count: ${_value(values, 'guestCount')}
- Preferred vibe: ${_value(values, 'vibe')}
- Indoor or outdoor: ${_value(values, 'venueType')}
- Cultural preferences: ${_value(values, 'culture')}
- Favorite colors: ${_value(values, 'colors')}

Generate:
1. Event Style Profile Name
2. Core Aesthetic Description
3. Recommended Decor Style
4. Suggested Vendor Tier
5. Budget Allocation Strategy
6. Risk Warnings

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'eventType',
        label: 'Event Type',
        placeholder: 'Wedding, Birthday, Corporate',
      ),
      AIModuleField(
        key: 'budget',
        label: 'Budget Range',
        placeholder: 'e.g. 300000-500000 INR',
      ),
      AIModuleField(
        key: 'guestCount',
        label: 'Guest Count',
        placeholder: 'e.g. 250',
        keyboardType: TextInputType.number,
      ),
      AIModuleField(
        key: 'vibe',
        label: 'Preferred Vibe',
        placeholder: 'Elegant, Minimal, Royal, Festive',
      ),
      AIModuleField(
        key: 'venueType',
        label: 'Indoor / Outdoor',
        placeholder: 'Indoor, Outdoor, Mixed',
      ),
      AIModuleField(
        key: 'culture',
        label: 'Cultural Preferences',
        placeholder: 'Traditional Gujarati, South Indian, etc.',
      ),
      AIModuleField(
        key: 'colors',
        label: 'Favorite Colors',
        placeholder: 'Gold, White, Emerald',
      ),
    ],
    expectedKeys: const [
      'profile_name',
      'core_aesthetic_description',
      'recommended_decor_style',
      'suggested_vendor_tier',
      'budget_allocation_strategy',
      'risk_warnings',
    ],
    exampleValues: const {
      'eventType': 'Wedding Reception',
      'budget': '400000-700000 INR',
      'guestCount': '300',
      'vibe': 'Elegant and modern',
      'venueType': 'Outdoor',
      'culture': 'North Indian',
      'colors': 'Ivory, Gold, Sage Green',
    },
  );

  static final budgetForecaster = AIModuleConfig(
    id: 'budget_forecaster',
    title: 'AI Budget Forecaster',
    goal:
        'Predict realistic cost distribution and highlight potential overspending risks.',
    systemPrompt:
        'You are a financial event planning analyst. '
        'Predict realistic cost distribution and highlight potential overspending risks. '
        'Return structured JSON.',
    promptBuilder: (values) => '''
Event details:
- Event type: ${_value(values, 'eventType')}
- City: ${_value(values, 'city')}
- Guest count: ${_value(values, 'guests')}
- Total budget: ${_value(values, 'budget')}
- Season: ${_value(values, 'season')}

Generate:
- Budget breakdown by category (venue, catering, decor, entertainment, logistics)
- Hidden cost warnings
- Seasonal price impact
- Risk percentage of exceeding budget
- Cost optimization tips

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'eventType',
        label: 'Event Type',
        placeholder: 'Corporate Event',
      ),
      AIModuleField(
        key: 'city',
        label: 'City',
        placeholder: 'Mumbai',
      ),
      AIModuleField(
        key: 'guests',
        label: 'Guest Count',
        placeholder: '200',
        keyboardType: TextInputType.number,
      ),
      AIModuleField(
        key: 'budget',
        label: 'Total Budget',
        placeholder: '600000 INR',
      ),
      AIModuleField(
        key: 'season',
        label: 'Season',
        placeholder: 'Winter',
      ),
    ],
    expectedKeys: const [
      'budget_breakdown',
      'hidden_cost_warnings',
      'seasonal_price_impact',
      'risk_exceeding_budget_percent',
      'cost_optimization_tips',
    ],
    exampleValues: const {
      'eventType': 'Corporate Annual Meet',
      'city': 'Bangalore',
      'guests': '180',
      'budget': '900000 INR',
      'season': 'Monsoon',
    },
  );

  static final autoEventGenerator = AIModuleConfig(
    id: 'auto_event_generator',
    title: 'AI Auto Event Generator',
    goal:
        'Generate a complete event blueprint including timeline, vendor suggestions, and layout.',
    systemPrompt:
        'You are a full-stack AI event planner. '
        'Generate a complete event blueprint including timeline, vendor suggestions, and layout. '
        'Return in structured JSON.',
    promptBuilder: (values) => '''
Plan an event with:
- Type: ${_value(values, 'eventType')}
- Location: ${_value(values, 'city')}
- Guests: ${_value(values, 'guests')}
- Budget: ${_value(values, 'budget')}
- Theme preference: ${_value(values, 'theme')}
- Date: ${_value(values, 'date')}

Generate:
1. Event Concept
2. Suggested Venue Type
3. Vendor Categories Needed
4. Sample Timeline (hour-by-hour)
5. Budget Allocation
6. Backup Plan Suggestions

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'eventType',
        label: 'Event Type',
        placeholder: 'Engagement, Product Launch, Baby Shower',
      ),
      AIModuleField(
        key: 'city',
        label: 'City',
        placeholder: 'Delhi',
      ),
      AIModuleField(
        key: 'guests',
        label: 'Guests',
        placeholder: '120',
        keyboardType: TextInputType.number,
      ),
      AIModuleField(
        key: 'budget',
        label: 'Budget',
        placeholder: '500000 INR',
      ),
      AIModuleField(
        key: 'theme',
        label: 'Theme Preference',
        placeholder: 'Modern minimal',
      ),
      AIModuleField(
        key: 'date',
        label: 'Date',
        placeholder: '2026-11-12',
      ),
    ],
    expectedKeys: const [
      'event_concept',
      'suggested_venue_type',
      'vendor_categories_needed',
      'timeline_hour_by_hour',
      'budget_allocation',
      'backup_plan_suggestions',
    ],
    exampleValues: const {
      'eventType': 'Product Launch',
      'city': 'Pune',
      'guests': '150',
      'budget': '850000 INR',
      'theme': 'Futuristic and bold',
      'date': '2026-09-15',
    },
  );

  static final vendorPriceEvaluator = AIModuleConfig(
    id: 'vendor_price_evaluator',
    title: 'AI Vendor Price Evaluator',
    goal: 'Compare vendor pricing against regional averages.',
    systemPrompt:
        'You are an AI market pricing analyst. '
        'Compare vendor pricing against regional averages. '
        'Provide fair pricing analysis. Return JSON.',
    promptBuilder: (values) => '''
Vendor details:
- Service type: ${_value(values, 'service')}
- Price quoted: ${_value(values, 'price')}
- City: ${_value(values, 'city')}
- Event type: ${_value(values, 'eventType')}
- Guest count: ${_value(values, 'guests')}

Analyze:
- Price fairness score (1-100)
- Market comparison insight
- Negotiation suggestion
- Suggested counter-offer range

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'service',
        label: 'Service Type',
        placeholder: 'Catering, Decor, DJ, Photography',
      ),
      AIModuleField(
        key: 'price',
        label: 'Price Quoted',
        placeholder: '120000 INR',
      ),
      AIModuleField(
        key: 'city',
        label: 'City',
        placeholder: 'Hyderabad',
      ),
      AIModuleField(
        key: 'eventType',
        label: 'Event Type',
        placeholder: 'Wedding',
      ),
      AIModuleField(
        key: 'guests',
        label: 'Guest Count',
        placeholder: '300',
        keyboardType: TextInputType.number,
      ),
    ],
    expectedKeys: const [
      'price_fairness_score',
      'market_comparison_insight',
      'negotiation_suggestion',
      'suggested_counter_offer_range',
    ],
    exampleValues: const {
      'service': 'Decor',
      'price': '180000 INR',
      'city': 'Ahmedabad',
      'eventType': 'Reception',
      'guests': '250',
    },
  );

  static final negotiationMessageGenerator = AIModuleConfig(
    id: 'negotiation_message_generator',
    title: 'AI Negotiation Message Generator',
    goal: 'Write polite but strategic negotiation messages.',
    systemPrompt:
        'You are a professional negotiation assistant. '
        'Write polite but strategic negotiation messages. '
        'Tone: confident, respectful.',
    promptBuilder: (values) => '''
Vendor type: ${_value(values, 'vendorType')}
Quoted price: ${_value(values, 'price')}
User budget: ${_value(values, 'budget')}
Event type: ${_value(values, 'eventType')}

Generate:
- 1 polite negotiation message
- 1 assertive negotiation message
- 1 value-based negotiation message

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'vendorType',
        label: 'Vendor Type',
        placeholder: 'Photographer',
      ),
      AIModuleField(
        key: 'price',
        label: 'Quoted Price',
        placeholder: '90000 INR',
      ),
      AIModuleField(
        key: 'budget',
        label: 'Your Budget',
        placeholder: '70000 INR',
      ),
      AIModuleField(
        key: 'eventType',
        label: 'Event Type',
        placeholder: 'Wedding',
      ),
    ],
    expectedKeys: const [
      'polite_negotiation_message',
      'assertive_negotiation_message',
      'value_based_negotiation_message',
    ],
    exampleValues: const {
      'vendorType': 'Photographer',
      'price': '95000 INR',
      'budget': '75000 INR',
      'eventType': 'Wedding',
    },
  );

  static final eventDaySmartAssistant = AIModuleConfig(
    id: 'event_day_smart_assistant',
    title: 'AI Event Day Smart Assistant',
    goal: 'Analyze delays and suggest corrective actions.',
    systemPrompt:
        'You are a real-time event operations assistant. '
        'Analyze delays and suggest corrective actions. '
        'Return concise, actionable recommendations.',
    promptBuilder: (values) => '''
Live event status:
- Time now: ${_value(values, 'time')}
- Catering status: ${_value(values, 'status')}
- Vendor arrivals: ${_value(values, 'vendorStatus')}
- Schedule progress: ${_value(values, 'timelineStatus')}

Generate:
- Risk alerts
- Immediate action steps
- Backup recommendations

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'time',
        label: 'Current Time',
        placeholder: '18:20',
      ),
      AIModuleField(
        key: 'status',
        label: 'Catering Status',
        placeholder: 'Delayed by 20 minutes',
      ),
      AIModuleField(
        key: 'vendorStatus',
        label: 'Vendor Arrivals',
        placeholder: 'DJ arrived, decorator en route',
      ),
      AIModuleField(
        key: 'timelineStatus',
        label: 'Schedule Progress',
        placeholder: 'Running 15 minutes late',
      ),
    ],
    expectedKeys: const [
      'risk_alerts',
      'immediate_action_steps',
      'backup_recommendations',
    ],
    exampleValues: const {
      'time': '19:10',
      'status': 'Main course delayed',
      'vendorStatus': 'Photographer on-site, emcee delayed',
      'timelineStatus': 'Agenda slipped by 25 minutes',
    },
  );

  static final decorVariationGenerator = AIModuleConfig(
    id: 'decor_variation_generator',
    title: 'AI Decor Variation Generator',
    goal: 'Generate 3 practical decor concepts for venue transformation.',
    systemPrompt:
        'You are a creative interior event designer. '
        'Generate 3 different decor concepts for a venue transformation. '
        'Be visually descriptive and practical. Return structured output.',
    promptBuilder: (values) => '''
Venue type: ${_value(values, 'venueType')}
Event type: ${_value(values, 'eventType')}
Theme preference: ${_value(values, 'theme')}
Budget tier: ${_value(values, 'budgetTier')}
Guest count: ${_value(values, 'guests')}

Generate 3 decor concepts including:
- Color palette
- Lighting style
- Table setup
- Stage design
- Special visual elements

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'venueType',
        label: 'Venue Type',
        placeholder: 'Banquet Hall',
      ),
      AIModuleField(
        key: 'eventType',
        label: 'Event Type',
        placeholder: 'Wedding Reception',
      ),
      AIModuleField(
        key: 'theme',
        label: 'Theme Preference',
        placeholder: 'Royal floral',
      ),
      AIModuleField(
        key: 'budgetTier',
        label: 'Budget Tier',
        placeholder: 'Mid / Premium / Luxury',
      ),
      AIModuleField(
        key: 'guests',
        label: 'Guest Count',
        placeholder: '220',
        keyboardType: TextInputType.number,
      ),
    ],
    expectedKeys: const [
      'decor_concepts',
      'decor_concepts[].color_palette',
      'decor_concepts[].lighting_style',
      'decor_concepts[].table_setup',
      'decor_concepts[].stage_design',
      'decor_concepts[].special_visual_elements',
    ],
    exampleValues: const {
      'venueType': 'Lawn',
      'eventType': 'Engagement',
      'theme': 'Pastel garden',
      'budgetTier': 'Premium',
      'guests': '180',
    },
  );

  static final postEventAnalysis = AIModuleConfig(
    id: 'post_event_analysis',
    title: 'AI Post-Event Analysis Generator',
    goal: 'Generate a post-event performance insights report.',
    systemPrompt:
        'You are an event performance analyst. '
        'Generate a post-event insights report. '
        'Return structured summary.',
    promptBuilder: (values) => '''
Event summary:
- Budget planned: ${_value(values, 'plannedBudget')}
- Actual spend: ${_value(values, 'actualSpend')}
- Guests invited: ${_value(values, 'invited')}
- Guests attended: ${_value(values, 'attended')}
- Vendor ratings: ${_value(values, 'vendorScores')}

Generate:
- Budget performance analysis
- Guest turnout insights
- Vendor performance summary
- Improvement suggestions

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'plannedBudget',
        label: 'Planned Budget',
        placeholder: '500000 INR',
      ),
      AIModuleField(
        key: 'actualSpend',
        label: 'Actual Spend',
        placeholder: '545000 INR',
      ),
      AIModuleField(
        key: 'invited',
        label: 'Guests Invited',
        placeholder: '300',
        keyboardType: TextInputType.number,
      ),
      AIModuleField(
        key: 'attended',
        label: 'Guests Attended',
        placeholder: '262',
        keyboardType: TextInputType.number,
      ),
      AIModuleField(
        key: 'vendorScores',
        label: 'Vendor Ratings',
        placeholder: 'Catering:4.5, Decor:4.2, DJ:4.8',
        maxLines: 3,
      ),
    ],
    expectedKeys: const [
      'budget_performance_analysis',
      'guest_turnout_insights',
      'vendor_performance_summary',
      'improvement_suggestions',
    ],
    exampleValues: const {
      'plannedBudget': '700000 INR',
      'actualSpend': '735000 INR',
      'invited': '350',
      'attended': '301',
      'vendorScores': 'Catering:4.6, Decor:4.1, Photo:4.8',
    },
  );

  static final personalizedVendorRecommendation = AIModuleConfig(
    id: 'personalized_vendor_recommendation',
    title: 'AI Personalized Vendor Recommendation',
    goal: 'Match vendor recommendations based on profile and event constraints.',
    systemPrompt:
        'You are an AI recommendation engine for event vendors. '
        'Match vendors based on user profile and event type. '
        'Return ranked suggestions.',
    promptBuilder: (values) => '''
User style profile: ${_value(values, 'styleProfile')}
Event type: ${_value(values, 'eventType')}
Budget: ${_value(values, 'budget')}
Location: ${_value(values, 'city')}
Guest count: ${_value(values, 'guests')}

Recommend:
- Top 3 vendor types
- Suggested vendor tier
- Reasoning for match

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'styleProfile',
        label: 'User Style Profile',
        placeholder: 'Elegant modern with floral accents',
      ),
      AIModuleField(
        key: 'eventType',
        label: 'Event Type',
        placeholder: 'Wedding',
      ),
      AIModuleField(
        key: 'budget',
        label: 'Budget',
        placeholder: '1000000 INR',
      ),
      AIModuleField(
        key: 'city',
        label: 'Location',
        placeholder: 'Jaipur',
      ),
      AIModuleField(
        key: 'guests',
        label: 'Guest Count',
        placeholder: '280',
        keyboardType: TextInputType.number,
      ),
    ],
    expectedKeys: const [
      'top_3_vendor_types',
      'suggested_vendor_tier',
      'reasoning_for_match',
    ],
    exampleValues: const {
      'styleProfile': 'Royal luxury, warm tones, grand stage',
      'eventType': 'Wedding',
      'budget': '1200000 INR',
      'city': 'Udaipur',
      'guests': '320',
    },
  );

  static final riskPredictor = AIModuleConfig(
    id: 'risk_predictor',
    title: 'AI Risk Predictor',
    goal: 'Analyze potential logistical and financial event risks.',
    systemPrompt:
        'You are an event risk prediction AI. '
        'Analyze potential logistical and financial risks. '
        'Return structured warnings.',
    promptBuilder: (values) => '''
Event details:
- Event type: ${_value(values, 'eventType')}
- Location: ${_value(values, 'city')}
- Guest count: ${_value(values, 'guests')}
- Season: ${_value(values, 'season')}
- Indoor/outdoor: ${_value(values, 'venueType')}

Generate:
- Top 5 risks
- Risk severity score (1-10)
- Mitigation strategy for each

Return JSON only.
''',
    fields: const [
      AIModuleField(
        key: 'eventType',
        label: 'Event Type',
        placeholder: 'Outdoor Wedding',
      ),
      AIModuleField(
        key: 'city',
        label: 'Location',
        placeholder: 'Goa',
      ),
      AIModuleField(
        key: 'guests',
        label: 'Guest Count',
        placeholder: '400',
        keyboardType: TextInputType.number,
      ),
      AIModuleField(
        key: 'season',
        label: 'Season',
        placeholder: 'Monsoon',
      ),
      AIModuleField(
        key: 'venueType',
        label: 'Indoor / Outdoor',
        placeholder: 'Outdoor',
      ),
    ],
    expectedKeys: const [
      'top_5_risks',
      'risk_severity_score',
      'mitigation_strategies',
    ],
    exampleValues: const {
      'eventType': 'Beach Wedding',
      'city': 'Goa',
      'guests': '260',
      'season': 'Monsoon',
      'venueType': 'Outdoor',
    },
  );
}

class AIModuleFormScreen extends StatefulWidget {
  const AIModuleFormScreen({
    super.key,
    required this.config,
  });

  final AIModuleConfig config;

  @override
  State<AIModuleFormScreen> createState() => _AIModuleFormScreenState();
}

class _AIModuleFormScreenState extends State<AIModuleFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final Map<String, TextEditingController> _controllers;

  bool _isSubmitting = false;
  String? _errorMessage;
  String? _jsonOutput;

  @override
  void initState() {
    super.initState();
    _controllers = {
      for (final field in widget.config.fields)
        field.key: TextEditingController(),
    };
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _fillExample() {
    for (final entry in widget.config.exampleValues.entries) {
      _controllers[entry.key]?.text = entry.value;
    }
  }

  Future<void> _generate() async {
    final formState = _formKey.currentState;
    if (formState == null || !formState.validate()) return;

    final values = <String, String>{
      for (final field in widget.config.fields)
        field.key: (_controllers[field.key]?.text ?? '').trim(),
    };

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final output = await EventAIApiService.instance.generateStructuredOutput(
        moduleId: widget.config.id,
        systemPrompt: widget.config.systemPrompt,
        userPrompt: widget.config.promptBuilder(values),
      );
      final prettyJson = const JsonEncoder.withIndent('  ').convert(output);
      if (!mounted) return;
      setState(() {
        _jsonOutput = prettyJson;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.config.title)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.config.goal,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 12),
              Text(
                'Expected JSON keys',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              ...widget.config.expectedKeys.map(
                (key) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text('- $key'),
                ),
              ),
              const SizedBox(height: 16),
              ...widget.config.fields.map(_buildField),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : _generate,
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.auto_awesome),
                    label: Text(_isSubmitting ? 'Generating...' : 'Generate JSON'),
                  ),
                  OutlinedButton.icon(
                    onPressed: _isSubmitting ? null : _fillExample,
                    icon: const Icon(Icons.auto_fix_high),
                    label: const Text('Fill Example'),
                  ),
                ],
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: const Color(0xFFFEE2E2),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Color(0xFF991B1B)),
                  ),
                ),
              ],
              if (_jsonOutput != null) ...[
                const SizedBox(height: 16),
                Text(
                  'JSON Response',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF1E293B)),
                  ),
                  child: SelectableText(
                    _jsonOutput!,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: Color(0xFFE2E8F0),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(AIModuleField field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            field.label,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _controllers[field.key],
            keyboardType: field.keyboardType,
            maxLines: field.maxLines,
            decoration: InputDecoration(
              hintText: field.placeholder,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
            ),
            validator: (value) {
              if ((value ?? '').trim().isEmpty) {
                return 'Required';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }
}

class EventDNAGeneratorScreen extends StatelessWidget {
  const EventDNAGeneratorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(config: AIModuleCatalog.eventDna);
  }
}

class BudgetForecasterScreen extends StatelessWidget {
  const BudgetForecasterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(config: AIModuleCatalog.budgetForecaster);
  }
}

class AutoEventGeneratorScreen extends StatelessWidget {
  const AutoEventGeneratorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(config: AIModuleCatalog.autoEventGenerator);
  }
}

class VendorPriceEvaluatorScreen extends StatelessWidget {
  const VendorPriceEvaluatorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(config: AIModuleCatalog.vendorPriceEvaluator);
  }
}

class NegotiationMessageGeneratorScreen extends StatelessWidget {
  const NegotiationMessageGeneratorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(
      config: AIModuleCatalog.negotiationMessageGenerator,
    );
  }
}

class EventDaySmartAssistantScreen extends StatelessWidget {
  const EventDaySmartAssistantScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(config: AIModuleCatalog.eventDaySmartAssistant);
  }
}

class DecorVariationGeneratorScreen extends StatelessWidget {
  const DecorVariationGeneratorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(config: AIModuleCatalog.decorVariationGenerator);
  }
}

class PostEventAnalysisScreen extends StatelessWidget {
  const PostEventAnalysisScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(config: AIModuleCatalog.postEventAnalysis);
  }
}

class PersonalizedVendorRecommendationScreen extends StatelessWidget {
  const PersonalizedVendorRecommendationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(
      config: AIModuleCatalog.personalizedVendorRecommendation,
    );
  }
}

class RiskPredictorScreen extends StatelessWidget {
  const RiskPredictorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AIModuleFormScreen(config: AIModuleCatalog.riskPredictor);
  }
}
