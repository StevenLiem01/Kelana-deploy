import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../core/network/api_client.dart';
import '../models/parsed_intent.dart';
import '../models/place.dart';
import '../models/itinerary.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

class TripCreationState {
  final bool isLoading;
  final String? loadingMessage;
  final String? errorMessage;
  final String rawQuery;
  final List<Map<String, String>> conversationHistory;
  final ParsedIntent? parsedIntent;
  final List<Place> recommendedPlaces;
  final List<Place> selectedPlaces;
  final Itinerary? builtItinerary;

  TripCreationState({
    this.isLoading = false,
    this.loadingMessage,
    this.errorMessage,
    this.rawQuery = '',
    this.conversationHistory = const [],
    this.parsedIntent,
    this.recommendedPlaces = const [],
    this.selectedPlaces = const [],
    this.builtItinerary,
  });

  TripCreationState copyWith({
    bool? isLoading,
    String? loadingMessage,
    String? errorMessage,
    String? rawQuery,
    List<Map<String, String>>? conversationHistory,
    ParsedIntent? parsedIntent,
    bool clearParsedIntent = false,
    List<Place>? recommendedPlaces,
    List<Place>? selectedPlaces,
    Itinerary? builtItinerary,
  }) {
    return TripCreationState(
      isLoading: isLoading ?? this.isLoading,
      loadingMessage: loadingMessage,
      errorMessage: errorMessage,
      rawQuery: rawQuery ?? this.rawQuery,
      conversationHistory: conversationHistory ?? this.conversationHistory,
      parsedIntent:
          clearParsedIntent ? null : parsedIntent ?? this.parsedIntent,
      recommendedPlaces: recommendedPlaces ?? this.recommendedPlaces,
      selectedPlaces: selectedPlaces ?? this.selectedPlaces,
      builtItinerary: builtItinerary ?? this.builtItinerary,
    );
  }
}

class TripCreationNotifier extends StateNotifier<TripCreationState> {
  final ApiClient _apiClient;
  int _requestGeneration = 0;

  TripCreationNotifier(this._apiClient) : super(TripCreationState());

  /// Step 1: Submit raw query to Gemini via Backend Proxy
  Future<bool> submitPrompt(String query) async {
    final normalizedQuery = query.trim();
    if (normalizedQuery.isEmpty || state.isLoading) return false;

    final previousIntent = state.parsedIntent;
    final requestHistory = List<Map<String, String>>.of(
      state.conversationHistory,
    );
    final requestGeneration = ++_requestGeneration;
    state = state.copyWith(
      isLoading: true,
      loadingMessage: 'Kelana sedang memahami pesan Anda...',
      errorMessage: null,
      rawQuery: normalizedQuery,
      clearParsedIntent: true,
    );

    try {
      final intent = await _apiClient.parseIntent(
        normalizedQuery,
        preferences: previousIntent?.toJson(),
        history: requestHistory,
      );
      if (requestGeneration != _requestGeneration) return false;

      final response =
          (intent.chatResponse != null && intent.chatResponse!.isNotEmpty)
              ? intent.chatResponse!
              : intent.userNotes;
      state = state.copyWith(
        isLoading: false,
        loadingMessage: null,
        parsedIntent: intent,
        conversationHistory: _appendConversationTurn(
          requestHistory,
          normalizedQuery,
          response,
        ),
      );
      return true;
    } catch (error) {
      if (requestGeneration != _requestGeneration) return false;
      state = state.copyWith(
        isLoading: false,
        loadingMessage: null,
        errorMessage: _apiClient.friendlyErrorMessage(
          error,
          fallback:
              'Kelana belum dapat memahami permintaan Anda. Silakan coba lagi.',
        ),
        conversationHistory: _appendConversationTurn(
          requestHistory,
          normalizedQuery,
          'Maaf, terjadi gangguan saat memahami permintaan Anda. Silakan coba lagi.',
        ),
      );
      return false;
    }
  }

  List<Map<String, String>> _appendConversationTurn(
    List<Map<String, String>> history,
    String query,
    String response,
  ) {
    return _trimConversationHistory([
      ...history,
      {'role': 'user', 'text': query},
      {'role': 'model', 'text': response},
    ]);
  }

  List<Map<String, String>> _trimConversationHistory(
    List<Map<String, String>> history,
  ) {
    const maxMessages = 20;
    if (history.length <= maxMessages) return history;
    return history.sublist(history.length - maxMessages);
  }

  /// Update parsed intent fields manually from confirmation card
  void updateParsedIntent(ParsedIntent newIntent) {
    state = state.copyWith(parsedIntent: newIntent);
  }

  void notifyBudgetInsufficient({
    required int estimatedMax,
    required int userBudget,
    required int selectedCount,
    required String location,
  }) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    final destination =
        location.trim().isEmpty ? 'destinasi pilihanmu' : location.trim();
    final message =
        'Budget yang kamu masukkan (${formatter.format(userBudget)}) '
        'lebih kecil daripada estimasi biaya maksimal untuk $selectedCount '
        'destinasi di $destination (${formatter.format(estimatedMax)}). '
        'Mungkin ada angka nol yang terlewat saat memasukkan budget. Kamu bisa '
        'langsung balas di chat, misalnya "Ubah budget jadi Rp 500.000", atau '
        'kurangi jumlah destinasi yang dipilih. Estimasi biaya ini bersifat '
        'perkiraan.';

    state = state.copyWith(
      conversationHistory: _trimConversationHistory([
        ...state.conversationHistory,
        {'role': 'model', 'text': message},
      ]),
    );
  }

  void loadItinerary(Itinerary itinerary) {
    state = state.copyWith(
      parsedIntent: itinerary.parsedIntent,
      recommendedPlaces: itinerary.places,
      selectedPlaces: itinerary.places,
      builtItinerary: itinerary,
    );
  }

  /// Step 2: Search places from Places API / Datasets based on confirmed intent
  Future<bool> fetchPlacesForIntent() async {
    if (state.isLoading) return false;
    final intent = state.parsedIntent;
    if (intent == null || intent.location.trim().isEmpty) {
      return false;
    }

    final requestGeneration = ++_requestGeneration;
    state = state.copyWith(
      isLoading: true,
      loadingMessage: 'Mencari destinasi terbaik di ${intent.location}...',
      errorMessage: null,
    );

    try {
      final places = await _apiClient.searchPlaces(intent);
      if (requestGeneration != _requestGeneration) return false;
      // Pre-select top 4 places by default
      final defaultSelected = places.take(4).toList();

      state = state.copyWith(
        isLoading: false,
        loadingMessage: null,
        recommendedPlaces: places,
        selectedPlaces: defaultSelected,
      );
      return true;
    } catch (error) {
      if (requestGeneration != _requestGeneration) return false;
      state = state.copyWith(
        isLoading: false,
        loadingMessage: null,
        errorMessage: _apiClient.friendlyErrorMessage(
          error,
          fallback: 'Rekomendasi tempat belum dapat dimuat. Silakan coba lagi.',
        ),
      );
      return false;
    }
  }

  /// Toggle selection of place in recommendation list
  void togglePlaceSelection(Place place) {
    final current = [...state.selectedPlaces];
    final existsIndex = current.indexWhere((p) => p.placeId == place.placeId);

    if (existsIndex >= 0) {
      if (current.length > 1) {
        current.removeAt(existsIndex);
      }
    } else {
      current.add(place);
    }
    state = state.copyWith(selectedPlaces: current);
  }

  /// Step 3: Build a scheduled itinerary with Directions API
  Future<bool> buildItinerary() async {
    if (state.isLoading) return false;
    if (state.selectedPlaces.isEmpty) {
      state = state.copyWith(errorMessage: 'Pilih minimal 1 tempat destinasi.');
      return false;
    }

    final selectedPlaces = List<Place>.of(state.selectedPlaces);
    final intent = state.parsedIntent;
    final requestGeneration = ++_requestGeneration;
    state = state.copyWith(
      isLoading: true,
      loadingMessage: 'Menyusun urutan rute dan estimasi waktu perjalanan...',
      errorMessage: null,
    );

    try {
      final itinerary = await _apiClient.buildItinerary(
        selectedPlaces,
        intent: intent,
      );
      if (requestGeneration != _requestGeneration) return false;

      state = state.copyWith(
        isLoading: false,
        loadingMessage: null,
        builtItinerary: itinerary,
      );
      return true;
    } catch (error) {
      if (requestGeneration != _requestGeneration) return false;
      state = state.copyWith(
        isLoading: false,
        loadingMessage: null,
        errorMessage: _apiClient.friendlyErrorMessage(
          error,
          fallback: 'Itinerary belum dapat dibuat. Silakan coba lagi.',
        ),
      );
      return false;
    }
  }

  /// Reorder stops (drag & drop) in itinerary view
  void reorderStops(int oldIndex, int newIndex) {
    final itin = state.builtItinerary;
    if (itin == null) return;

    final places = [...itin.places];
    if (newIndex > oldIndex) newIndex -= 1;
    final item = places.removeAt(oldIndex);
    places.insert(newIndex, item);

    // Re-assign order numbers
    final updated = places.asMap().entries.map((entry) {
      return entry.value.copyWith(order: entry.key + 1);
    }).toList();

    state = state.copyWith(
      builtItinerary: itin.copyWith(places: updated),
    );
  }

  /// Toggle visited status of a place
  void toggleVisited(String placeId) {
    final itin = state.builtItinerary;
    if (itin == null) return;

    final updated = itin.places.map((p) {
      if (p.placeId == placeId) {
        return p.copyWith(visited: !p.visited);
      }
      return p;
    }).toList();

    state = state.copyWith(
      builtItinerary: itin.copyWith(places: updated),
    );
  }

  /// Remove a place from current built itinerary
  void removePlaceFromItinerary(String placeId) {
    final itin = state.builtItinerary;
    if (itin == null || itin.places.length <= 1) return;

    final updated = itin.places.where((p) => p.placeId != placeId).toList();
    final reordered = updated.asMap().entries.map((entry) {
      return entry.value.copyWith(order: entry.key + 1);
    }).toList();

    state = state.copyWith(
      builtItinerary: itin.copyWith(places: reordered),
    );
  }

  void openItinerary(Itinerary itinerary) {
    final usablePlaces =
        itinerary.places.where((place) => place.hasUsableName).toList();
    final itineraryWithUsablePlaces = itinerary.copyWith(places: usablePlaces);
    state = state.copyWith(
      builtItinerary: itineraryWithUsablePlaces,
      recommendedPlaces: usablePlaces,
      selectedPlaces: usablePlaces,
      parsedIntent: itineraryWithUsablePlaces.parsedIntent,
    );
  }

  void reset() {
    _requestGeneration++;
    state = TripCreationState();
  }
}

final tripCreationProvider =
    StateNotifierProvider<TripCreationNotifier, TripCreationState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return TripCreationNotifier(apiClient);
});
