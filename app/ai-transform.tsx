import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { ChevronLeft, Upload, Sparkles, Download, RotateCw } from 'lucide-react-native';
import { EventCategory } from '@/types';
import { useEvents } from '@/providers/EventProvider';
import ScreenFrame from '@/components/ScreenFrame';
import { theme } from '@/constants/theme';
import {
  DecorationStyle,
  DISTRICT_PRICING,
  EVENT_CATEGORY_LABELS,
  VenueSize,
  calculateRoomTransformationEstimate,
} from '@/utils/budgetEngine';

const EVENT_CATEGORY_ORDER: EventCategory[] = [
  'wedding',
  'birthday',
  'reception',
  'engagement',
  'corporate',
  'festival',
  'babyshower',
  'graduation',
  'housewarming',
  'cultural',
];

export default function AITransformScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getEventById } = useEvents();

  const event = getEventById(params.eventId as string);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<DecorationStyle>('modern');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>(event?.category || 'wedding');
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICT_PRICING[0].id);
  const [selectedVenueSize, setSelectedVenueSize] = useState<VenueSize>('medium');
  const [guestInput, setGuestInput] = useState('160');
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const guestCount = Number.isFinite(Number.parseInt(guestInput, 10))
    ? Number.parseInt(guestInput, 10)
    : 160;

  const estimate = useMemo(
    () =>
      calculateRoomTransformationEstimate({
        eventCategory: selectedCategory,
        districtId: selectedDistrict,
        guestCount,
        style: selectedStyle,
        venueSize: selectedVenueSize,
      }),
    [selectedCategory, selectedDistrict, guestCount, selectedStyle, selectedVenueSize]
  );

  const stylesOptions: { id: DecorationStyle; name: string; emoji: string }[] = [
    { id: 'traditional', name: 'Traditional', emoji: '🏛️' },
    { id: 'modern', name: 'Modern', emoji: '✨' },
    { id: 'luxury', name: 'Luxury', emoji: '💎' },
    { id: 'budget', name: 'Budget', emoji: '💰' },
  ];

  const venueSizes: { id: VenueSize; label: string }[] = [
    { id: 'small', label: 'Small Venue' },
    { id: 'medium', label: 'Medium Venue' },
    { id: 'large', label: 'Large Venue' },
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['Images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
      setTransformedImage(null);
    }
  };

  const transformRoom = async (forceVariation = false) => {
    if (!selectedImage) {
      Alert.alert('Image Required', 'Please upload a venue photo first.');
      return;
    }
    if (isTransforming) return;

    setIsTransforming(true);

    try {
      const variationToken = forceVariation ? Date.now() : null;
      const prompt = [
        `Transform this venue into a ${EVENT_CATEGORY_LABELS[selectedCategory]} setup.`,
        `Decoration style: ${selectedStyle}.`,
        `District profile: ${estimate.district.name}.`,
        `Target guests: ${guestCount}.`,
        `Venue size assumption: ${selectedVenueSize}.`,
        'Add stage decor, lighting effects, floral accents, and practical guest movement layout.',
        'The final output should look photorealistic and event-ready.',
        forceVariation
          ? `Create a fresh design variation from previous output. Variation token: ${variationToken}.`
          : '',
      ].join(' ');

      const response = await fetch(selectedImage);
      const blob = await response.blob();

      const reader = new Promise<string>((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onloadend = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        fileReader.readAsDataURL(blob);
      });

      const base64data = await reader;

      const editResponse = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          images: [{ type: 'image', image: base64data }],
          aspectRatio: '16:9',
        }),
      });

      const data = await editResponse.json();
      if (data.image?.base64Data) {
        const transformedBase64 = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
        setTransformedImage(transformedBase64);
      } else {
        Alert.alert('Transform Failed', 'No transformed image was returned by AI.');
      }
    } catch (error) {
      console.error('Transform error:', error);
      Alert.alert('Transform Failed', 'Please try again in a moment.');
    } finally {
      setIsTransforming(false);
    }
  };

  const saveTransformedImage = async () => {
    if (!transformedImage) {
      Alert.alert('No Image', 'Generate an image before saving.');
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (Platform.OS === 'web') {
        if (typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = transformedImage;
          link.download = `eventai-transform-${Date.now()}.png`;
          link.click();
          Alert.alert('Saved', 'Download started.');
        } else {
          Alert.alert('Save Failed', 'Web save is not available in this environment.');
        }
        return;
      }

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow photo library access to save images.');
        return;
      }

      let localUri = transformedImage;
      if (transformedImage.startsWith('data:')) {
        const parts = transformedImage.match(/^data:(.*?);base64,(.*)$/);
        if (!parts) {
          throw new Error('Invalid transformed image format.');
        }

        const mimeType = parts[1] || 'image/png';
        const base64Data = parts[2];
        const extension = mimeType.includes('png')
          ? 'png'
          : mimeType.includes('webp')
            ? 'webp'
            : 'jpg';

        localUri = `${FileSystem.cacheDirectory}eventai-transform-${Date.now()}.${extension}`;
        await FileSystem.writeAsStringAsync(localUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (transformedImage.startsWith('http')) {
        const fileUri = `${FileSystem.cacheDirectory}eventai-transform-${Date.now()}.jpg`;
        const downloadResult = await FileSystem.downloadAsync(transformedImage, fileUri);
        localUri = downloadResult.uri;
      }

      const asset = await MediaLibrary.createAssetAsync(localUri);
      const album = await MediaLibrary.getAlbumAsync('EventAI');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('EventAI', asset, false);
      }

      Alert.alert('Saved', 'Image saved to gallery (EventAI album).');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Failed', 'Unable to save image right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenFrame>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Room Transform</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.eventInfo}>
            <Sparkles size={20} color="#3B82F6" />
            <Text style={styles.eventInfoText}>
              {event
                ? `Preset event: ${event.title}`
                : 'Upload a venue photo and customize style, district, and budget signals'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Upload Venue Photo</Text>
            <TouchableOpacity style={styles.uploadCard} onPress={pickImage}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} contentFit="cover" />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Upload size={48} color="#3B82F6" />
                  <Text style={styles.uploadText}>Tap to Upload</Text>
                  <Text style={styles.uploadSubtext}>Choose a clear photo of your venue</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Event + Decoration Configuration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {EVENT_CATEGORY_ORDER.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextActive]}>
                    {EVENT_CATEGORY_LABELS[category]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.stylesGrid}>
              {stylesOptions.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleCard,
                    selectedStyle === style.id && styles.styleCardActive,
                  ]}
                  onPress={() => setSelectedStyle(style.id)}
                >
                  <Text style={styles.styleEmoji}>{style.emoji}</Text>
                  <Text style={[styles.styleName, selectedStyle === style.id && styles.styleNameActive]}>
                    {style.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. District + Venue Inputs</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {DISTRICT_PRICING.map((district) => (
                <TouchableOpacity
                  key={district.id}
                  style={[
                    styles.categoryChip,
                    selectedDistrict === district.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedDistrict(district.id)}
                >
                  <Text style={[styles.categoryChipText, selectedDistrict === district.id && styles.categoryChipTextActive]}>
                    {district.name} ({district.multiplier.toFixed(2)}x)
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.venueSizeRow}>
              {venueSizes.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  style={[styles.sizeButton, selectedVenueSize === size.id && styles.sizeButtonActive]}
                  onPress={() => setSelectedVenueSize(size.id)}
                >
                  <Text style={[styles.sizeButtonText, selectedVenueSize === size.id && styles.sizeButtonTextActive]}>
                    {size.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Target Guests</Text>
              <TextInput
                style={styles.input}
                value={guestInput}
                onChangeText={setGuestInput}
                keyboardType="number-pad"
                placeholder="e.g. 160"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimated Decor Cost</Text>
            <View style={styles.estimateCard}>
              <Text style={styles.estimateLabel}>AI Transformation Budget</Text>
              <Text style={styles.estimateValue}>₹{estimate.total.toLocaleString()}</Text>
              <Text style={styles.estimateSubtext}>
                ₹{estimate.perGuest.toLocaleString()} per guest • {estimate.district.name}
              </Text>
              {estimate.breakdown.map((item) => (
                <View key={item.id} style={styles.breakdownRow}>
                  <View style={styles.breakdownTop}>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={styles.breakdownAmount}>₹{item.amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${item.percent}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {transformedImage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transformed Result</Text>
              <View style={styles.resultCard}>
                <Image source={{ uri: transformedImage }} style={styles.resultImage} contentFit="cover" />
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={[styles.resultButton, isTransforming && styles.resultButtonDisabled]}
                    onPress={() => transformRoom(true)}
                    disabled={isTransforming}
                  >
                    <RotateCw size={18} color="#3B82F6" />
                    <Text style={styles.resultButtonText}>
                      {isTransforming ? 'Regenerating...' : 'Regenerate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resultButton, (isSaving || isTransforming) && styles.resultButtonDisabled]}
                    onPress={saveTransformedImage}
                    disabled={isSaving || isTransforming}
                  >
                    <Download size={18} color="#10B981" />
                    <Text style={styles.resultButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <SafeAreaView style={styles.transformFooter} edges={['bottom']}>
          {!selectedImage && (
            <Text style={styles.transformHint}>Upload a venue photo to enable AI transform.</Text>
          )}
          <TouchableOpacity
            style={[
              styles.transformButton,
              (!selectedImage || isTransforming) && styles.transformButtonDisabled,
            ]}
            onPress={() => transformRoom(false)}
            disabled={!selectedImage || isTransforming}
          >
            <LinearGradient
              colors={!selectedImage || isTransforming ? ['#475569', '#64748B'] : ['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.transformButtonGradient}
            >
              {isTransforming ? (
                <>
                  <ActivityIndicator color="#FFF" />
                  <Text style={styles.transformButtonText}>Transforming...</Text>
                </>
              ) : (
                <>
                  <Sparkles size={20} color="#FFF" />
                  <Text style={styles.transformButtonText}>Transform with AI</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
        </SafeAreaView>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 22,
    paddingBottom: 140,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
  },
  eventInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  uploadCard: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  uploadSubtext: {
    color: '#94A3B8',
    fontSize: 13,
  },
  horizontalChips: {
    gap: 8,
    paddingRight: 6,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
  },
  categoryChipActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#172554',
  },
  categoryChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  categoryChipTextActive: {
    color: '#BFDBFE',
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  styleCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#334155',
  },
  styleCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#172554',
  },
  styleEmoji: {
    fontSize: 28,
  },
  styleName: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  styleNameActive: {
    color: '#DBEAFE',
  },
  venueSizeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  sizeButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    alignItems: 'center',
  },
  sizeButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#172554',
  },
  sizeButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  sizeButtonTextActive: {
    color: '#DBEAFE',
  },
  inputCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 2,
  },
  input: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  estimateCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 14,
    gap: 10,
  },
  estimateLabel: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  estimateValue: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '800' as const,
  },
  estimateSubtext: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 4,
  },
  breakdownRow: {
    gap: 6,
  },
  breakdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  breakdownLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    flex: 1,
    fontWeight: '600' as const,
  },
  breakdownAmount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3B82F6',
  },
  transformButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  transformButtonDisabled: {
    opacity: 0.5,
  },
  transformButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  transformButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  transformFooter: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  transformHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  resultCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  resultImage: {
    width: '100%',
    height: 300,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  resultButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 11,
  },
  resultButtonDisabled: {
    opacity: 0.55,
  },
  resultButtonText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
