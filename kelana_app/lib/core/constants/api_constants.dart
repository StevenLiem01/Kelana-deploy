import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConstants {
  static const String _configuredBaseUrl = String.fromEnvironment(
    'KELANA_API_BASE_URL',
    defaultValue: '',
  );
  static bool _localhostWarningShown = false;

  // Default URL depends on platform:
  // - Android emulator uses 10.0.2.2 to access host machine's localhost
  // - iOS / Web / Desktop uses localhost
  static String get defaultBaseUrl {
    final baseUrl = _configuredBaseUrl.isNotEmpty
        ? _configuredBaseUrl
        : _platformDefaultBaseUrl;
    _warnIfReleaseWebUsesLocalhost(baseUrl);
    return baseUrl;
  }

  static String get _platformDefaultBaseUrl {
    if (kIsWeb) return 'http://localhost:5000/';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:5000/';
    } catch (_) {}
    return 'http://localhost:5000/';
  }

  static void _warnIfReleaseWebUsesLocalhost(String baseUrl) {
    if (!kIsWeb || !kReleaseMode || _localhostWarningShown) return;
    final host = Uri.tryParse(baseUrl)?.host.toLowerCase();
    if (!{'localhost', '127.0.0.1', '::1'}.contains(host)) return;

    _localhostWarningShown = true;
    debugPrint(
      'WARNING: Release Flutter Web is configured with a localhost API URL. '
      'Set --dart-define=KELANA_API_BASE_URL=https://your-backend.example.',
    );
  }

  // Endpoints
  static const String health = 'api/health';
  static const String parseIntent = 'api/parse-intent';
  static const String searchPlaces = 'api/search-places';
  static const String buildItinerary = 'api/build-itinerary';
  static const String itineraries = 'api/itineraries';
  static const String share = 'api/share';
}
