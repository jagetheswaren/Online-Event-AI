import 'package:flutter/material.dart';

class EventStyleProfileScreen extends StatelessWidget {
  const EventStyleProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Event Style Profile'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'AI Event DNA Generator',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Text(
              'Use this screen as a base to collect event preferences and render JSON results.',
            ),
          ],
        ),
      ),
    );
  }
}
