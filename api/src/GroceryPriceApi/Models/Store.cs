namespace GroceryPriceApi.Models;

public class Store
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Price> Prices { get; set; } = new List<Price>();
}