import { useState } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CheckInOutRecord {
  id: string;
  booking_id: string;
  vehicle_id: string;
  lessor_id: string;
  renter_id: string | null;
  record_type: 'check_in' | 'check_out';
  scanned_plate: string | null;
  expected_plate: string;
  plate_verified: boolean;
  dashboard_image_url: string | null;
  ai_detected_odometer: number | null;
  ai_detected_fuel_percent: number | null;
  confirmed_odometer: number | null;
  confirmed_fuel_percent: number | null;
  was_manually_corrected: boolean;
  requires_review: boolean;
  latitude: number | null;
  longitude: number | null;
  location_verified: boolean;
  km_driven: number | null;
  km_overage: number | null;
  km_overage_fee: number | null;
  fuel_fee: number | null;
  total_extra_charges: number | null;
  settlement_status: string;
  created_at: string;
}

interface DashboardAnalysis {
  odometer: number | null;
  fuel_percent: number | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

export const useCheckInOut = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const analyzeDashboard = async (imageBase64: string): Promise<DashboardAnalysis | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-dashboard', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('Dashboard analysis error:', error);
        toast.error('Kunne ikke analysere dashboard-billede');
        return null;
      }

      return {
        odometer: data.odometer,
        fuel_percent: data.fuel_percent,
        confidence: data.confidence,
        notes: data.notes
      };
    } catch (err) {
      console.error('Error analyzing dashboard:', err);
      toast.error('Fejl ved analyse af dashboard');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const uploadImage = async (
    bookingId: string,
    imageBlob: Blob,
    type: 'plate' | 'dashboard',
    recordType: 'check_in' | 'check_out'
  ): Promise<string | null> => {
    try {
      const fileName = `${bookingId}/${recordType}_${type}_${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('checkinout-images')
        .upload(fileName, imageBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('checkinout-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      return null;
    }
  };

  const verifyPlate = (scannedPlate: string, expectedPlate: string): boolean => {
    const normalize = (plate: string) => plate.replace(/[\s-]/g, '').toUpperCase();
    return normalize(scannedPlate) === normalize(expectedPlate);
  };

  const calculateDistance = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const createCheckInRecord = async (params: {
    bookingId: string;
    vehicleId: string;
    lessorId: string;
    renterId?: string;
    expectedPlate: string;
    scannedPlate?: string;
    plateImageUrl?: string;
    dashboardImageUrl?: string;
    aiOdometer?: number;
    aiFuelPercent?: number;
    confirmedOdometer: number;
    confirmedFuelPercent: number;
    wasManuallyAdjusted: boolean;
    latitude?: number;
    longitude?: number;
    expectedLatitude?: number;
    expectedLongitude?: number;
  }): Promise<CheckInOutRecord | null> => {
    if (!user) {
      toast.error('Du skal være logget ind');
      return null;
    }
    setIsSubmitting(true);

    try {
      let locationDistance = null;
      let locationVerified = true;

      if (params.latitude && params.longitude && params.expectedLatitude && params.expectedLongitude) {
        locationDistance = calculateDistance(
          params.latitude, params.longitude,
          params.expectedLatitude, params.expectedLongitude
        );
        locationVerified = locationDistance <= 50; // 50km tolerance
      }

      // Use the current authenticated user's ID as lessor_id if they own the booking
      const effectiveLessorId = user.id;

      const { data, error } = await supabase
        .from('check_in_out_records')
        .insert({
          booking_id: params.bookingId,
          vehicle_id: params.vehicleId,
          lessor_id: effectiveLessorId,
          renter_id: params.renterId || null,
          record_type: 'check_in',
          expected_plate: params.expectedPlate,
          scanned_plate: params.scannedPlate || null,
          plate_verified: params.scannedPlate ? verifyPlate(params.scannedPlate, params.expectedPlate) : false,
          plate_scan_image_url: params.plateImageUrl || null,
          dashboard_image_url: params.dashboardImageUrl || null,
          ai_detected_odometer: params.aiOdometer || null,
          ai_detected_fuel_percent: params.aiFuelPercent || null,
          confirmed_odometer: params.confirmedOdometer,
          confirmed_fuel_percent: params.confirmedFuelPercent,
          was_manually_corrected: params.wasManuallyAdjusted,
          requires_review: params.wasManuallyAdjusted,
          latitude: params.latitude || null,
          longitude: params.longitude || null,
          expected_latitude: params.expectedLatitude || null,
          expected_longitude: params.expectedLongitude || null,
          location_distance_km: locationDistance,
          location_verified: locationVerified,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating check-in:', error);
        toast.error('Kunne ikke gemme check-in: ' + error.message);
        return null;
      }

      // Send check-in email to renter
      try {
        await supabase.functions.invoke('send-checkinout-email', {
          body: {
            bookingId: params.bookingId,
            recordType: 'check_in',
            odometerReading: params.confirmedOdometer,
            fuelPercent: params.confirmedFuelPercent,
          }
        });
        console.log('Check-in email sent');
      } catch (emailError) {
        console.error('Failed to send check-in email:', emailError);
      }

      toast.success('Check-in gennemført!');
      return data as CheckInOutRecord;
    } catch (err) {
      console.error('Error in createCheckInRecord:', err);
      toast.error('Fejl ved check-in');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const createCheckOutRecord = async (params: {
    bookingId: string;
    vehicleId: string;
    lessorId: string;
    renterId?: string;
    expectedPlate: string;
    scannedPlate?: string;
    plateImageUrl?: string;
    dashboardImageUrl?: string;
    aiOdometer?: number;
    aiFuelPercent?: number;
    confirmedOdometer: number;
    confirmedFuelPercent: number;
    wasManuallyAdjusted: boolean;
    latitude?: number;
    longitude?: number;
    expectedLatitude?: number;
    expectedLongitude?: number;
    // Settlement data from check-in
    checkInOdometer: number;
    checkInFuelPercent: number;
    includedKm: number;
    extraKmRate: number;
    fuelTankSize: number;
    fuelPricePerLiter: number;
    fuelMissingFee: number;
  }): Promise<CheckInOutRecord | null> => {
    if (!user) {
      toast.error('Du skal være logget ind');
      return null;
    }
    setIsSubmitting(true);
    try {
      let locationDistance = null;
      let locationVerified = true;

      if (params.latitude && params.longitude && params.expectedLatitude && params.expectedLongitude) {
        locationDistance = calculateDistance(
          params.latitude, params.longitude,
          params.expectedLatitude, params.expectedLongitude
        );
        locationVerified = locationDistance <= 50;
      }

      // Calculate settlement
      const kmDriven = params.confirmedOdometer - params.checkInOdometer;
      const kmOverage = Math.max(0, kmDriven - params.includedKm);
      const kmOverageFee = kmOverage * params.extraKmRate;

      // Fuel calculation (with 5% tolerance)
      const fuelDiff = params.checkInFuelPercent - params.confirmedFuelPercent;
      const fuelTolerance = 5;
      let fuelFee = 0;
      let fuelMissingLiters = 0;

      if (fuelDiff > fuelTolerance) {
        fuelMissingLiters = (fuelDiff / 100) * params.fuelTankSize;
        fuelFee = (fuelMissingLiters * params.fuelPricePerLiter) + params.fuelMissingFee;
      }

      const totalExtraCharges = kmOverageFee + fuelFee;

      // Use the current authenticated user's ID as lessor_id if they own the booking
      const effectiveLessorId = user.id;

      const { data, error } = await supabase
        .from('check_in_out_records')
        .insert({
          booking_id: params.bookingId,
          vehicle_id: params.vehicleId,
          lessor_id: effectiveLessorId,
          renter_id: params.renterId || null,
          record_type: 'check_out',
          expected_plate: params.expectedPlate,
          scanned_plate: params.scannedPlate || null,
          plate_verified: params.scannedPlate ? verifyPlate(params.scannedPlate, params.expectedPlate) : false,
          plate_scan_image_url: params.plateImageUrl || null,
          dashboard_image_url: params.dashboardImageUrl || null,
          ai_detected_odometer: params.aiOdometer || null,
          ai_detected_fuel_percent: params.aiFuelPercent || null,
          confirmed_odometer: params.confirmedOdometer,
          confirmed_fuel_percent: params.confirmedFuelPercent,
          was_manually_corrected: params.wasManuallyAdjusted,
          requires_review: params.wasManuallyAdjusted || !locationVerified,
          latitude: params.latitude || null,
          longitude: params.longitude || null,
          expected_latitude: params.expectedLatitude || null,
          expected_longitude: params.expectedLongitude || null,
          location_distance_km: locationDistance,
          location_verified: locationVerified,
          // Settlement data
          km_driven: kmDriven,
          km_included: params.includedKm,
          km_overage: kmOverage,
          km_overage_rate: params.extraKmRate,
          km_overage_fee: kmOverageFee,
          fuel_start_percent: params.checkInFuelPercent,
          fuel_end_percent: params.confirmedFuelPercent,
          fuel_missing_liters: fuelMissingLiters,
          fuel_fee: fuelFee,
          total_extra_charges: totalExtraCharges,
          settlement_status: totalExtraCharges > 0 ? 'calculated' : 'approved',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating check-out:', error);
        toast.error('Kunne ikke gemme check-out: ' + error.message);
        return null;
      }

      // Send check-out email to renter
      try {
        await supabase.functions.invoke('send-checkinout-email', {
          body: {
            bookingId: params.bookingId,
            recordType: 'check_out',
            odometerReading: params.confirmedOdometer,
            fuelPercent: params.confirmedFuelPercent,
          }
        });
        console.log('Check-out email sent');
      } catch (emailError) {
        console.error('Failed to send check-out email:', emailError);
      }

      // Log extra charges for manual settlement (generateSettlementInvoice not available)
      if (totalExtraCharges > 0) {
        console.log('Extra charges to be settled:', {
          bookingId: params.bookingId,
          kmOverage,
          kmOverageFee,
          fuelFee,
          totalExtraCharges,
        });
        toast.success(`Check-out gennemført! Ekstra opkrævning: ${totalExtraCharges.toFixed(2)} kr.`);
      } else {
        toast.success('Check-out gennemført!');
      }

      return data as CheckInOutRecord;
    } catch (err) {
      console.error('Error in createCheckOutRecord:', err);
      toast.error('Fejl ved check-out');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCheckInRecord = async (bookingId: string): Promise<CheckInOutRecord | null> => {
    try {
      const { data, error } = await supabase
        .from('check_in_out_records')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('record_type', 'check_in')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        console.error('Error fetching check-in:', error);
        return null;
      }

      return data as CheckInOutRecord;
    } catch (err) {
      console.error('Error in getCheckInRecord:', err);
      return null;
    }
  };

  const getCheckOutRecord = async (bookingId: string): Promise<CheckInOutRecord | null> => {
    try {
      const { data, error } = await supabase
        .from('check_in_out_records')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('record_type', 'check_out')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching check-out:', error);
        return null;
      }

      return data as CheckInOutRecord;
    } catch (err) {
      console.error('Error in getCheckOutRecord:', err);
      return null;
    }
  };

  return {
    isAnalyzing,
    isSubmitting,
    analyzeDashboard,
    uploadImage,
    verifyPlate,
    createCheckInRecord,
    createCheckOutRecord,
    getCheckInRecord,
    getCheckOutRecord,
  };
};
