const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, './config/.env') });

console.log('Connecting to MongoDB Atlas...');

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas!');
    
    // Get database connection
    const db = mongoose.connection;
    
    // List all collections
    const collections = await db.db.listCollections().toArray();
    console.log('\nCollections in database:');
    for (const collection of collections) {
      console.log(`- ${collection.name}`);
    }
    
    // Get counts for each collection
    console.log('\nDocument counts:');
    for (const collection of collections) {
      const count = await db.db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }
    
    // Sample data from each collection
    console.log('\nSample data:');
    for (const collection of collections) {
      const sample = await db.db.collection(collection.name).findOne({});
      if (sample) {
        console.log(`\n${collection.name} sample:`);
        // Print a simplified version of the document
        const simplifiedSample = {};
        Object.keys(sample).forEach(key => {
          if (key === '_id') {
            simplifiedSample[key] = sample[key].toString();
          } else if (typeof sample[key] === 'object' && sample[key] !== null) {
            simplifiedSample[key] = Array.isArray(sample[key]) 
              ? `Array with ${sample[key].length} items` 
              : 'Object';
          } else {
            simplifiedSample[key] = sample[key];
          }
        });
        console.log(simplifiedSample);
      }
    }
    
    console.log('\nDatabase check completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  }); 