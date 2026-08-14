using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DevFusionAPI.Models.Entities;

[Table("inventory")]
public class Inventory
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int? ProductId { get; set; }
    public Product? Product { get; set; }

    public int? ProductVariantId { get; set; }
    public ProductVariant? ProductVariant { get; set; }

    [Required]
    public int StockLevel { get; set; } = 0;

    [Required]
    public int ReorderLevel { get; set; } = 5;

    [MaxLength(100)]
    public string? Location { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
