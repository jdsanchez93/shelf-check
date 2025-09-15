using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GroceryPriceApi.Data;
using GroceryPriceApi.Models;

namespace GroceryPriceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PricesController : ControllerBase
{
    private readonly GroceryContext _context;
    private readonly ILogger<PricesController> _logger;

    public PricesController(GroceryContext context, ILogger<PricesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("compare")]
    public async Task<ActionResult> ComparePrices([FromQuery] int productId, [FromQuery] List<int>? storeIds = null)
    {
        var query = _context.Prices
            .Include(p => p.Store)
            .Where(p => p.ProductId == productId && p.ValidFrom <= DateTime.UtcNow && p.ValidTo >= DateTime.UtcNow);

        if (storeIds != null && storeIds.Any())
        {
            query = query.Where(p => storeIds.Contains(p.StoreId));
        }

        var prices = await query.ToListAsync();

        var comparison = prices.Select(p => new
        {
            StoreId = p.StoreId,
            StoreName = p.Store.Name,
            RegularPrice = p.RegularPrice,
            SalePrice = p.SalePrice,
            CurrentPrice = p.SalePrice ?? p.RegularPrice,
            PromotionType = p.PromotionType,
            PromotionDetails = p.PromotionDetails,
            ValidFrom = p.ValidFrom,
            ValidTo = p.ValidTo
        }).OrderBy(p => p.CurrentPrice);

        return Ok(comparison);
    }

    [HttpGet("history")]
    public async Task<ActionResult> GetPriceHistory([FromQuery] int productId, [FromQuery] int storeId, [FromQuery] int days = 30)
    {
        var startDate = DateTime.UtcNow.AddDays(-days);

        var prices = await _context.Prices
            .Where(p => p.ProductId == productId && p.StoreId == storeId && p.ScrapedAt >= startDate)
            .OrderBy(p => p.ScrapedAt)
            .Select(p => new
            {
                Date = p.ScrapedAt,
                RegularPrice = p.RegularPrice,
                SalePrice = p.SalePrice,
                CurrentPrice = p.SalePrice ?? p.RegularPrice,
                PromotionType = p.PromotionType
            })
            .ToListAsync();

        return Ok(prices);
    }

    [HttpGet("deals")]
    public async Task<ActionResult> GetDeals([FromQuery] int? storeId = null, [FromQuery] string? category = null)
    {
        var query = _context.Prices
            .Include(p => p.Product)
            .Include(p => p.Store)
            .Where(p => p.SalePrice != null && p.ValidFrom <= DateTime.UtcNow && p.ValidTo >= DateTime.UtcNow);

        if (storeId.HasValue)
        {
            query = query.Where(p => p.StoreId == storeId.Value);
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(p => p.Product.Category == category);
        }

        var deals = await query
            .Select(p => new
            {
                ProductId = p.ProductId,
                ProductName = p.Product.Name,
                Brand = p.Product.Brand,
                Category = p.Product.Category,
                StoreId = p.StoreId,
                StoreName = p.Store.Name,
                RegularPrice = p.RegularPrice,
                SalePrice = p.SalePrice,
                Discount = Math.Round(((p.RegularPrice - p.SalePrice!.Value) / p.RegularPrice) * 100, 0),
                PromotionType = p.PromotionType,
                PromotionDetails = p.PromotionDetails,
                ValidUntil = p.ValidTo
            })
            .OrderByDescending(p => p.Discount)
            .Take(50)
            .ToListAsync();

        return Ok(deals);
    }

    [HttpPost]
    public async Task<ActionResult<Price>> CreatePrice(Price price)
    {
        price.CreatedAt = DateTime.UtcNow;
        price.ScrapedAt = DateTime.UtcNow;

        _context.Prices.Add(price);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPrice), new { id = price.Id }, price);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Price>> GetPrice(int id)
    {
        var price = await _context.Prices
            .Include(p => p.Product)
            .Include(p => p.Store)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (price == null)
        {
            return NotFound();
        }

        return price;
    }
}