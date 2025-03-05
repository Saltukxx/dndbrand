/**
 * Migration: Add Customer Loyalty Points
 * Version: 20230601
 * 
 * This migration adds a loyalty points system to the customer model
 */

module.exports = {
  /**
   * Apply the migration
   * @param {Object} mongoose Mongoose instance
   */
  up: async (mongoose) => {
    const db = mongoose.connection.db;
    
    // 1. Add loyaltyPoints field to all customers with default value of 0
    await db.collection('customers').updateMany(
      {},
      { 
        $set: { 
          loyaltyPoints: 0,
          loyaltyTier: 'bronze'
        } 
      }
    );
    
    // 2. Calculate initial loyalty points based on past orders
    // Get all customers with their orders
    const customers = await db.collection('customers').find({}).toArray();
    
    for (const customer of customers) {
      if (!customer.orders || customer.orders.length === 0) continue;
      
      // Get all orders for this customer
      const orders = await db.collection('orders').find({
        _id: { $in: customer.orders.map(id => mongoose.Types.ObjectId(id)) },
        orderStatus: 'delivered'
      }).toArray();
      
      if (orders.length === 0) continue;
      
      // Calculate total spent
      const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      // Award 1 point per 10 currency units spent
      const pointsToAward = Math.floor(totalSpent / 10);
      
      // Determine loyalty tier
      let loyaltyTier = 'bronze';
      if (pointsToAward >= 500) {
        loyaltyTier = 'platinum';
      } else if (pointsToAward >= 250) {
        loyaltyTier = 'gold';
      } else if (pointsToAward >= 100) {
        loyaltyTier = 'silver';
      }
      
      // Update customer with points and tier
      await db.collection('customers').updateOne(
        { _id: customer._id },
        { 
          $set: { 
            loyaltyPoints: pointsToAward,
            loyaltyTier: loyaltyTier
          } 
        }
      );
    }
    
    // 3. Create index for loyalty points for faster queries
    await db.collection('customers').createIndex({ loyaltyPoints: -1 });
    await db.collection('customers').createIndex({ loyaltyTier: 1 });
    
    console.log('Added loyalty points system to customers');
  },

  /**
   * Rollback the migration
   * @param {Object} mongoose Mongoose instance
   */
  down: async (mongoose) => {
    const db = mongoose.connection.db;
    
    // 1. Remove loyalty fields from all customers
    await db.collection('customers').updateMany(
      {},
      { 
        $unset: { 
          loyaltyPoints: "",
          loyaltyTier: ""
        } 
      }
    );
    
    // 2. Drop indexes
    try {
      await db.collection('customers').dropIndex({ loyaltyPoints: -1 });
      await db.collection('customers').dropIndex({ loyaltyTier: 1 });
    } catch (error) {
      console.log('Indexes might not exist, continuing rollback');
    }
    
    console.log('Removed loyalty points system from customers');
  }
}; 