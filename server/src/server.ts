import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.warn(`StaffInn server listening on port ${env.PORT}`);
});
