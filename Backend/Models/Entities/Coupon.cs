using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DevFusionAPI.Models.Entities;

[Table("coupons")]
public class Coupon
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string DiscountType { get; set; } = "Percentage"; // Flat | Percentage | FreeShipping | FirstPurchaseOffer | CategoryDiscount

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Value { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? MaxDiscount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? MinOrderAmount { get; set; }

    [Required]
    public DateTime ExpiryDate { get; set; }

    public int? MaxUsage { get; set; }
    public int UsageCount { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
