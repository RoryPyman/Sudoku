import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_MS    = 5000;

export async function connectDB() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error('MongoDB connection failed after', MAX_RETRIES, 'attempts — exiting');
        process.exit(1);
      }
      console.warn(`MongoDB connect attempt ${attempt} failed, retrying in ${RETRY_MS / 1000}s…`);
      await new Promise(r => setTimeout(r, RETRY_MS));
    }
  }
}
