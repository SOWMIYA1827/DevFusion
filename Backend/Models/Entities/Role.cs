namespace DevFusionAPI.Models.Entities;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // customer | seller | admin | delivery_partner
    public string? Description { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
}
