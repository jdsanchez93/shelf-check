namespace GroceryPriceApi.Models;

public class Price
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int StoreId { get; set; }
    public decimal RegularPrice { get; set; }
    public decimal? SalePrice { get; set; }
    public string? PromotionType { get; set; }
    public string? PromotionDetails { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public DateTime ScrapedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Product Product { get; set; } = null!;
    public Store Store { get; set; } = null!;
}