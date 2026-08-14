using System.ComponentModel.DataAnnotations;

namespace DevFusionAPI.Models.DTOs;

// Store & Seller
public class StoreCreateDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }
}

public class StoreDto
{
    public int Id { get; set; }
    public string SellerId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }
}

public class SellerDashboardDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int LowStockAlertsCount { get; set; }
    public List<ProductDto> TopProducts { get; set; } = new();
    public List<KeyValuePair<string, decimal>> MonthlyRevenue { get; set; } = new();
    public List<ReviewDto> RecentReviews { get; set; } = new();
}

// Category
public class CategoryCreateDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}

// Product & ProductVariant
public class ProductCreateDto
{
    [Required, MaxLength(255)]
    public string Title { get; set; } = string.Empty;
    [Required]
    public decimal Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public int? StoreId { get; set; }
    public int? CategoryId { get; set; }
    public string? Brand { get; set; }
    public string? SKU { get; set; }
    public string? Barcode { get; set; }
    public decimal Discount { get; set; }
    public int Stock { get; set; }
    public decimal Weight { get; set; }
    public string? Dimensions { get; set; }
    public decimal ShippingCharges { get; set; }
}

public class ProductDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public int? StoreId { get; set; }
    public int? CategoryId { get; set; }
    public string? Brand { get; set; }
    public string? SKU { get; set; }
    public string? Barcode { get; set; }
    public decimal Discount { get; set; }
    public int Stock { get; set; }
    public decimal Weight { get; set; }
    public string? Dimensions { get; set; }
    public decimal ShippingCharges { get; set; }
    public double AverageRating { get; set; }
    public List<ProductVariantDto> Variants { get; set; } = new();
}

public class ProductVariantCreateDto
{
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string? Storage { get; set; }
    public string? RAM { get; set; }
    public string? Material { get; set; }
    public string? CustomOptions { get; set; }
    public int Stock { get; set; }
    public decimal Price { get; set; }
    public string? SKU { get; set; }
}

public class ProductVariantDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string? Storage { get; set; }
    public string? RAM { get; set; }
    public string? Material { get; set; }
    public string? CustomOptions { get; set; }
    public int Stock { get; set; }
    public decimal Price { get; set; }
    public string? SKU { get; set; }
}

// Cart & Wishlist
public class CartItemAddDto
{
    [Required]
    public int ProductId { get; set; }
    public int? ProductVariantId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class CartItemUpdateDto
{
    public int Quantity { get; set; }
    public bool SaveForLater { get; set; }
}

public class CartItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductTitle { get; set; } = string.Empty;
    public string ProductImage { get; set; } = string.Empty;
    public decimal ProductPrice { get; set; }
    public decimal ProductDiscount { get; set; }
    public int? ProductVariantId { get; set; }
    public string? VariantInfo { get; set; }
    public int Quantity { get; set; }
    public bool SaveForLater { get; set; }
    public decimal TotalPrice { get; set; }
}

public class CartSummaryDto
{
    public List<CartItemDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal Tax { get; set; }
    public decimal ShippingEstimate { get; set; }
    public decimal FinalTotal { get; set; }
}

public class WishlistAddDto
{
    [Required]
    public int ProductId { get; set; }
}

public class WishlistDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductTitle { get; set; } = string.Empty;
    public decimal ProductPrice { get; set; }
    public string ProductImage { get; set; } = string.Empty;
}

// Coupon
public class CouponCreateDto
{
    [Required, MaxLength(50)]
    public string Code { get; set; } = string.Empty;
    [Required]
    public string DiscountType { get; set; } = "Percentage";
    [Required]
    public decimal Value { get; set; }
    public decimal? MaxDiscount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    [Required]
    public DateTime ExpiryDate { get; set; }
    public int? MaxUsage { get; set; }
    public int? StoreId { get; set; }
    public int? CategoryId { get; set; }
}

public class CouponDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DiscountType { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal? MaxDiscount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public DateTime ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public int? StoreId { get; set; }
    public int? CategoryId { get; set; }
}

// Checkout & Order
public class AddressCreateDto
{
    public string? Label { get; set; }
    [Required]
    public string Type { get; set; } = "both";
    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;
    [Required, MaxLength(20)]
    public string Phone { get; set; } = string.Empty;
    [Required, MaxLength(255)]
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    [Required, MaxLength(100)]
    public string City { get; set; } = string.Empty;
    [Required, MaxLength(100)]
    public string State { get; set; } = string.Empty;
    [Required, MaxLength(20)]
    public string PostalCode { get; set; } = string.Empty;
    [Required, MaxLength(100)]
    public string Country { get; set; } = "India";
    public bool IsDefault { get; set; }
}

public class AddressDto
{
    public string Id { get; set; } = string.Empty;
    public string? Label { get; set; }
    public string Type { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class CheckoutDto
{
    [Required]
    public string ShippingAddressId { get; set; } = string.Empty;
    [Required]
    public string BillingAddressId { get; set; } = string.Empty;
    [Required]
    public string PaymentMethod { get; set; } = "CashOnDelivery";
    public string? CouponCode { get; set; }
}

public class OrderDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingCharges { get; set; }
    public decimal FinalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public AddressDto? ShippingAddress { get; set; }
    public AddressDto? BillingAddress { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
    public string? CourierPartner { get; set; }
    public string? TrackingNumber { get; set; }
    public List<TrackingTimelineEventDto> TrackingTimeline { get; set; } = new();
    public List<OrderItemDto> OrderItems { get; set; } = new();
}

public class TrackingTimelineEventDto
{
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Detail { get; set; }
}

public class OrderItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductTitle { get; set; } = string.Empty;
    public string ProductImage { get; set; } = string.Empty;
    public int? ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public int StoreId { get; set; }
}

public class OrderStatusUpdateDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
    public string? CourierPartner { get; set; }
    public string? TrackingNumber { get; set; }
    public string? EstimatedDeliveryDays { get; set; }
}

// Review
public class ReviewCreateDto
{
    [Required]
    public int ProductId { get; set; }
    [Required, Range(1, 5)]
    public int Rating { get; set; }
    [Required]
    public string ReviewText { get; set; } = string.Empty;
    public string? ImageUrls { get; set; }
}

public class ReviewReplyDto
{
    [Required]
    public string Reply { get; set; } = string.Empty;
}

public class ReviewDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string ReviewText { get; set; } = string.Empty;
    public string? ImageUrls { get; set; }
    public string? SellerReply { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Session Tokens & Google login
public class RefreshTokenRequestDto
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class GoogleLoginDto
{
    [Required]
    public string Token { get; set; } = string.Empty;
}
