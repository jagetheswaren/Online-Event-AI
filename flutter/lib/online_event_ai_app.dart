import 'package:flutter/material.dart';

import 'ai_module_screens.dart';

class OnlineEventAIApp extends StatelessWidget {
  const OnlineEventAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Online Event AI',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      home: const OnlineEventAIHomeScreen(),
    );
  }
}

class OnlineEventAIHomeScreen extends StatelessWidget {
  const OnlineEventAIHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final modules = <_ModuleRoute>[
      _ModuleRoute(
        title: 'AI Event DNA Generator',
        subtitle: 'Create personalized event style profile',
        builder: () => const EventDNAGeneratorScreen(),
      ),
      _ModuleRoute(
        title: 'AI Budget Forecaster',
        subtitle: 'Predict category-level costs and budget risk',
        builder: () => const BudgetForecasterScreen(),
      ),
      _ModuleRoute(
        title: 'AI Auto Event Generator',
        subtitle: 'Create a one-click event blueprint',
        builder: () => const AutoEventGeneratorScreen(),
      ),
      _ModuleRoute(
        title: 'AI Vendor Price Evaluator',
        subtitle: 'Compare quote fairness against market',
        builder: () => const VendorPriceEvaluatorScreen(),
      ),
      _ModuleRoute(
        title: 'AI Negotiation Message Generator',
        subtitle: 'Generate strategic vendor negotiation text',
        builder: () => const NegotiationMessageGeneratorScreen(),
      ),
      _ModuleRoute(
        title: 'AI Event Day Smart Assistant',
        subtitle: 'Get real-time delay correction actions',
        builder: () => const EventDaySmartAssistantScreen(),
      ),
      _ModuleRoute(
        title: 'AI Decor Variation Generator',
        subtitle: 'Generate 3 venue transformation concepts',
        builder: () => const DecorVariationGeneratorScreen(),
      ),
      _ModuleRoute(
        title: 'AI Post-Event Analysis Generator',
        subtitle: 'Analyze performance and improvements',
        builder: () => const PostEventAnalysisScreen(),
      ),
      _ModuleRoute(
        title: 'AI Personalized Vendor Recommendation',
        subtitle: 'Get ranked vendor type recommendations',
        builder: () => const PersonalizedVendorRecommendationScreen(),
      ),
      _ModuleRoute(
        title: 'AI Risk Predictor',
        subtitle: 'Forecast top risks and mitigation plans',
        builder: () => const RiskPredictorScreen(),
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Online Event AI')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Flutter Starter Modules',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ...modules.map(
            (module) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _FeatureTile(
                title: module.title,
                subtitle: module.subtitle,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => module.builder(),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModuleRoute {
  const _ModuleRoute({
    required this.title,
    required this.subtitle,
    required this.builder,
  });

  final String title;
  final String subtitle;
  final Widget Function() builder;
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
