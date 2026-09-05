import { supabase } from './authService.js';

export async function getDeliveryFee() {
  const { data, error } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'delivery_fee')
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch delivery fee:', error);
    return 25; // fallback
  }

  if (data && data.value && data.value[0] !== undefined) {
    return Number(data.value[0]);
  }

  return 25; // fallback
}
