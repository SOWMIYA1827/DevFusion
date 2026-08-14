using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DevFusionAPI.Models.Entities;

[Table("order_items")]
public class OrderItem
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public string OrderId { get; set; } = string.Empty;
    public Order? Order { get; set; }

    [Required]
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int? ProductVariantId { get; set; }
    public ProductVariant? ProductVariant { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    [Required]
    public int StoreId { get; set; }
}
