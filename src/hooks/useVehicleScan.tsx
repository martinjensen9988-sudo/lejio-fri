import { useState } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface ScanResult {
  area: string;
  areaLabel: string;
  imageUrl: string;
  damages: DetectedDamage[];
  scannedAt: string;
}

interface DetectedDamage {
  id: string;
  position: string;
  severity: 'minor' | 'moderate' | 'severe';
  damageType: string;
  description: string;
  confidence: number;
  imageUrl?: string;
}

interface CreateScanSessionParams {
  bookingId: string;
  vehicleId: string;
  lessorId: string;
  renterId?: string;
  scanType: 'check_in' | 'check_out';
}

interface VehicleScanSession {
  id: string;
  booking_id: string;
  vehicle_id: string;
  scan_type: string;
  total_areas_scanned: number;
  total_damages_found: number;
  has_severe_damage: boolean;
  completed_at: string | null;
  created_at: string;
}

export const useVehicleScan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const uploadScanImage = async (
    sessionId: string,
    imageBase64: string,
    areaCode: string
  ): Promise<string | null> => {
    try {
      // Convert base64 to blob
      const base64Data = imageBase64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const fileName = `${sessionId}/${areaCode}-${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('vehicle-scans')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-scans')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  const createScanSession = async (params: CreateScanSessionParams): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('vehicle_scan_sessions')
        .insert({
          booking_id: params.bookingId,
          vehicle_id: params.vehicleId,
          lessor_id: params.lessorId,
          renter_id: params.renterId,
          scan_type: params.scanType,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating scan session:', error);
      return null;
    }
  };

  const saveScanResults = async (
    sessionId: string,
    results: ScanResult[]
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      let totalDamages = 0;
      let hasSevere = false;

      for (const result of results) {
        // Upload area image to storage
        const imageUrl = await uploadScanImage(sessionId, result.imageUrl, result.area);

        // Save scan area
        const { data: areaData, error: areaError } = await supabase
          .from('vehicle_scan_areas')
          .insert({
            scan_session_id: sessionId,
            area_code: result.area,
            area_label: result.areaLabel,
            image_url: imageUrl,
            scanned_at: result.scannedAt,
          })
          .select('id')
          .single();

        if (areaError) throw areaError;

        // Save damages for this area
        if (result.damages.length > 0) {
          const damageInserts = result.damages.map(damage => ({
            scan_area_id: areaData.id,
            scan_session_id: sessionId,
            position: damage.position,
            severity: damage.severity,
            damage_type: damage.damageType,
            description: damage.description,
            confidence: damage.confidence,
            image_url: imageUrl, // Use area image for now
          }));

          const { error: damageError } = await supabase
            .from('vehicle_scan_damages')
            .insert(damageInserts);

          if (damageError) throw damageError;

          totalDamages += result.damages.length;
          if (result.damages.some(d => d.severity === 'severe')) {
            hasSevere = true;
          }
        }
      }

      // Update session with final stats
      const { error: updateError } = await supabase
        .from('vehicle_scan_sessions')
        .update({
          total_areas_scanned: results.length,
          total_damages_found: totalDamages,
          has_severe_damage: hasSevere,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error saving scan results:', error);
      toast.error('Kunne ikke gemme scanningsresultater');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const getScanSessionsForBooking = async (bookingId: string): Promise<VehicleScanSession[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicle_scan_sessions')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scan sessions:', error);
      return [];
    }
  };

  const getScanSessionDetails = async (sessionId: string) => {
    try {
      const [sessionResult, areasResult, damagesResult] = await Promise.all([
        supabase
          .from('vehicle_scan_sessions')
          .select('*')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('vehicle_scan_areas')
          .select('*')
          .eq('scan_session_id', sessionId)
          .order('scanned_at', { ascending: true }),
        supabase
          .from('vehicle_scan_damages')
          .select('*')
          .eq('scan_session_id', sessionId),
      ]);

      if (sessionResult.error) throw sessionResult.error;

      return {
        session: sessionResult.data,
        areas: areasResult.data || [],
        damages: damagesResult.data || [],
      };
    } catch (error) {
      console.error('Error fetching session details:', error);
      return null;
    }
  };

  const getScanDamagesForVehicle = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_scan_sessions')
        .select(`
          *,
          vehicle_scan_damages (*)
        `)
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicle damages:', error);
      return [];
    }
  };

  return {
    isLoading,
    isSaving,
    createScanSession,
    saveScanResults,
    uploadScanImage,
    getScanSessionsForBooking,
    getScanSessionDetails,
    getScanDamagesForVehicle,
  };
};
