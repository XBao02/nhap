// ProductReviewService.ts
import { BaseService } from '../../../database';
export interface ProductReview {
  id?: number;
  product_id: number;
  store_id: string;
  customer_name: string;
  customer_email?: string;
  rating: number;
  title?: string;
  content?: string;
  is_verified?: boolean;
  is_approved?: boolean;
  created_at?: string;
}

export class ProductReviewService extends BaseService {
  constructor() {
    super('product', 'product_reviews');
  }

  /**
   * Specific validation for ProductReview
   * Xác thực các kiểu dữ liệu đảm bảo cho bảng product_reviews nếu truyền vào
   */
  protected _validateData(data: any): void {
    super._validateData(data);

    if (data.product_id && typeof data.product_id !== 'number') {
      throw new Error('Product ID is required and must be a number');
    }

    if (data.store_id && typeof data.store_id !== 'string') {
      throw new Error('Store ID is required and must be a string');
    }

    if (data.customer_name && typeof data.customer_name !== 'string') {
      throw new Error('Customer name is required and must be a string');
    }

    if (data.rating && (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating is required and must be between 1 and 5');
    }

    if (data.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
      throw new Error('Invalid email format');
    }
  }

  // ProductReview-specific methods
  async findByProductId(productId: number): Promise<ProductReview[]> {
    return await this.findAll({ product_id: productId });
  }

  async findByStoreId(storeId: string): Promise<ProductReview[]> {
    return await this.findAll({ store_id: storeId });
  }

  async findByCustomerEmail(email: string): Promise<ProductReview[]> {
    return await this.findAll({ customer_email: email });
  }

  async findByRating(productId: number, rating: number): Promise<ProductReview[]> {
    return await this.findAll({ 
      product_id: productId, 
      rating: rating 
    });
  }

  async findApprovedReviews(productId: number): Promise<ProductReview[]> {
    return await this.findAll({ 
      product_id: productId, 
      is_approved: true 
    });
  }

  async findPendingReviews(storeId: string): Promise<ProductReview[]> {
    return await this.findAll({ 
      store_id: storeId, 
      is_approved: false 
    });
  }

  async findVerifiedReviews(productId: number): Promise<ProductReview[]> {
    return await this.findAll({ 
      product_id: productId, 
      is_verified: true 
    });
  }

  async findUnverifiedReviews(productId: number): Promise<ProductReview[]> {
    return await this.findAll({ 
      product_id: productId, 
      is_verified: false 
    });
  }

  // Get reviews by rating range
  async findReviewsByRatingRange(productId: number, minRating: number, maxRating: number): Promise<ProductReview[]> {
    const allReviews = await this.findByProductId(productId);
    return allReviews.filter(review => 
      review.rating >= minRating && review.rating <= maxRating
    );
  }

  // Get recent reviews
  async findRecentReviews(productId: number, days: number = 30): Promise<ProductReview[]> {
    const allReviews = await this.findByProductId(productId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return allReviews.filter(review => {
      if (!review.created_at) return false;
      const reviewDate = new Date(review.created_at);
      return reviewDate >= cutoffDate;
    }).sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }

  // Status management
  async approveReview(id: number): Promise<ProductReview | null> {
    return await this.update(id, { is_approved: true });
  }

  async rejectReview(id: number): Promise<ProductReview | null> {
    return await this.update(id, { is_approved: false });
  }

  async verifyReview(id: number): Promise<ProductReview | null> {
    return await this.update(id, { is_verified: true });
  }

  async unverifyReview(id: number): Promise<ProductReview | null> {
    return await this.update(id, { is_verified: false });
  }

  // Calculate review statistics
  async getReviewStatistics(productId: number): Promise<any> {
    const allReviews = await this.findByProductId(productId);
    const approvedReviews = allReviews.filter(review => review.is_approved);
    const verifiedReviews = allReviews.filter(review => review.is_verified);
    
    if (approvedReviews.length === 0) {
      return {
        total: allReviews.length,
        approved: 0,
        pending: allReviews.length,
        verified: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / approvedReviews.length;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approvedReviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      total: allReviews.length,
      approved: approvedReviews.length,
      pending: allReviews.length - approvedReviews.length,
      verified: verifiedReviews.length,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution
    };
  }

  // Get top rated products in store
  async getTopRatedProducts(storeId: string, limit: number = 10): Promise<any[]> {
    const allReviews = await this.findByStoreId(storeId);
    const approvedReviews = allReviews.filter(review => review.is_approved);
    
    const productRatings: { [key: number]: { total: number; count: number; average: number } } = {};
    
    approvedReviews.forEach(review => {
      if (!productRatings[review.product_id]) {
        productRatings[review.product_id] = { total: 0, count: 0, average: 0 };
      }
      productRatings[review.product_id].total += review.rating;
      productRatings[review.product_id].count++;
    });

    const productAverages = Object.entries(productRatings).map(([productId, data]) => ({
      product_id: parseInt(productId),
      average_rating: Math.round((data.total / data.count) * 10) / 10,
      review_count: data.count
    }));

    return productAverages
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, limit);
  }

  // Check if customer has already reviewed this product
  async hasCustomerReviewed(productId: number, customerEmail: string): Promise<boolean> {
    const reviews = await this.findAll({ 
      product_id: productId, 
      customer_email: customerEmail 
    });
    return reviews.length > 0;
  }

  // Get customer's review for a product
  async getCustomerReview(productId: number, customerEmail: string): Promise<ProductReview | null> {
    const reviews = await this.findAll({ 
      product_id: productId, 
      customer_email: customerEmail 
    });
    return reviews.length > 0 ? reviews[0] : null;
  }

  // Search reviews by content
  async searchReviews(storeId: string, searchTerm: string): Promise<ProductReview[]> {
    const allReviews = await this.findByStoreId(storeId);
    const term = searchTerm.toLowerCase();
    
    return allReviews.filter(review => 
      (review.title && review.title.toLowerCase().includes(term)) ||
      (review.content && review.content.toLowerCase().includes(term)) ||
      review.customer_name.toLowerCase().includes(term)
    );
  }

  // Override create to add timestamps and defaults
  async create(data: ProductReview): Promise<ProductReview> {
    const reviewData = {
      ...data,
      is_verified: data.is_verified !== undefined ? data.is_verified : false,
      is_approved: data.is_approved !== undefined ? data.is_approved : false,
      created_at: new Date().toISOString(),
    };
    return await super.create(reviewData);
  }

  // Bulk operations
  async bulkApprove(ids: number[]): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const id of ids) {
        await this.approveReview(id);
      }
      return true;
    });
  }

  async bulkReject(ids: number[]): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const id of ids) {
        await this.rejectReview(id);
      }
      return true;
    });
  }

  async bulkVerify(ids: number[]): Promise<boolean> {
    return await this.executeTransaction(async () => {
      for (const id of ids) {
        await this.verifyReview(id);
      }
      return true;
    });
  }

  async bulkDeleteByProductId(productId: number): Promise<boolean> {
    const reviews = await this.findByProductId(productId);
    return await this.executeTransaction(async () => {
      for (const review of reviews) {
        await this.delete(review.id!);
      }
      return true;
    });
  }

  // Moderation helpers
  async flagReview(id: number): Promise<ProductReview | null> {
    // This would typically involve adding a 'is_flagged' field to the schema
    // For now, we'll reject the review as a simple moderation action
    return await this.rejectReview(id);
  }

  async getReviewsNeedingModeration(storeId: string): Promise<ProductReview[]> {
    return await this.findPendingReviews(storeId);
  }
}

// Export singleton instance
export const productReviewService = new ProductReviewService();
export default productReviewService;