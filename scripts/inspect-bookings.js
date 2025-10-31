/**
 * Diagnostic script to inspect bookings with missing activityId
 * Run with: node scripts/inspect-bookings.js
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

// Booking schema (simplified for inspection)
const bookingSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

// Activity schema
const activitySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Activity = mongoose.model('Activity', activitySchema);

async function inspectBookings() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Connected to MongoDB\n');

    const bookingIds = [
      '68f4f0236f24e2603f9f9dea',
      '68f4ef266f24e2603f9f9de6',
      '68f4ee966f24e2603f9f9de2',
      '68e0f83cc968d2d3b5659024'
    ];

    console.log('📋 Inspecting bookings:\n');
    console.log('='.repeat(80));

    for (const bookingId of bookingIds) {
      try {
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
          console.log(`\n❌ Booking ${bookingId}: NOT FOUND in database`);
          console.log('-'.repeat(80));
          continue;
        }

        // Convert to plain object to inspect
        const bookingObj = booking.toObject();
        const rawActivityId = bookingObj.activityId;
        
        console.log(`\n📦 Booking ID: ${bookingId}`);
        console.log(`   Customer: ${bookingObj.customerName || 'N/A'}`);
        console.log(`   Phone: ${bookingObj.customerPhone || 'N/A'}`);
        console.log(`   Status: ${bookingObj.status || 'N/A'}`);
        console.log(`   Total Amount: ${bookingObj.totalAmount || 'N/A'}`);
        console.log(`   Created At: ${bookingObj.createdAt || 'N/A'}`);
        console.log(`\n   🔑 activityId field:`);
        console.log(`      Type: ${typeof rawActivityId}`);
        console.log(`      Value: ${rawActivityId}`);
        console.log(`      Is null: ${rawActivityId === null}`);
        console.log(`      Is undefined: ${rawActivityId === undefined}`);
        console.log(`      Is empty string: ${rawActivityId === ''}`);
        
        // Check if it's an ObjectId
        if (rawActivityId && mongoose.Types.ObjectId.isValid(rawActivityId)) {
          const activityIdString = rawActivityId.toString();
          console.log(`      ObjectId string: ${activityIdString}`);
          
          // Try to find the activity
          const activity = await Activity.findById(activityIdString);
          if (activity) {
            console.log(`      ✅ Activity EXISTS: ${activity.name || 'N/A'} (${activityIdString})`);
          } else {
            console.log(`      ❌ Activity NOT FOUND: ${activityIdString} (referenced activity does not exist)`);
          }
        } else if (rawActivityId) {
          console.log(`      ⚠️  activityId exists but is NOT a valid ObjectId`);
        } else {
          console.log(`      ❌ activityId is MISSING/null/undefined`);
        }

        // Check what populate would return
        const bookingPopulated = await Booking.findById(bookingId).populate('activityId');
        const populatedActivityId = bookingPopulated?.toObject()?.activityId;
        
        console.log(`\n   🔍 After populate('activityId'):`);
        if (populatedActivityId) {
          if (typeof populatedActivityId === 'object') {
            console.log(`      ✅ Populated successfully: ${populatedActivityId.name || 'N/A'}`);
            console.log(`      Activity ID: ${populatedActivityId._id || 'N/A'}`);
          } else {
            console.log(`      ⚠️  Populated but not an object: ${populatedActivityId}`);
          }
        } else {
          console.log(`      ❌ Populate returned null/undefined`);
        }

        console.log('-'.repeat(80));
      } catch (error) {
        console.error(`\n❌ Error inspecting booking ${bookingId}:`, error.message);
        console.log('-'.repeat(80));
      }
    }

    console.log('\n\n📊 Summary:');
    console.log('This script shows the actual database state of these bookings.');
    console.log('The warning "Booking has no activityId" means the activityId field');
    console.log('is null/undefined after transformDocument, which could happen if:');
    console.log('1. The activityId field is actually null in the database (should not happen)');
    console.log('2. The referenced activity was deleted');
    console.log('3. The activityId is invalid/corrupted');
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspectBookings();

