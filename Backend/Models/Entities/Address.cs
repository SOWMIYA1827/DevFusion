using System.ComponentModel.DataAnnotations;

namespace DevFusionAPI.Models.Entities;

public class Address
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }

    [MaxLength(50)]
    public string? Label { get; set; } // e.g. "Home", "Office"

    [Required]
    public string Type { get; set; } = "both"; // shipping, billing, both

    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string Line1 { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Line2 { get; set; }

    [Required, MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string State { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string PostalCode { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Country { get; set; } = "India";

    public bool IsDefault { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
