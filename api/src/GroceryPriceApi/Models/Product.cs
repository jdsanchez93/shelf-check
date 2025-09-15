namespace GroceryPriceApi.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public string? Size { get; set; }
    public string? Barcode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Price> Prices { get; set; } = new List<Price>();
}