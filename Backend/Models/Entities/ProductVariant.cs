using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DevFusionAPI.Models.Entities;

[Table("product_variants")]
public class ProductVariant
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    [MaxLength(50)]
    public string? Size { get; set; }

    [MaxLength(50)]
    public string? Color { get; set; }

    [MaxLength(50)]
    public string? Storage { get; set; }

    [MaxLength(50)]
    public string? RAM { get; set; }

    [MaxLength(100)]
    public string? Material { get; set; }

    public string? CustomOptions { get; set; }

    [Required]
    public int Stock { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [MaxLength(100)]
    public string? SKU { get; set; }
}
