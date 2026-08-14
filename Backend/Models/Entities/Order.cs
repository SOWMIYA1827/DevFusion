using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DevFusionAPI.Models.Entities;

[Table("orders")]
public class Order
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal ShippingCharges { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal FinalAmount { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Placed"; // Placed | PaymentSuccessful | SellerAccepts | Packed | Shipped | OutForDelivery | Delivered | Completed | Cancelled

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = "CashOnDelivery"; // UPI | CreditCard | DebitCard | NetBanking | CashOnDelivery

    [Required]
    [MaxLength(50)]
    public string PaymentStatus { get; set; } = "Pending"; // Pending | Success | Failed

    [Required]
    public string ShippingAddressId { get; set; } = string.Empty;
    public Address? ShippingAddress { get; set; }

    [Required]
    public string BillingAddressId { get; set; } = string.Empty;
    public Address? BillingAddress { get; set; }

    public string? DeliveryPartnerId { get; set; }
    public User? DeliveryPartner { get; set; }

    public DateTime? EstimatedDeliveryDate { get; set; }

    [MaxLength(100)]
    public string? CourierPartner { get; set; }

    [MaxLength(100)]
    public string? TrackingNumber { get; set; }

    public string? TrackingTimeline { get; set; }

    [MaxLength(10)]
    public string? OTP { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
