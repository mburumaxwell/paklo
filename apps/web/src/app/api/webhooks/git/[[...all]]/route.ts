import { Hono, toNextJsHandler } from '@/lib/hono';

import { app as azure } from './azure';
import { app as bitbucket } from './bitbucket';
import { app as gitlab } from './gitlab';

const app = new Hono().basePath('/api/webhooks/git');
app.route('/azure', azure);
app.route('/bitbucket', bitbucket);
app.route('/gitlab', gitlab);

export const { POST, OPTIONS } = toNextJsHandler(app);
