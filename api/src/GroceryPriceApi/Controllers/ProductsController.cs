using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GroceryPriceApi.Data;
using GroceryPriceApi.Models;

namespace GroceryPriceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly GroceryContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(GroceryContext context, ILogger<ProductsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetProducts([FromQuery] string? category = null, [FromQuery] string? search = null)
    {
        var query = _context.Products.AsQueryable();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(p => p.Category == category);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => p.Name.Contains(search) || (p.Brand != null && p.Brand.Contains(search)));
        }

        return await query.Take(100).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);

        if (product == null)
        {
            return NotFound();
        }

        return product;
    }

    [HttpPost]
    public async Task<ActionResult<Product>> CreateProduct(Product product)
    {
        product.CreatedAt = DateTime.UtcNow;
        product.UpdatedAt = DateTime.UtcNow;

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, Product product)
    {
        if (id != product.Id)
        {
            return BadRequest();
        }

        product.UpdatedAt = DateTime.UtcNow;
        _context.Entry(product).State = EntityState.Modified;
        _context.Entry(product).Property(p => p.CreatedAt).IsModified = false;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await ProductExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> ProductExists(int id)
    {
        return await _context.Products.AnyAsync(e => e.Id == id);
    }
}