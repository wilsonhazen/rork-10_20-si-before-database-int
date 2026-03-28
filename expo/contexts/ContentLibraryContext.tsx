import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { 
  MediaAsset, 
  MediaKit, 
  MediaKitSection, 
  CaseStudy 
} from '@/types';

const MEDIA_ASSETS_KEY = '@sourceimpact_media_assets';
const MEDIA_KITS_KEY = '@sourceimpact_media_kits';
const CASE_STUDIES_KEY = '@sourceimpact_case_studies';

export const [ContentLibraryProvider, useContentLibrary] = createContextHook(() => {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaKits, setMediaKits] = useState<MediaKit[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assetsData, kitsData, studiesData] = await Promise.all([
        AsyncStorage.getItem(MEDIA_ASSETS_KEY),
        AsyncStorage.getItem(MEDIA_KITS_KEY),
        AsyncStorage.getItem(CASE_STUDIES_KEY),
      ]);

      if (assetsData) setMediaAssets(JSON.parse(assetsData));
      if (kitsData) setMediaKits(JSON.parse(kitsData));
      if (studiesData) setCaseStudies(JSON.parse(studiesData));
    } catch (error) {
      console.error('Failed to load content library data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMediaAsset = useCallback(async (asset: MediaAsset) => {
    const updated = [...mediaAssets, asset];
    setMediaAssets(updated);
    await AsyncStorage.setItem(MEDIA_ASSETS_KEY, JSON.stringify(updated));
  }, [mediaAssets]);

  const updateMediaAsset = useCallback(async (id: string, updates: Partial<MediaAsset>) => {
    const updated = mediaAssets.map(a => a.id === id ? { ...a, ...updates } : a);
    setMediaAssets(updated);
    await AsyncStorage.setItem(MEDIA_ASSETS_KEY, JSON.stringify(updated));
  }, [mediaAssets]);

  const deleteMediaAsset = useCallback(async (id: string) => {
    const updated = mediaAssets.filter(a => a.id !== id);
    setMediaAssets(updated);
    await AsyncStorage.setItem(MEDIA_ASSETS_KEY, JSON.stringify(updated));
  }, [mediaAssets]);

  const getAssetsByUser = useCallback((userId: string) => {
    return mediaAssets.filter(a => a.userId === userId);
  }, [mediaAssets]);

  const getAssetsByType = useCallback((userId: string, type: 'image' | 'video' | 'document') => {
    return mediaAssets.filter(a => a.userId === userId && a.type === type);
  }, [mediaAssets]);

  const getAssetsByTags = useCallback((userId: string, tags: string[]) => {
    return mediaAssets.filter(a => 
      a.userId === userId && 
      tags.some(tag => a.tags.includes(tag))
    );
  }, [mediaAssets]);

  const createMediaKit = useCallback(async (userId: string, title: string, description: string) => {
    const kit: MediaKit = {
      id: `kit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      title,
      description,
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...mediaKits, kit];
    setMediaKits(updated);
    await AsyncStorage.setItem(MEDIA_KITS_KEY, JSON.stringify(updated));
    return kit;
  }, [mediaKits]);

  const updateMediaKit = useCallback(async (id: string, updates: Partial<MediaKit>) => {
    const updated = mediaKits.map(k => 
      k.id === id 
        ? { ...k, ...updates, updatedAt: new Date().toISOString() } 
        : k
    );
    setMediaKits(updated);
    await AsyncStorage.setItem(MEDIA_KITS_KEY, JSON.stringify(updated));
  }, [mediaKits]);

  const addMediaKitSection = useCallback(async (kitId: string, section: MediaKitSection) => {
    const updated = mediaKits.map(k => {
      if (k.id === kitId) {
        return {
          ...k,
          sections: [...k.sections, section],
          updatedAt: new Date().toISOString(),
        };
      }
      return k;
    });
    setMediaKits(updated);
    await AsyncStorage.setItem(MEDIA_KITS_KEY, JSON.stringify(updated));
  }, [mediaKits]);

  const updateMediaKitSection = useCallback(async (
    kitId: string, 
    sectionId: string, 
    updates: Partial<MediaKitSection>
  ) => {
    const updated = mediaKits.map(k => {
      if (k.id === kitId) {
        return {
          ...k,
          sections: k.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s),
          updatedAt: new Date().toISOString(),
        };
      }
      return k;
    });
    setMediaKits(updated);
    await AsyncStorage.setItem(MEDIA_KITS_KEY, JSON.stringify(updated));
  }, [mediaKits]);

  const removeMediaKitSection = useCallback(async (kitId: string, sectionId: string) => {
    const updated = mediaKits.map(k => {
      if (k.id === kitId) {
        return {
          ...k,
          sections: k.sections.filter(s => s.id !== sectionId),
          updatedAt: new Date().toISOString(),
        };
      }
      return k;
    });
    setMediaKits(updated);
    await AsyncStorage.setItem(MEDIA_KITS_KEY, JSON.stringify(updated));
  }, [mediaKits]);

  const deleteMediaKit = useCallback(async (id: string) => {
    const updated = mediaKits.filter(k => k.id !== id);
    setMediaKits(updated);
    await AsyncStorage.setItem(MEDIA_KITS_KEY, JSON.stringify(updated));
  }, [mediaKits]);

  const getMediaKitsByUser = useCallback((userId: string) => {
    return mediaKits.filter(k => k.userId === userId);
  }, [mediaKits]);

  const generateMediaKitPDF = useCallback(async (kitId: string): Promise<string> => {
    console.log('Generating PDF for media kit:', kitId);
    return `https://example.com/media-kits/${kitId}.pdf`;
  }, []);

  const createCaseStudy = useCallback(async (caseStudy: CaseStudy) => {
    const updated = [...caseStudies, caseStudy];
    setCaseStudies(updated);
    await AsyncStorage.setItem(CASE_STUDIES_KEY, JSON.stringify(updated));
  }, [caseStudies]);

  const updateCaseStudy = useCallback(async (id: string, updates: Partial<CaseStudy>) => {
    const updated = caseStudies.map(cs => cs.id === id ? { ...cs, ...updates } : cs);
    setCaseStudies(updated);
    await AsyncStorage.setItem(CASE_STUDIES_KEY, JSON.stringify(updated));
  }, [caseStudies]);

  const deleteCaseStudy = useCallback(async (id: string) => {
    const updated = caseStudies.filter(cs => cs.id !== id);
    setCaseStudies(updated);
    await AsyncStorage.setItem(CASE_STUDIES_KEY, JSON.stringify(updated));
  }, [caseStudies]);

  const getCaseStudiesByUser = useCallback((userId: string, publicOnly: boolean = false) => {
    return caseStudies.filter(cs => 
      cs.userId === userId && (!publicOnly || cs.isPublic)
    );
  }, [caseStudies]);

  return useMemo(() => ({
    mediaAssets,
    mediaKits,
    caseStudies,
    isLoading,
    addMediaAsset,
    updateMediaAsset,
    deleteMediaAsset,
    getAssetsByUser,
    getAssetsByType,
    getAssetsByTags,
    createMediaKit,
    updateMediaKit,
    addMediaKitSection,
    updateMediaKitSection,
    removeMediaKitSection,
    deleteMediaKit,
    getMediaKitsByUser,
    generateMediaKitPDF,
    createCaseStudy,
    updateCaseStudy,
    deleteCaseStudy,
    getCaseStudiesByUser,
  }), [
    mediaAssets,
    mediaKits,
    caseStudies,
    isLoading,
    addMediaAsset,
    updateMediaAsset,
    deleteMediaAsset,
    getAssetsByUser,
    getAssetsByType,
    getAssetsByTags,
    createMediaKit,
    updateMediaKit,
    addMediaKitSection,
    updateMediaKitSection,
    removeMediaKitSection,
    deleteMediaKit,
    getMediaKitsByUser,
    generateMediaKitPDF,
    createCaseStudy,
    updateCaseStudy,
    deleteCaseStudy,
    getCaseStudiesByUser,
  ]);
});
