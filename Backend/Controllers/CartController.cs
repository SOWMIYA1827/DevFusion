using DevFusionAPI.Data;
using DevFusionAPI.Models.DTOs;
using DevFusionAPI.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DevFusionAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class CartController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CartController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string? GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

    /// <summary>Retrieve customer's shopping cart details, computing totals, taxes, and shipping estimates.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<CartSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCart()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var items = await _context.CartItems
            .Include(c => c.Product)
            .Include(c => c.ProductVariant)
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var cartItemsDto = items.Select(c => new CartItemDto
        {
            Id = c.Id,
            ProductId = c.ProductId,
            ProductTitle = c.Product!.Title,
            ProductImage = c.Product.Image,
            ProductPrice = c.ProductVariant != null ? c.ProductVariant.Price : c.Product.Price,
            ProductDiscount = c.Product.Discount,
            ProductVariantId = c.ProductVariantId,
            VariantInfo = c.ProductVariant != null ? $"Color: {c.ProductVariant.Color}, Size: {c.ProductVariant.Size}" : null,
            Quantity = c.Quantity,
            SaveForLater = c.SaveForLater,
            TotalPrice = (c.ProductVariant != null ? c.ProductVariant.Price : c.Product.Price) * c.Quantity
        }).ToList();

        var activeItems = cartItemsDto.Where(i => !i.SaveForLater).ToList();

        decimal subtotal = activeItems.Sum(i => i.TotalPrice);
        decimal totalDiscount = activeItems.Sum(i => i.ProductDiscount * i.Quantity);
        decimal tax = Math.Round((subtotal - totalDiscount) * 0.18m, 2); // 18% GST standard
        decimal shipping = (subtotal - totalDiscount) > 100m || !activeItems.Any() ? 0m : 10m; // Free shipping over $100
        decimal finalTotal = subtotal - totalDiscount + tax + shipping;

        var summary = new CartSummaryDto
        {
            Items = cartItemsDto,
            Subtotal = subtotal,
            TotalDiscount = totalDiscount,
            Tax = tax,
            ShippingEstimate = shipping,
            FinalTotal = finalTotal
        };

        return Ok(ApiResponse<CartSummaryDto>.Ok(summary));
    }

    /// <summary>Add a product/variant to the shopping cart.</summary>
    [HttpPost]
    public async Task<IActionResult> AddToCart([FromBody] CartItemAddDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null)
            return NotFound(ApiResponse<string>.Fail("Product not found."));

        if (dto.ProductVariantId.HasValue)
        {
            var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == dto.ProductVariantId.Value && v.ProductId == dto.ProductId);
            if (variant == null)
                return NotFound(ApiResponse<string>.Fail("Product variant not found."));
            if (variant.Stock < dto.Quantity)
                return BadRequest(ApiResponse<string>.Fail("Insufficient variant stock."));
        }
        else
        {
            if (product.Stock < dto.Quantity)
                return BadRequest(ApiResponse<string>.Fail("Insufficient product stock."));
        }

        var existing = await _context.CartItems.FirstOrDefaultAsync(c =>
            c.UserId == userId &&
            c.ProductId == dto.ProductId &&
            c.ProductVariantId == dto.ProductVariantId);

        if (existing != null)
        {
            existing.Quantity += dto.Quantity;
        }
        else
        {
            var item = new CartItem
            {
                UserId = userId,
                ProductId = dto.ProductId,
                ProductVariantId = dto.ProductVariantId,
                Quantity = dto.Quantity,
                SaveForLater = false
            };
            _context.CartItems.Add(item);
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Product added to cart."));
    }

    /// <summary>Update quantity or toggle save-for-later status.</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCartItem(int id, [FromBody] CartItemUpdateDto dto)
    {
        var userId = GetUserId();
        var item = await _context.CartItems.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (item == null) return NotFound(ApiResponse<string>.Fail("Cart item not found."));

        if (dto.Quantity > 0)
        {
            item.Quantity = dto.Quantity;
        }
        item.SaveForLater = dto.SaveForLater;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Cart item updated."));
    }

    /// <summary>Remove an item from the shopping cart.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveCartItem(int id)
    {
        var userId = GetUserId();
        var item = await _context.CartItems.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (item == null) return NotFound();

        _context.CartItems.Remove(item);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Cart item removed."));
    }

    /// <summary>Retrieve customer's wishlist.</summary>
    [HttpGet("wishlist")]
    [ProducesResponseType(typeof(ApiResponse<List<WishlistDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWishlist()
    {
        var userId = GetUserId();
        var list = await _context.WishlistItems
            .Include(w => w.Product)
            .Where(w => w.UserId == userId)
            .Select(w => new WishlistDto
            {
                Id = w.Id,
                ProductId = w.ProductId,
                ProductTitle = w.Product!.Title,
                ProductPrice = w.Product.Price,
                ProductImage = w.Product.Image
            }).ToListAsync();

        return Ok(ApiResponse<List<WishlistDto>>.Ok(list));
    }

    /// <summary>Add a product to the wishlist.</summary>
    [HttpPost("wishlist")]
    public async Task<IActionResult> AddToWishlist([FromBody] WishlistAddDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var exists = await _context.WishlistItems.AnyAsync(w => w.UserId == userId && w.ProductId == dto.ProductId);
        if (exists)
            return Ok(ApiResponse<string>.Ok(string.Empty, "Product already in wishlist."));

        var item = new WishlistItem
        {
            UserId = userId,
            ProductId = dto.ProductId
        };

        _context.WishlistItems.Add(item);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Added to wishlist."));
    }

    /// <summary>Remove a product from the wishlist.</summary>
    [HttpDelete("wishlist/{productId}")]
    public async Task<IActionResult> RemoveFromWishlist(int productId)
    {
        var userId = GetUserId();
        var item = await _context.WishlistItems.FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);
        if (item == null) return NotFound();

        _context.WishlistItems.Remove(item);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Removed from wishlist."));
    }
}
