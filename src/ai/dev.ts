import { config } from 'dotenv';
config({ path: '.env.local' });

import '@/ai/flows/send-message.ts';
import '@/ai/flows/start-new-session.ts';
