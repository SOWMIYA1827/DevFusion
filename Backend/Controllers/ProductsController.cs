using DevFusionAPI.Data;
using DevFusionAPI.Models.DTOs;
using DevFusionAPI.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace DevFusionAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProductsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string? GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

    /// <summary>Browse, search and filter products with paging and sorting.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<List<ProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? brand,
        [FromQuery] int? storeId,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int? minRating,
        [FromQuery] bool? onlyAvailable,
        [FromQuery] string? color,
        [FromQuery] string? size,
        [FromQuery] string? sortBy = "latest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Products
            .Include(p => p.Variants)
            .Include(p => p.Reviews)
            .AsQueryable();

        // Filters
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => p.Title.ToLower().Contains(searchLower) ||
                                     p.Brand!.ToLower().Contains(searchLower) ||
                                     p.Description.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(p => p.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrEmpty(brand))
        {
            query = query.Where(p => p.Brand!.ToLower() == brand.ToLower());
        }

        if (storeId.HasValue)
        {
            query = query.Where(p => p.StoreId == storeId);
        }

        if (minPrice.HasValue)
        {
            query = query.Where(p => p.Price >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(p => p.Price <= maxPrice.Value);
        }

        if (onlyAvailable.HasValue && onlyAvailable.Value)
        {
            query = query.Where(p => p.Stock > 0 || p.Variants.Any(v => v.Stock > 0));
        }

        if (!string.IsNullOrEmpty(color))
        {
            query = query.Where(p => p.Variants.Any(v => v.Color!.ToLower() == color.ToLower()));
        }

        if (!string.IsNullOrEmpty(size))
        {
            query = query.Where(p => p.Variants.Any(v => v.Size!.ToLower() == size.ToLower()));
        }

        var results = await query.ToListAsync();

        // Rating filter (done in-memory to simplify AverageRating calculation)
        if (minRating.HasValue)
        {
            results = results.Where(p => (p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0) >= minRating.Value).ToList();
        }

        // Sorting
        results = sortBy?.ToLower() switch
        {
            "price_asc" => results.OrderBy(p => p.Price).ToList(),
            "price_desc" => results.OrderByDescending(p => p.Price).ToList(),
            "rating" => results.OrderByDescending(p => p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0).ToList(),
            "popularity" => results.OrderByDescending(p => p.Reviews.Count).ToList(),
            "best_selling" => results.OrderByDescending(p => p.Stock).ToList(), // mock proxy
            _ => results.OrderByDescending(p => p.CreatedAt).ToList()
        };

        // Paging
        var total = results.Count;
        var pagedList = results
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Title = p.Title,
                Price = p.Price,
                Description = p.Description,
                Category = p.Category,
                Image = p.Image,
                StoreId = p.StoreId,
                CategoryId = p.CategoryId,
                Brand = p.Brand,
                SKU = p.SKU,
                Barcode = p.Barcode,
                Discount = p.Discount,
                Stock = p.Stock,
                Weight = p.Weight,
                Dimensions = p.Dimensions,
                ShippingCharges = p.ShippingCharges,
                AverageRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0,
                Variants = p.Variants.Select(v => new ProductVariantDto
                {
                    Id = v.Id,
                    ProductId = v.ProductId,
                    Size = v.Size,
                    Color = v.Color,
                    Storage = v.Storage,
                    RAM = v.RAM,
                    Material = v.Material,
                    CustomOptions = v.CustomOptions,
                    Stock = v.Stock,
                    Price = v.Price,
                    SKU = v.SKU
                }).ToList()
            })
            .ToList();

        return Ok(ApiResponse<List<ProductDto>>.Ok(pagedList, $"Found {total} products."));
    }

    /// <summary>Retrieve detailed information of a single product.</summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _context.Products
            .Include(p => p.Variants)
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p == null)
            return NotFound(ApiResponse<string>.Fail("Product not found."));

        var dto = new ProductDto
        {
            Id = p.Id,
            Title = p.Title,
            Price = p.Price,
            Description = p.Description,
            Category = p.Category,
            Image = p.Image,
            StoreId = p.StoreId,
            CategoryId = p.CategoryId,
            Brand = p.Brand,
            SKU = p.SKU,
            Barcode = p.Barcode,
            Discount = p.Discount,
            Stock = p.Stock,
            Weight = p.Weight,
            Dimensions = p.Dimensions,
            ShippingCharges = p.ShippingCharges,
            AverageRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0,
            Variants = p.Variants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                ProductId = v.ProductId,
                Size = v.Size,
                Color = v.Color,
                Storage = v.Storage,
                RAM = v.RAM,
                Material = v.Material,
                CustomOptions = v.CustomOptions,
                Stock = v.Stock,
                Price = v.Price,
                SKU = v.SKU
            }).ToList()
        };

        return Ok(ApiResponse<ProductDto>.Ok(dto));
    }

    /// <summary>Create a product under the seller's storefront.</summary>
    [HttpPost]
    [Authorize(Policy = "SellerOnly")]
    [ProducesResponseType(typeof(ApiResponse<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
    {
        var userId = GetUserId();
        var seller = await _context.Sellers.Include(s => s.Stores).FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null || !seller.Stores.Any())
            return BadRequest(ApiResponse<string>.Fail("Seller account or store setup missing."));

        var storeId = dto.StoreId ?? seller.Stores.First().Id;

        var product = new Product
        {
            Title = dto.Title,
            Price = dto.Price,
            Description = dto.Description,
            Category = dto.Category,
            Image = dto.Image,
            StoreId = storeId,
            CategoryId = dto.CategoryId,
            Brand = dto.Brand,
            SKU = dto.SKU,
            Barcode = dto.Barcode,
            Discount = dto.Discount,
            Stock = dto.Stock,
            Weight = dto.Weight,
            Dimensions = dto.Dimensions,
            ShippingCharges = dto.ShippingCharges
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Automatically configure stock in inventory ledger
        var inventory = new Inventory
        {
            ProductId = product.Id,
            StockLevel = product.Stock,
            ReorderLevel = 5,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Inventories.Add(inventory);
        await _context.SaveChangesAsync();

        var resDto = new ProductDto
        {
            Id = product.Id,
            Title = product.Title,
            Price = product.Price,
            Description = product.Description,
            Category = product.Category,
            Image = product.Image,
            StoreId = product.StoreId,
            CategoryId = product.CategoryId,
            Brand = product.Brand,
            SKU = product.SKU,
            Barcode = product.Barcode,
            Discount = product.Discount,
            Stock = product.Stock,
            Weight = product.Weight,
            Dimensions = product.Dimensions,
            ShippingCharges = product.ShippingCharges
        };

        return Ok(ApiResponse<ProductDto>.Ok(resDto, "Product created successfully."));
    }

    /// <summary>Update an existing product's specifications.</summary>
    [HttpPut("{id}")]
    [Authorize(Policy = "SellerOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductCreateDto dto)
    {
        var p = await _context.Products.FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();

        p.Title = dto.Title;
        p.Price = dto.Price;
        p.Description = dto.Description;
        p.Category = dto.Category;
        p.Image = dto.Image;
        p.Brand = dto.Brand;
        p.SKU = dto.SKU;
        p.Barcode = dto.Barcode;
        p.Discount = dto.Discount;
        p.Stock = dto.Stock;
        p.Weight = dto.Weight;
        p.Dimensions = dto.Dimensions;
        p.ShippingCharges = dto.ShippingCharges;
        p.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Product updated successfully."));
    }

    /// <summary>Remove a product from catalog.</summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "SellerOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _context.Products.FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();

        _context.Products.Remove(p);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Product deleted successfully."));
    }

    /// <summary>Create a product variant (e.g. Size, Color, Stock) for a product.</summary>
    [HttpPost("{id}/variants")]
    [Authorize(Policy = "SellerOnly")]
    public async Task<IActionResult> CreateVariant(int id, [FromBody] ProductVariantCreateDto dto)
    {
        var p = await _context.Products.FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound(ApiResponse<string>.Fail("Product not found."));

        var variant = new ProductVariant
        {
            ProductId = id,
            Size = dto.Size,
            Color = dto.Color,
            Storage = dto.Storage,
            RAM = dto.RAM,
            Material = dto.Material,
            CustomOptions = dto.CustomOptions,
            Stock = dto.Stock,
            Price = dto.Price,
            SKU = dto.SKU
        };

        _context.ProductVariants.Add(variant);
        await _context.SaveChangesAsync();

        var inventory = new Inventory
        {
            ProductId = id,
            ProductVariantId = variant.Id,
            StockLevel = variant.Stock,
            ReorderLevel = 5,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Inventories.Add(inventory);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok(string.Empty, "Variant created successfully."));
    }

    /// <summary>Fetch all product categories.</summary>
    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories()
    {
        var list = await _context.Categories
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl
            }).ToListAsync();
        return Ok(ApiResponse<List<CategoryDto>>.Ok(list));
    }

    /// <summary>Admin only: Create new categories dynamically.</summary>
    [HttpPost("categories")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryCreateDto dto)
    {
        var cat = new Category
        {
            Name = dto.Name,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl
        };
        _context.Categories.Add(cat);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Category created successfully."));
    }

    /// <summary>Bulk upload products using raw CSV data format.</summary>
    [HttpPost("bulk-import")]
    [Authorize(Policy = "SellerOnly")]
    public async Task<IActionResult> BulkImport(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("Please upload a valid CSV file."));

        var userId = GetUserId();
        var seller = await _context.Sellers.Include(s => s.Stores).FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null || !seller.Stores.Any())
            return BadRequest(ApiResponse<string>.Fail("Seller storefront profile is required."));

        var storeId = seller.Stores.First().Id;
        var list = new List<Product>();

        using (var reader = new StreamReader(file.OpenReadStream()))
        {
            var header = await reader.ReadLineAsync(); // skip headers
            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrEmpty(line)) continue;

                var columns = line.Split(',');
                if (columns.Length < 3) continue;

                // Expected fields: Title, Price, Description, Category, Image, Brand, SKU, Stock
                var title = columns[0].Trim();
                decimal.TryParse(columns[1], out var price);
                var desc = columns.Length > 2 ? columns[2].Trim() : "";
                var catName = columns.Length > 3 ? columns[3].Trim() : "General";
                var image = columns.Length > 4 ? columns[4].Trim() : "";
                var brand = columns.Length > 5 ? columns[5].Trim() : "";
                var sku = columns.Length > 6 ? columns[6].Trim() : "";
                int.TryParse(columns.Length > 7 ? columns[7] : "10", out var stock);

                list.Add(new Product
                {
                    Title = title,
                    Price = price,
                    Description = desc,
                    Category = catName,
                    Image = image,
                    StoreId = storeId,
                    Brand = brand,
                    SKU = sku,
                    Stock = stock
                });
            }
        }

        if (list.Any())
        {
            _context.Products.AddRange(list);
            await _context.SaveChangesAsync();

            var inventories = list.Select(p => new Inventory
            {
                ProductId = p.Id,
                StockLevel = p.Stock,
                ReorderLevel = 5
            }).ToList();
            _context.Inventories.AddRange(inventories);
            await _context.SaveChangesAsync();
        }

        return Ok(ApiResponse<string>.Ok(string.Empty, $"Successfully imported {list.Count} products."));
    }
}
