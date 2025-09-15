using Microsoft.EntityFrameworkCore;
using GroceryPriceApi.Models;

namespace GroceryPriceApi.Data;

public class GroceryContext : DbContext
{
    public GroceryContext(DbContextOptions<GroceryContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<Store> Stores { get; set; } = null!;
    public DbSet<Price> Prices { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Brand).HasMaxLength(100);
            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.Unit).HasMaxLength(50);
            entity.Property(e => e.Size).HasMaxLength(50);
            entity.Property(e => e.Barcode).HasMaxLength(50);
            entity.HasIndex(e => e.Barcode);
            entity.HasIndex(e => e.Category);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<Store>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Location).HasMaxLength(100);
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.HasIndex(e => e.Name);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<Price>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RegularPrice).HasPrecision(10, 2);
            entity.Property(e => e.SalePrice).HasPrecision(10, 2);
            entity.Property(e => e.PromotionType).HasMaxLength(50);
            entity.Property(e => e.PromotionDetails).HasMaxLength(255);
            entity.HasIndex(e => new { e.ProductId, e.StoreId, e.ValidFrom });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Product)
                .WithMany(p => p.Prices)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Store)
                .WithMany(s => s.Prices)
                .HasForeignKey(e => e.StoreId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}