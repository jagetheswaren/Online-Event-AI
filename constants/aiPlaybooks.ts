export interface AIPlaybookField {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
}

export interface AIPlaybook {
  id: string;
  title: string;
  systemPrompt: string;
  userPromptTemplate: string;
  fields: AIPlaybookField[];
}

export const EVENT_AI_MASTER_PROMPT =
  'You are EventAI, an intelligent, proactive event co-planner. You provide structured, practical, creative, and financially realistic event planning guidance. You prioritize clarity, cost-awareness, and actionable insights. Always return structured output suitable for application parsing. Avoid fluff.';

export const AI_PLAYBOOKS: AIPlaybook[] = [
  {
    id: 'event_dna_generator',
    title: 'Event DNA',
    systemPrompt:
      'You are an expert event strategist and creative director. Analyze user preferences and generate a personalized event style profile. Be concise, structured, and strategic. Return output in JSON format.',
    userPromptTemplate:
      'User preferences:\n- Event type: {{event_type}}\n- Budget range: {{budget}}\n- Guest count: {{guest_count}}\n- Preferred vibe: {{vibe}}\n- Indoor or outdoor: {{venue_type}}\n- Cultural preferences: {{culture}}\n- Favorite colors: {{colors}}\n\nGenerate:\n1. Event Style Profile Name\n2. Core Aesthetic Description\n3. Recommended Decor Style\n4. Suggested Vendor Tier\n5. Budget Allocation Strategy\n6. Risk Warnings',
    fields: [
      { key: 'event_type', label: 'Event Type', placeholder: 'Wedding, Birthday, Corporate...' },
      { key: 'budget', label: 'Budget Range', placeholder: 'e.g. ₹2,00,000 to ₹5,00,000' },
      { key: 'guest_count', label: 'Guest Count', placeholder: 'e.g. 120', keyboardType: 'numeric' },
      { key: 'vibe', label: 'Preferred Vibe', placeholder: 'Elegant, Bold, Minimal, Festive...' },
      { key: 'venue_type', label: 'Venue Type', placeholder: 'Indoor or Outdoor' },
      { key: 'culture', label: 'Cultural Preferences', placeholder: 'Any traditions, rituals, customs' },
      { key: 'colors', label: 'Favorite Colors', placeholder: 'e.g. Emerald, Gold, Ivory' },
    ],
  },
  {
    id: 'budget_forecaster',
    title: 'Budget Forecast',
    systemPrompt:
      'You are a financial event planning analyst. Predict realistic cost distribution and highlight potential overspending risks. Return structured JSON.',
    userPromptTemplate:
      'Event details:\n- Event type: {{event_type}}\n- City: {{city}}\n- Guest count: {{guests}}\n- Total budget: {{budget}}\n- Season: {{season}}\n\nGenerate:\n- Budget breakdown by category (venue, catering, decor, entertainment, logistics)\n- Hidden cost warnings\n- Seasonal price impact\n- Risk percentage of exceeding budget\n- Cost optimization tips',
    fields: [
      { key: 'event_type', label: 'Event Type', placeholder: 'Wedding, Birthday, Corporate...' },
      { key: 'city', label: 'City', placeholder: 'e.g. Mumbai, Delhi' },
      { key: 'guests', label: 'Guest Count', placeholder: 'e.g. 150', keyboardType: 'numeric' },
      { key: 'budget', label: 'Total Budget', placeholder: 'e.g. ₹4,00,000' },
      { key: 'season', label: 'Season', placeholder: 'Summer, Monsoon, Winter' },
    ],
  },
  {
    id: 'auto_event_generator',
    title: 'One-Click Plan',
    systemPrompt:
      'You are a full-stack AI event planner. Generate a complete event blueprint including timeline, vendor suggestions, and layout. Return in structured JSON.',
    userPromptTemplate:
      'Plan an event with:\n- Type: {{event_type}}\n- Location: {{city}}\n- Guests: {{guests}}\n- Budget: {{budget}}\n- Theme preference: {{theme}}\n- Date: {{date}}\n\nGenerate:\n1. Event Concept\n2. Suggested Venue Type\n3. Vendor Categories Needed\n4. Sample Timeline (hour-by-hour)\n5. Budget Allocation\n6. Backup Plan Suggestions',
    fields: [
      { key: 'event_type', label: 'Event Type', placeholder: 'Wedding, Birthday, Corporate...' },
      { key: 'city', label: 'City', placeholder: 'e.g. Mumbai, Delhi' },
      { key: 'guests', label: 'Guest Count', placeholder: 'e.g. 200', keyboardType: 'numeric' },
      { key: 'budget', label: 'Budget', placeholder: 'e.g. ₹6,00,000' },
      { key: 'theme', label: 'Theme Preference', placeholder: 'Royal, Boho, Minimal...' },
      { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD' },
    ],
  },
  {
    id: 'vendor_price_evaluator',
    title: 'Price Evaluator',
    systemPrompt:
      'You are an AI market pricing analyst. Compare vendor pricing against regional averages. Provide fair pricing analysis. Return JSON.',
    userPromptTemplate:
      'Vendor details:\n- Service type: {{service}}\n- Price quoted: {{price}}\n- City: {{city}}\n- Event type: {{event_type}}\n- Guest count: {{guests}}\n\nAnalyze:\n- Price fairness score (1-100)\n- Market comparison insight\n- Negotiation suggestion\n- Suggested counter-offer range',
    fields: [
      { key: 'service', label: 'Service Type', placeholder: 'Catering, Decor, DJ...' },
      { key: 'price', label: 'Quoted Price', placeholder: 'e.g. ₹1,20,000' },
      { key: 'city', label: 'City', placeholder: 'e.g. Pune' },
      { key: 'event_type', label: 'Event Type', placeholder: 'Wedding, Birthday...' },
      { key: 'guests', label: 'Guest Count', placeholder: 'e.g. 120', keyboardType: 'numeric' },
    ],
  },
  {
    id: 'negotiation_message_generator',
    title: 'Negotiation Msg',
    systemPrompt:
      'You are a professional negotiation assistant. Write polite but strategic negotiation messages. Tone: confident, respectful.',
    userPromptTemplate:
      'Vendor type: {{vendor_type}}\nQuoted price: {{price}}\nUser budget: {{budget}}\nEvent type: {{event_type}}\n\nGenerate:\n- 1 polite negotiation message\n- 1 assertive negotiation message\n- 1 value-based negotiation message',
    fields: [
      { key: 'vendor_type', label: 'Vendor Type', placeholder: 'Decorator, Photographer...' },
      { key: 'price', label: 'Quoted Price', placeholder: 'e.g. ₹80,000' },
      { key: 'budget', label: 'Your Budget', placeholder: 'e.g. ₹60,000' },
      { key: 'event_type', label: 'Event Type', placeholder: 'Wedding, Reception...' },
    ],
  },
  {
    id: 'event_day_assistant',
    title: 'Event Day Ops',
    systemPrompt:
      'You are a real-time event operations assistant. Analyze delays and suggest corrective actions. Return concise, actionable recommendations.',
    userPromptTemplate:
      'Live event status:\n- Time now: {{time}}\n- Catering status: {{status}}\n- Vendor arrivals: {{vendor_status}}\n- Schedule progress: {{timeline_status}}\n\nGenerate:\n- Risk alerts\n- Immediate action steps\n- Backup recommendations',
    fields: [
      { key: 'time', label: 'Time Now', placeholder: 'e.g. 17:30' },
      { key: 'status', label: 'Catering Status', placeholder: 'On-time, Delayed...' },
      { key: 'vendor_status', label: 'Vendor Arrivals', placeholder: 'Which vendors arrived / late' },
      { key: 'timeline_status', label: 'Schedule Progress', placeholder: 'Ahead / On-track / Behind' },
    ],
  },
  {
    id: 'decor_variation_generator',
    title: 'Decor Variations',
    systemPrompt:
      'You are a creative interior event designer. Generate 3 different decor concepts for a venue transformation. Be visually descriptive and practical. Return structured output.',
    userPromptTemplate:
      'Venue type: {{venue_type}}\nEvent type: {{event_type}}\nTheme preference: {{theme}}\nBudget tier: {{budget_tier}}\nGuest count: {{guests}}\n\nGenerate 3 decor concepts including:\n- Color palette\n- Lighting style\n- Table setup\n- Stage design\n- Special visual elements',
    fields: [
      { key: 'venue_type', label: 'Venue Type', placeholder: 'Banquet, Lawn, Rooftop...' },
      { key: 'event_type', label: 'Event Type', placeholder: 'Wedding, Birthday...' },
      { key: 'theme', label: 'Theme Preference', placeholder: 'Modern Royal, Rustic...' },
      { key: 'budget_tier', label: 'Budget Tier', placeholder: 'Budget, Standard, Premium' },
      { key: 'guests', label: 'Guest Count', placeholder: 'e.g. 200', keyboardType: 'numeric' },
    ],
  },
  {
    id: 'post_event_analysis',
    title: 'Post-Event Analysis',
    systemPrompt:
      'You are an event performance analyst. Generate a post-event insights report. Return structured summary.',
    userPromptTemplate:
      'Event summary:\n- Budget planned: {{planned_budget}}\n- Actual spend: {{actual_spend}}\n- Guests invited: {{invited}}\n- Guests attended: {{attended}}\n- Vendor ratings: {{vendor_scores}}\n\nGenerate:\n- Budget performance analysis\n- Guest turnout insights\n- Vendor performance summary\n- Improvement suggestions',
    fields: [
      { key: 'planned_budget', label: 'Planned Budget', placeholder: 'e.g. ₹4,00,000' },
      { key: 'actual_spend', label: 'Actual Spend', placeholder: 'e.g. ₹4,60,000' },
      { key: 'invited', label: 'Guests Invited', placeholder: 'e.g. 300', keyboardType: 'numeric' },
      { key: 'attended', label: 'Guests Attended', placeholder: 'e.g. 255', keyboardType: 'numeric' },
      { key: 'vendor_scores', label: 'Vendor Ratings', placeholder: 'e.g. Catering 4.2, Decor 3.8' },
    ],
  },
  {
    id: 'vendor_recommendation',
    title: 'Vendor Match',
    systemPrompt:
      'You are an AI recommendation engine for event vendors. Match vendors based on user profile and event type. Return ranked suggestions.',
    userPromptTemplate:
      'User style profile: {{style_profile}}\nEvent type: {{event_type}}\nBudget: {{budget}}\nLocation: {{city}}\nGuest count: {{guests}}\n\nRecommend:\n- Top 3 vendor types\n- Suggested vendor tier\n- Reasoning for match',
    fields: [
      { key: 'style_profile', label: 'Style Profile', placeholder: 'e.g. Luxury Minimal with warm palette' },
      { key: 'event_type', label: 'Event Type', placeholder: 'Wedding, Corporate...' },
      { key: 'budget', label: 'Budget', placeholder: 'e.g. ₹5,00,000' },
      { key: 'city', label: 'Location', placeholder: 'e.g. Jaipur' },
      { key: 'guests', label: 'Guest Count', placeholder: 'e.g. 180', keyboardType: 'numeric' },
    ],
  },
  {
    id: 'risk_predictor',
    title: 'Risk Predictor',
    systemPrompt:
      'You are an event risk prediction AI. Analyze potential logistical and financial risks. Return structured warnings.',
    userPromptTemplate:
      'Event details:\n- Event type: {{event_type}}\n- Location: {{city}}\n- Guest count: {{guests}}\n- Season: {{season}}\n- Indoor/outdoor: {{venue_type}}\n\nGenerate:\n- Top 5 risks\n- Risk severity score (1-10)\n- Mitigation strategy for each',
    fields: [
      { key: 'event_type', label: 'Event Type', placeholder: 'Wedding, Corporate...' },
      { key: 'city', label: 'Location', placeholder: 'e.g. Bengaluru' },
      { key: 'guests', label: 'Guest Count', placeholder: 'e.g. 220', keyboardType: 'numeric' },
      { key: 'season', label: 'Season', placeholder: 'Summer, Winter...' },
      { key: 'venue_type', label: 'Indoor/Outdoor', placeholder: 'Indoor or Outdoor' },
    ],
  },
];
