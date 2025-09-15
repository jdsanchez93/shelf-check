using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GroceryPriceApi.Data;
using GroceryPriceApi.Models;

namespace GroceryPriceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoresController : ControllerBase
{
    private readonly GroceryContext _context;
    private readonly ILogger<StoresController> _logger;

    public StoresController(GroceryContext context, ILogger<StoresController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Store>>> GetStores()
    {
        return await _context.Stores.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Store>> GetStore(int id)
    {
        var store = await _context.Stores.FindAsync(id);

        if (store == null)
        {
            return NotFound();
        }

        return store;
    }

    [HttpPost]
    public async Task<ActionResult<Store>> CreateStore(Store store)
    {
        store.CreatedAt = DateTime.UtcNow;
        store.UpdatedAt = DateTime.UtcNow;

        _context.Stores.Add(store);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetStore), new { id = store.Id }, store);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStore(int id, Store store)
    {
        if (id != store.Id)
        {
            return BadRequest();
        }

        store.UpdatedAt = DateTime.UtcNow;
        _context.Entry(store).State = EntityState.Modified;
        _context.Entry(store).Property(s => s.CreatedAt).IsModified = false;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await StoreExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStore(int id)
    {
        var store = await _context.Stores.FindAsync(id);
        if (store == null)
        {
            return NotFound();
        }

        _context.Stores.Remove(store);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> StoreExists(int id)
    {
        return await _context.Stores.AnyAsync(e => e.Id == id);
    }
}