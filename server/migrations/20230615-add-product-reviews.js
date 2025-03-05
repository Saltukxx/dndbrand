/**
 * Migration: Add Product Reviews
 * Version: 20230615
 * 
 * This migration adds product reviews functionality:
 * 1. Creates a new reviews collection
 * 2. Adds review references to products
 * 3. Updates product schema with average rating
 */

module.exports = {
  /**
   * Apply the migration
   * @param {Object} mongoose Mongoose instance
   */
  up: async (mongoose) => {
    const db = mongoose.connection.db;
    
    // 1. Create reviews collection with validation
    await db.createCollection('reviews', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['product', 'customer', 'rating', 'title', 'comment', 'createdAt'],
          properties: {
            product: {
              bsonType: 'objectId',
              description: 'Product ID is required'
            },
            customer: {
              bsonType: 'objectId',
              description: 'Customer ID is required'
            },
            rating: {
              bsonType: 'int',
              minimum: 1,
              maximum: 5,
              description: 'Rating must be an integer between 1 and 5'
            },
            title: {
              bsonType: 'string',
              description: 'Review title is required'
            },
            comment: {
              bsonType: 'string',
              description: 'Review comment is required'
            },
            createdAt: {
              bsonType: 'date',
              description: 'Creation date is required'
            },
            updatedAt: {
              bsonType: 'date'
            },
            isVerifiedPurchase: {
              bsonType: 'bool',
              description: 'Indicates if the review is from a verified purchase'
            },
            helpfulVotes: {
              bsonType: 'int',
              description: 'Number of helpful votes'
            },
            images: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              }
            },
            status: {
              enum: ['pending', 'approved', 'rejected'],
              description: 'Review status'
            }
          }
        }
      }
    });
    
    // 2. Create indexes for reviews collection
    await db.collection('reviews').createIndex({ product: 1 });
    await db.collection('reviews').createIndex({ customer: 1 });
    await db.collection('reviews').createIndex({ rating: -1 });
    await db.collection('reviews').createIndex({ createdAt: -1 });
    await db.collection('reviews').createIndex({ helpfulVotes: -1 });
    
    // 3. Add reviews array and rating fields to products
    await db.collection('products').updateMany(
      {},
      {
        $set: {
          reviews: [],
          ratingAverage: 0,
          ratingCount: 0
        }
      }
    );
    
    // 4. Create indexes for product ratings
    await db.collection('products').createIndex({ ratingAverage: -1 });
    await db.collection('products').createIndex({ ratingCount: -1 });
    
    // 5. Add sample reviews if we have products and customers
    const products = await db.collection('products').find({}).limit(10).toArray();
    const customers = await db.collection('customers').find({}).limit(5).toArray();
    
    if (products.length > 0 && customers.length > 0) {
      const sampleReviews = [];
      const reviewTitles = [
        'Great product!', 
        'Exceeded my expectations', 
        'Good value for money',
        'Highly recommended',
        'Could be better'
      ];
      
      const reviewComments = [
        'I really love this product. The quality is excellent and it arrived quickly.',
        'This product is even better than I expected. Very satisfied with my purchase.',
        'Good product for the price. Not perfect but definitely worth buying.',
        'I would recommend this product to anyone. It\'s exactly what I was looking for.',
        'The product is okay but there\'s room for improvement. I expected better quality.'
      ];
      
      // Create sample reviews
      for (const product of products) {
        // Random number of reviews per product (0-5)
        const numReviews = Math.floor(Math.random() * 6);
        let totalRating = 0;
        
        for (let i = 0; i < numReviews; i++) {
          // Pick a random customer
          const customer = customers[Math.floor(Math.random() * customers.length)];
          
          // Generate random rating (3-5 to keep ratings generally positive)
          const rating = Math.floor(Math.random() * 3) + 3;
          totalRating += rating;
          
          // Random index for title and comment
          const randomIndex = Math.floor(Math.random() * reviewTitles.length);
          
          // Create review
          const review = {
            product: product._id,
            customer: customer._id,
            rating: rating,
            title: reviewTitles[randomIndex],
            comment: reviewComments[randomIndex],
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date in last 30 days
            updatedAt: new Date(),
            isVerifiedPurchase: Math.random() > 0.3, // 70% chance of verified purchase
            helpfulVotes: Math.floor(Math.random() * 10),
            status: 'approved'
          };
          
          sampleReviews.push(review);
        }
        
        // Update product with review stats if it has reviews
        if (numReviews > 0) {
          const ratingAverage = parseFloat((totalRating / numReviews).toFixed(1));
          await db.collection('products').updateOne(
            { _id: product._id },
            {
              $set: {
                ratingAverage: ratingAverage,
                ratingCount: numReviews
              }
            }
          );
        }
      }
      
      // Insert sample reviews if we have any
      if (sampleReviews.length > 0) {
        const result = await db.collection('reviews').insertMany(sampleReviews);
        
        // Update products with review IDs
        for (const review of Object.values(result.insertedIds)) {
          await db.collection('products').updateOne(
            { _id: (await db.collection('reviews').findOne({ _id: review })).product },
            { $push: { reviews: review } }
          );
        }
        
        console.log(`Added ${sampleReviews.length} sample reviews`);
      }
    }
    
    console.log('Added product reviews functionality');
  },

  /**
   * Rollback the migration
   * @param {Object} mongoose Mongoose instance
   */
  down: async (mongoose) => {
    const db = mongoose.connection.db;
    
    // 1. Remove reviews array and rating fields from products
    await db.collection('products').updateMany(
      {},
      {
        $unset: {
          reviews: "",
          ratingAverage: "",
          ratingCount: ""
        }
      }
    );
    
    // 2. Drop indexes for product ratings
    try {
      await db.collection('products').dropIndex({ ratingAverage: -1 });
      await db.collection('products').dropIndex({ ratingCount: -1 });
    } catch (error) {
      console.log('Product rating indexes might not exist, continuing rollback');
    }
    
    // 3. Drop reviews collection
    try {
      await db.collection('reviews').drop();
    } catch (error) {
      console.log('Reviews collection might not exist, continuing rollback');
    }
    
    console.log('Removed product reviews functionality');
  }
}; 