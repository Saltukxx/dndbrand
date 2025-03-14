/**
 * D&D Brand E-commerce - Account API Functions
 * Handles API calls for account-related functionality
 */

class AccountAPI {
  constructor() {
    this.baseUrl = '/api';
    this.token = localStorage.getItem('token');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Get auth token
  getToken() {
    return this.token;
  }

  // Clear auth token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Get headers with auth token
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Get user ID from token
  getUserId() {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user).id;
    }
    return null;
  }

  // Get customer data
  async getCustomer() {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.baseUrl}/customers/${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching customer data:', error);
      throw error;
    }
  }

  // Update customer profile
  async updateProfile(profileData) {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.baseUrl}/customers/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.baseUrl}/customers/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      return await response.json();
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Get customer orders
  async getOrders() {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.baseUrl}/orders/customer/${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get order details
  async getOrderDetails(orderId) {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }

  // Get customer addresses
  async getAddresses() {
    try {
      const customer = await this.getCustomer();
      return customer.addresses || [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  }

  // Add new address
  async addAddress(addressData) {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.baseUrl}/customers/${userId}/addresses`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        throw new Error('Failed to add address');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  // Update address
  async updateAddress(addressId, addressData) {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.baseUrl}/customers/${userId}/addresses/${addressId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        throw new Error('Failed to update address');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  // Delete address
  async deleteAddress(addressId) {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.baseUrl}/customers/${userId}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  // Get wishlist
  async getWishlist() {
    try {
      const customer = await this.getCustomer();
      return customer.wishlist || [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  }

  // Add product to wishlist
  async addToWishlist(productId) {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.baseUrl}/customers/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: 'addToWishlist',
          productId: productId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add product to wishlist');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  // Remove product from wishlist
  async removeFromWishlist(productId) {
    try {
      const userId = this.getUserId();
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch(`${this.baseUrl}/customers/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: 'removeFromWishlist',
          productId: productId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove product from wishlist');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }
}

// Create and export instance
const accountAPI = new AccountAPI(); 