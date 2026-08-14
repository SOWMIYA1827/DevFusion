using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DevFusionAPI.Models.Entities;

[Table("products")]
public class Product
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public string Description { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    public string Image { get; set; } = string.Empty;

    // Multi-vendor relations
    public int? StoreId { get; set; }
    public Store? Store { get; set; }

    public int? CategoryId { get; set; }
    public Category? CategoryNavigation { get; set; }

    [MaxLength(100)]
    public string? Brand { get; set; }

    [MaxLength(100)]
    public string? SKU { get; set; }

    [MaxLength(100)]
    public string? Barcode { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Discount { get; set; } = 0;

    public int Stock { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Weight { get; set; } = 0;

    [MaxLength(100)]
    public string? Dimensions { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ShippingCharges { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
