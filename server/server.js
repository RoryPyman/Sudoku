import 'dotenv/config';
import { connectDB } from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});
