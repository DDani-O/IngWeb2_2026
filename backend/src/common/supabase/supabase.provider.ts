import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

export const supabaseProvider = {
  provide: SUPABASE_CLIENT,
  useFactory: (configService: ConfigService): SupabaseClient => {
    const url = configService.get<string>('SUPABASE_URL');
    const serviceKey = configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!url || !serviceKey) {
      throw new Error('Supabase environment variables are missing');
    }

    return createClient(url, serviceKey);
  },
  inject: [ConfigService],
};
