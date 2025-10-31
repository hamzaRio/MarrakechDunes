/**
 * Cleanup script for orphaned bookings (bookings referencing deleted activities)
 * 
 * This script:
 * 1. Finds all bookings
 * 2. Checks if their referenced activity exists
 * 3. Deletes bookings where the activity no longer exists
 * 
 * Run with: node scripts/cleanup-orphaned-bookings.js [--dry-run]
 */

import mongoose from 'mongoose';
import dotenvFlow from 'dotenv-flow';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables
dotenvFlow.config({ path: projectRoot, silent: true });

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/marrakechdunes';
const DRY_RUN = process.argv.includes('--dry-run');

// Schemas
const bookingSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const activitySchema = new mongoose.Schema({}, { strict: false, timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
const Activity = mongoose.model('Activity', activitySchema);

async function cleanupOrphanedBookings() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Connected to MongoDB\n');

    if (DRY_RUN) {
      console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    // Get all bookings
    console.log('📋 Fetching all bookings...');
    const allBookings = await Booking.find({});
    console.log(`   Found ${allBookings.length} total bookings\n`);

    const orphanedBookings = [];
    const validBookings = [];

    console.log('🔍 Checking each booking for orphaned activity references...\n');

    for (const booking of allBookings) {
      const bookingObj = booking.toObject();
      const bookingId = bookingObj._id.toString();
      const activityId = bookingObj.activityId;

      // Skip if no activityId
      if (!activityId) {
        console.log(`⚠️  Booking ${bookingId}: No activityId field (already orphaned)`);
        orphanedBookings.push({
          bookingId,
          activityId: null,
          customerName: bookingObj.customerName,
          reason: 'No activityId field'
        });
        continue;
      }

      // Check if activity exists
      const activity = await Activity.findById(activityId);
      
      if (!activity) {
        console.log(`❌ Booking ${bookingId}: Activity ${activityId} NOT FOUND`);
        console.log(`   Customer: ${bookingObj.customerName || 'N/A'}`);
        console.log(`   Status: ${bookingObj.status || 'N/A'}`);
        console.log(`   Amount: ${bookingObj.totalAmount || 'N/A'} MAD`);
        console.log(`   Created: ${bookingObj.createdAt || 'N/A'}\n`);

        orphanedBookings.push({
          bookingId,
          activityId: activityId.toString(),
          customerName: bookingObj.customerName,
          status: bookingObj.status,
          totalAmount: bookingObj.totalAmount,
          createdAt: bookingObj.createdAt,
          reason: 'Referenced activity does not exist'
        });
      } else {
        validBookings.push(bookingId);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`✅ Valid bookings: ${validBookings.length}`);
    console.log(`❌ Orphaned bookings: ${orphanedBookings.length}\n`);

    if (orphanedBookings.length === 0) {
      console.log('🎉 No orphaned bookings found! Database is clean.\n');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Orphaned bookings to be deleted:\n');
    orphanedBookings.forEach((booking, index) => {
      console.log(`${index + 1}. Booking ID: ${booking.bookingId}`);
      console.log(`   Customer: ${booking.customerName || 'N/A'}`);
      console.log(`   Referenced Activity ID: ${booking.activityId || 'N/A'}`);
      console.log(`   Status: ${booking.status || 'N/A'}`);
      console.log(`   Amount: ${booking.totalAmount || 'N/A'} MAD`);
      console.log(`   Reason: ${booking.reason}\n`);
    });

    if (DRY_RUN) {
      console.log('⚠️  DRY RUN: Would delete the above bookings, but no changes made.\n');
      console.log('   Run without --dry-run to actually delete them.');
    } else {
      console.log('🗑️  Deleting orphaned bookings...');
      
      const bookingIdsToDelete = orphanedBookings.map(b => b.bookingId);
      const result = await Booking.deleteMany({ _id: { $in: bookingIdsToDelete } });
      
      console.log(`✅ Deleted ${result.deletedCount} orphaned booking(s)\n`);
    }

    console.log('='.repeat(80));
    console.log('✅ Cleanup completed!\n');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedBookings();

