using DevFusionAPI.Data;
using DevFusionAPI.Models.DTOs;
using DevFusionAPI.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DevFusionAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
[Produces("application/json")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Retrieve all registered users.</summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<List<User>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers()
    {
        var list = await _context.Users.Include(u => u.Role).ToListAsync();
        return Ok(ApiResponse<List<User>>.Ok(list));
    }

    /// <summary>Toggle a user's active status (deactivate/activate account).</summary>
    [HttpPut("users/{id}/status")]
    public async Task<IActionResult> ToggleUserStatus(string id, [FromQuery] bool active)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        user.IsActive = active;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok(string.Empty, $"User account status set to active = {active}."));
    }

    /// <summary>Retrieve all seller profiles.</summary>
    [HttpGet("sellers")]
    [ProducesResponseType(typeof(ApiResponse<List<Seller>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSellers()
    {
        var list = await _context.Sellers.Include(s => s.User).ToListAsync();
        return Ok(ApiResponse<List<Seller>>.Ok(list));
    }

    /// <summary>Approve/Reject a seller's business registration request.</summary>
    [HttpPut("sellers/{id}/approve")]
    public async Task<IActionResult> ApproveSeller(string id, [FromQuery] bool approve)
    {
        var seller = await _context.Sellers.FirstOrDefaultAsync(s => s.Id == id);
        if (seller == null) return NotFound();

        seller.IsApproved = approve;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok(string.Empty, $"Seller approval status set to {approve}."));
    }

    /// <summary>Browse all marketplace orders.</summary>
    [HttpGet("orders")]
    [ProducesResponseType(typeof(ApiResponse<List<Order>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllOrders()
    {
        var list = await _context.Orders
            .Include(o => o.User)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();
        return Ok(ApiResponse<List<Order>>.Ok(list));
    }

    /// <summary>Query system activity audit logs.</summary>
    [HttpGet("activity-logs")]
    [ProducesResponseType(typeof(ApiResponse<List<ActivityLog>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActivityLogs()
    {
        var list = await _context.ActivityLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(100)
            .ToListAsync();
        return Ok(ApiResponse<List<ActivityLog>>.Ok(list));
    }

    /// <summary>Retrieve system-wide settings.</summary>
    [HttpGet("settings")]
    [ProducesResponseType(typeof(ApiResponse<List<Setting>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings()
    {
        var list = await _context.Settings.ToListAsync();
        return Ok(ApiResponse<List<Setting>>.Ok(list));
    }

    /// <summary>Save or update a platform setting configuration.</summary>
    [HttpPost("settings")]
    public async Task<IActionResult> SetSetting([FromQuery] string key, [FromQuery] string value, [FromQuery] string group = "General")
    {
        var setting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting != null)
        {
            setting.Value = value;
        }
        else
        {
            setting = new Setting { Key = key, Value = value, Group = group };
            _context.Settings.Add(setting);
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Setting updated."));
    }
}
