/**
 * Script to upload placeholder image directly to database
 * This is a one-time script to ensure the placeholder image is available from the server
 * 
 * Instructions:
 * 1. Make sure MongoDB is installed and running
 * 2. Run this script with: node upload-placeholder-to-db.js
 */

const fs = require('fs');
const path = require('path');
const { MongoClient, GridFSBucket } = require('mongodb');

// MongoDB connection settings
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dndbrand';
const DB_NAME = process.env.DB_NAME || 'dndbrand';

// Path to the placeholder image
const PLACEHOLDER_IMAGE_PATH = path.join(__dirname, 'public', 'images', 'placeholder-product.jpg');

// Filename to use in GridFS (must be consistent for retrieval)
const PLACEHOLDER_FILENAME = 'placeholder-product.jpg';

/**
 * Upload placeholder image to GridFS
 */
async function uploadPlaceholderToGridFS() {
  let client;

  try {
    // Check if file exists
    if (!fs.existsSync(PLACEHOLDER_IMAGE_PATH)) {
      throw new Error(`Placeholder image not found at ${PLACEHOLDER_IMAGE_PATH}`);
    }

    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    
    // Create GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: 'images'
    });

    // Check if file already exists in GridFS
    const existingFiles = await db.collection('images.files').find({ 
      filename: PLACEHOLDER_FILENAME 
    }).toArray();

    if (existingFiles.length > 0) {
      console.log('Placeholder image already exists in GridFS, deleting first...');
      
      // Delete existing file first
      for (const file of existingFiles) {
        await bucket.delete(file._id);
      }
    }

    console.log('Uploading placeholder image to GridFS...');
    
    // Create upload stream
    const uploadStream = bucket.openUploadStream(PLACEHOLDER_FILENAME, {
      metadata: {
        contentType: 'image/jpeg',
        isPlaceholder: true,
        uploadDate: new Date()
      }
    });

    // Create read stream from file
    const readStream = fs.createReadStream(PLACEHOLDER_IMAGE_PATH);
    
    // Wait for upload to complete
    const uploadPromise = new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
      readStream.on('error', reject);
    });

    // Start the upload
    readStream.pipe(uploadStream);
    
    // Wait for upload to complete
    await uploadPromise;
    
    console.log('Placeholder image uploaded successfully to GridFS');
    console.log(`File ID: ${uploadStream.id}`);
    console.log(`Access URL: /api/images/${PLACEHOLDER_FILENAME}`);

    // Update image settings collection (if it exists)
    try {
      await db.collection('settings').updateOne(
        { key: 'defaultPlaceholderImage' },
        { 
          $set: { 
            key: 'defaultPlaceholderImage', 
            value: PLACEHOLDER_FILENAME,
            path: `/api/images/${PLACEHOLDER_FILENAME}`,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log('Updated settings collection with placeholder image reference');
    } catch (error) {
      console.warn('Could not update settings collection, this is not critical:', error.message);
    }

    return uploadStream.id;
  } catch (error) {
    console.error('Error uploading placeholder image to GridFS:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

/**
 * Alternative approach: Upload to images collection directly (if not using GridFS)
 */
async function uploadPlaceholderToImagesCollection() {
  let client;

  try {
    // Check if file exists
    if (!fs.existsSync(PLACEHOLDER_IMAGE_PATH)) {
      throw new Error(`Placeholder image not found at ${PLACEHOLDER_IMAGE_PATH}`);
    }

    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    
    // Read file as binary
    const imageBuffer = fs.readFileSync(PLACEHOLDER_IMAGE_PATH);
    
    // Convert to Base64 for storage
    const base64Image = imageBuffer.toString('base64');
    
    // Check if placeholder already exists
    const existingImage = await db.collection('images').findOne({ 
      filename: PLACEHOLDER_FILENAME 
    });
    
    if (existingImage) {
      console.log('Placeholder image already exists in images collection, updating...');
      
      await db.collection('images').updateOne(
        { filename: PLACEHOLDER_FILENAME },
        { 
          $set: { 
            data: base64Image,
            contentType: 'image/jpeg',
            isPlaceholder: true,
            updatedAt: new Date()
          }
        }
      );
    } else {
      console.log('Inserting new placeholder image to images collection...');
      
      await db.collection('images').insertOne({
        filename: PLACEHOLDER_FILENAME,
        data: base64Image,
        contentType: 'image/jpeg',
        isPlaceholder: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('Placeholder image uploaded successfully to images collection');
    console.log(`Access URL: /api/images/${PLACEHOLDER_FILENAME}`);
    
    // Update image settings collection (if it exists)
    try {
      await db.collection('settings').updateOne(
        { key: 'defaultPlaceholderImage' },
        { 
          $set: { 
            key: 'defaultPlaceholderImage', 
            value: PLACEHOLDER_FILENAME,
            path: `/api/images/${PLACEHOLDER_FILENAME}`,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log('Updated settings collection with placeholder image reference');
    } catch (error) {
      console.warn('Could not update settings collection, this is not critical:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error uploading placeholder image to images collection:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Try both methods sequentially (GridFS first, then direct collection if GridFS fails)
async function uploadPlaceholder() {
  try {
    // Try GridFS upload first
    await uploadPlaceholderToGridFS();
    console.log('----- PLACEHOLDER IMAGE UPLOAD SUCCESSFUL -----');
    console.log('The placeholder image has been uploaded to the database.');
    console.log('It should now be available at: https://dndbrand-server.onrender.com/api/images/placeholder-product.jpg');
  } catch (gridFsError) {
    console.warn('GridFS upload failed, trying direct collection upload...', gridFsError.message);
    
    try {
      // Fall back to direct collection upload
      await uploadPlaceholderToImagesCollection();
      console.log('----- PLACEHOLDER IMAGE UPLOAD SUCCESSFUL (DIRECT COLLECTION) -----');
      console.log('The placeholder image has been uploaded to the database using direct collection method.');
      console.log('It should now be available at: https://dndbrand-server.onrender.com/api/images/placeholder-product.jpg');
    } catch (collectionError) {
      console.error('All upload methods failed:');
      console.error('GridFS Error:', gridFsError.message);
      console.error('Collection Error:', collectionError.message);
      process.exit(1);
    }
  }
}

// Run the upload process
uploadPlaceholder().catch(error => {
  console.error('Unhandled error during upload:', error);
  process.exit(1);
}).then(() => {
  process.exit(0);
}); 