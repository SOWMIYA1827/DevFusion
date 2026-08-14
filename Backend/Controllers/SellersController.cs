using DevFusionAPI.Data;
using DevFusionAPI.Models.DTOs;
using DevFusionAPI.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DevFusionAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "SellerOnly")]
[Produces("application/json")]
public class SellersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SellersController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string? GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

    /// <summary>Create a storefront under the seller profile.</summary>
    [HttpPost("stores")]
    [ProducesResponseType(typeof(ApiResponse<StoreDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateStore([FromBody] StoreCreateDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<string>.Fail("User not identified."));

        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null)
        {
            seller = new Seller
            {
                UserId = userId,
                BusinessName = dto.Name + " Business",
                IsApproved = true
            };
            _context.Sellers.Add(seller);
            await _context.SaveChangesAsync();
        }

        var store = new Store
        {
            SellerId = seller.Id,
            Name = dto.Name,
            Description = dto.Description,
            LogoUrl = dto.LogoUrl,
            BannerUrl = dto.BannerUrl
        };

        _context.Stores.Add(store);
        await _context.SaveChangesAsync();

        var storeDto = new StoreDto
        {
            Id = store.Id,
            SellerId = store.SellerId,
            Name = store.Name,
            Description = store.Description,
            LogoUrl = store.LogoUrl,
            BannerUrl = store.BannerUrl
        };

        return Ok(ApiResponse<StoreDto>.Ok(storeDto, "Store created successfully."));
    }

    /// <summary>Retrieve metrics, sales performance, and low-stock alerts.</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<SellerDashboardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = GetUserId();
        var seller = await _context.Sellers.Include(s => s.Stores).FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null)
            return BadRequest(ApiResponse<string>.Fail("Seller account not found."));

        var storeIds = seller.Stores.Select(st => st.Id).ToList();

        var orderItems = await _context.OrderItems
            .Include(oi => oi.Order)
            .Where(oi => storeIds.Contains(oi.StoreId))
            .ToListAsync();

        var orders = orderItems.Select(oi => oi.Order).DistinctBy(o => o!.Id).ToList();

        var totalOrders = orders.Count;
        var pendingOrders = orders.Count(o => o!.Status == "Placed" || o.Status == "PaymentSuccessful");

        var totalRevenue = orderItems.Sum(oi => oi.Quantity * oi.UnitPrice - oi.DiscountAmount);

        var products = await _context.Products
            .Where(p => p.StoreId.HasValue && storeIds.Contains(p.StoreId.Value))
            .ToListAsync();

        var lowStockAlertsCount = products.Count(p => p.Stock <= 5);

        var topProductGroups = orderItems
            .GroupBy(oi => oi.ProductId)
            .Select(g => new { ProductId = g.Key, Revenue = g.Sum(oi => oi.Quantity * oi.UnitPrice - oi.DiscountAmount) })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        var topProductIds = topProductGroups.Select(x => x.ProductId).ToList();
        var dbTopProducts = await _context.Products
            .Where(p => topProductIds.Contains(p.Id))
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
                ShippingCharges = p.ShippingCharges
            })
            .ToListAsync();

        var productIds = products.Select(p => p.Id).ToList();
        var recentReviews = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Product)
            .Where(r => productIds.Contains(r.ProductId))
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductName = r.Product!.Title,
                UserId = r.UserId,
                UserName = r.User!.Name,
                Rating = r.Rating,
                ReviewText = r.ReviewText,
                ImageUrls = r.ImageUrls,
                SellerReply = r.SellerReply,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        var dashboard = new SellerDashboardDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            PendingOrders = pendingOrders,
            LowStockAlertsCount = lowStockAlertsCount,
            TopProducts = dbTopProducts,
            RecentReviews = recentReviews,
            MonthlyRevenue = new List<KeyValuePair<string, decimal>>
            {
                new("August 2026", totalRevenue)
            }
        };

        return Ok(ApiResponse<SellerDashboardDto>.Ok(dashboard, "Dashboard data retrieved."));
    }

    /// <summary>Create a coupon for the seller's storefront.</summary>
    [HttpPost("coupons")]
    [ProducesResponseType(typeof(ApiResponse<CouponDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCoupon([FromBody] CouponCreateDto dto)
    {
        var userId = GetUserId();
        var seller = await _context.Sellers.Include(s => s.Stores).FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null || !seller.Stores.Any())
            return BadRequest(ApiResponse<string>.Fail("Seller store required to create coupons."));

        var coupon = new Coupon
        {
            Code = dto.Code.ToUpperInvariant(),
            DiscountType = dto.DiscountType,
            Value = dto.Value,
            MaxDiscount = dto.MaxDiscount,
            MinOrderAmount = dto.MinOrderAmount,
            ExpiryDate = dto.ExpiryDate,
            MaxUsage = dto.MaxUsage,
            StoreId = dto.StoreId ?? seller.Stores.First().Id,
            CategoryId = dto.CategoryId,
            IsActive = true
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();

        var couponDto = new CouponDto
        {
            Id = coupon.Id,
            Code = coupon.Code,
            DiscountType = coupon.DiscountType,
            Value = coupon.Value,
            MaxDiscount = coupon.MaxDiscount,
            MinOrderAmount = coupon.MinOrderAmount,
            ExpiryDate = coupon.ExpiryDate,
            IsActive = coupon.IsActive,
            StoreId = coupon.StoreId,
            CategoryId = coupon.CategoryId
        };

        return Ok(ApiResponse<CouponDto>.Ok(couponDto, "Coupon created successfully."));
    }

    /// <summary>Submit a reply to a review left on seller's products.</summary>
    [HttpPost("reviews/{id}/reply")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReplyToReview(int id, [FromBody] ReviewReplyDto dto)
    {
        var userId = GetUserId();
        var seller = await _context.Sellers.Include(s => s.Stores).FirstOrDefaultAsync(s => s.UserId == userId);
        if (seller == null)
            return Unauthorized(ApiResponse<string>.Fail("Unauthorized."));

        var review = await _context.Reviews
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
            return NotFound(ApiResponse<string>.Fail("Review not found."));

        var storeIds = seller.Stores.Select(st => st.Id).ToList();
        if (!review.Product!.StoreId.HasValue || !storeIds.Contains(review.Product.StoreId.Value))
            return Forbid();

        review.SellerReply = dto.Reply;
        review.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok(dto.Reply, "Reply posted successfully."));
    }
}
