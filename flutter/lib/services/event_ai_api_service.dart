import 'dart:convert';

import 'package:http/http.dart' as http;

class EventAIApiService {
  EventAIApiService._();

  static final EventAIApiService instance = EventAIApiService._();

  static const String _endpoint = String.fromEnvironment(
    'EVENT_AI_ENDPOINT',
    defaultValue: 'https://toolkit.rork.com/llm/text',
  );

  Future<dynamic> generateStructuredOutput({
    required String moduleId,
    required String systemPrompt,
    required String userPrompt,
  }) async {
    final uri = Uri.parse(_endpoint);
    final response = await http
        .post(
          uri,
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode({
            'messages': [
              {'role': 'system', 'content': systemPrompt},
              {'role': 'user', 'content': userPrompt},
            ],
          }),
        )
        .timeout(const Duration(seconds: 45));

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        '[$moduleId] API request failed (${response.statusCode}).',
      );
    }

    dynamic decoded;
    try {
      decoded = jsonDecode(response.body);
    } catch (_) {
      throw Exception('[$moduleId] Invalid API response format.');
    }

    final completion = _extractCompletion(decoded);
    if (completion.isEmpty) {
      throw Exception('[$moduleId] Empty completion from API.');
    }

    final clean = _stripMarkdownFences(completion.trim());
    final jsonSegment = _extractJsonSegment(clean);

    try {
      return jsonDecode(jsonSegment);
    } catch (_) {
      throw Exception(
        '[$moduleId] Model did not return valid JSON. Response: $clean',
      );
    }
  }

  String _extractCompletion(dynamic decoded) {
    if (decoded is Map<String, dynamic>) {
      final completion = decoded['completion'];
      if (completion is String) return completion;

      final content = decoded['content'];
      if (content is String) return content;

      final choices = decoded['choices'];
      if (choices is List && choices.isNotEmpty) {
        final first = choices.first;
        if (first is Map<String, dynamic>) {
          final message = first['message'];
          if (message is Map<String, dynamic>) {
            final msgContent = message['content'];
            if (msgContent is String) return msgContent;
          }
        }
      }
    }
    return '';
  }

  String _stripMarkdownFences(String text) {
    if (!text.startsWith('```')) return text;

    final lines = text.split('\n').toList();
    if (lines.isNotEmpty && lines.first.trim().startsWith('```')) {
      lines.removeAt(0);
    }
    if (lines.isNotEmpty && lines.last.trim() == '```') {
      lines.removeLast();
    }
    return lines.join('\n').trim();
  }

  String _extractJsonSegment(String text) {
    final objectStart = text.indexOf('{');
    final arrayStart = text.indexOf('[');
    final hasObject = objectStart >= 0;
    final hasArray = arrayStart >= 0;

    if (!hasObject && !hasArray) return text;

    late final int start;
    late final String closeChar;
    if (hasObject && hasArray) {
      if (objectStart < arrayStart) {
        start = objectStart;
        closeChar = '}';
      } else {
        start = arrayStart;
        closeChar = ']';
      }
    } else if (hasObject) {
      start = objectStart;
      closeChar = '}';
    } else {
      start = arrayStart;
      closeChar = ']';
    }

    final end = text.lastIndexOf(closeChar);
    if (end <= start) return text;
    return text.substring(start, end + 1);
  }
}
