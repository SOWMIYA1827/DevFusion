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
[Produces("application/json")]
public class ReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReviewsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string? GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

    /// <summary>Submit customer review, ratings and optional image links for a product.</summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateReview([FromBody] ReviewCreateDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var product = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
        if (!product)
            return NotFound(ApiResponse<string>.Fail("Product not found."));

        var review = new Review
        {
            ProductId = dto.ProductId,
            UserId = userId,
            Rating = dto.Rating,
            ReviewText = dto.ReviewText,
            ImageUrls = dto.ImageUrls,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

        var res = new ReviewDto
        {
            Id = review.Id,
            ProductId = review.ProductId,
            UserId = review.UserId,
            UserName = user?.Name ?? "Anonymous",
            Rating = review.Rating,
            ReviewText = review.ReviewText,
            ImageUrls = review.ImageUrls,
            CreatedAt = review.CreatedAt
        };

        return Ok(ApiResponse<ReviewDto>.Ok(res, "Review added successfully."));
    }

    /// <summary>Retrieve all reviews posted on a product.</summary>
    [HttpGet("product/{productId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<List<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductReviews(int productId)
    {
        var list = await _context.Reviews
            .Include(r => r.User)
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                UserId = r.UserId,
                UserName = r.User!.Name,
                Rating = r.Rating,
                ReviewText = r.ReviewText,
                ImageUrls = r.ImageUrls,
                SellerReply = r.SellerReply,
                CreatedAt = r.CreatedAt
            }).ToListAsync();

        return Ok(ApiResponse<List<ReviewDto>>.Ok(list));
    }
}
