import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseConfigService } from '../../modules/db-management/db-config.service';
import { wrapSupabaseClient } from '../database/database-wrappers';

export class SupabaseManager {
  private static client: SupabaseClient | null = null;

  static async getClient(): Promise<SupabaseClient> {
    if (this.client) return this.client;
    
    const config = await DatabaseConfigService.getConfig("supabase");
    if (!config || !config.projectUrl || !config.serviceRoleKey) {
       throw new Error("Supabase is not configured properly in platform settings. Missing projectUrl or serviceRoleKey.");
    }
    
    const WebSocket = require('ws');
    const rawClient = createClient(config.projectUrl, config.serviceRoleKey, {
      global: {
        headers: { 'x-my-custom-header': 'clothify-backend' }
      },
      auth: {
        persistSession: false
      },
      realtime: {
        transport: WebSocket
      }
    });
    
    this.client = wrapSupabaseClient(rawClient);
    return this.client as SupabaseClient;
  }
  
  static resetClient() {
    this.client = null;
  }
}
