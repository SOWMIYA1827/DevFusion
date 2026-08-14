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
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace DevFusionAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrdersController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string? GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

    // ------------------------------------------------------------
    // ADDRESSES ENDPOINTS
    // ------------------------------------------------------------

    /// <summary>Retrieve customer's saved addresses.</summary>
    [HttpGet("addresses")]
    [ProducesResponseType(typeof(ApiResponse<List<AddressDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAddresses()
    {
        var userId = GetUserId();
        var list = await _context.Addresses
            .Where(a => a.UserId == userId)
            .Select(a => new AddressDto
            {
                Id = a.Id,
                Label = a.Label,
                Type = a.Type,
                FullName = a.FullName,
                Phone = a.Phone,
                Line1 = a.Line1,
                Line2 = a.Line2,
                City = a.City,
                State = a.State,
                PostalCode = a.PostalCode,
                Country = a.Country,
                IsDefault = a.IsDefault
            }).ToListAsync();

        return Ok(ApiResponse<List<AddressDto>>.Ok(list));
    }

    /// <summary>Add a shipping/billing address.</summary>
    [HttpPost("addresses")]
    [ProducesResponseType(typeof(ApiResponse<AddressDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateAddress([FromBody] AddressCreateDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (dto.IsDefault)
        {
            var oldDefaults = await _context.Addresses.Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
            foreach (var od in oldDefaults) od.IsDefault = false;
        }

        var addr = new Address
        {
            UserId = userId,
            Label = dto.Label,
            Type = dto.Type,
            FullName = dto.FullName,
            Phone = dto.Phone,
            Line1 = dto.Line1,
            Line2 = dto.Line2,
            City = dto.City,
            State = dto.State,
            PostalCode = dto.PostalCode,
            Country = dto.Country,
            IsDefault = dto.IsDefault
        };

        _context.Addresses.Add(addr);
        await _context.SaveChangesAsync();

        var res = new AddressDto
        {
            Id = addr.Id,
            Label = addr.Label,
            Type = addr.Type,
            FullName = addr.FullName,
            Phone = addr.Phone,
            Line1 = addr.Line1,
            Line2 = addr.Line2,
            City = addr.City,
            State = addr.State,
            PostalCode = addr.PostalCode,
            Country = addr.Country,
            IsDefault = addr.IsDefault
        };

        return Ok(ApiResponse<AddressDto>.Ok(res, "Address added successfully."));
    }

    /// <summary>Remove address.</summary>
    [HttpDelete("addresses/{id}")]
    public async Task<IActionResult> DeleteAddress(string id)
    {
        var userId = GetUserId();
        var addr = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (addr == null) return NotFound();

        _context.Addresses.Remove(addr);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Address deleted."));
    }

    // ------------------------------------------------------------
    // ORDERS ENDPOINTS
    // ------------------------------------------------------------

    /// <summary>Submit order details, process payment summary, apply coupons and deplete stock.</summary>
    [HttpPost("checkout")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var cartItems = await _context.CartItems
            .Include(c => c.Product)
            .Include(c => c.ProductVariant)
            .Where(c => c.UserId == userId && !c.SaveForLater)
            .ToListAsync();

        if (!cartItems.Any())
            return BadRequest(ApiResponse<string>.Fail("Your cart is empty."));

        // Validate Addresses
        var shipping = await _context.Addresses.AnyAsync(a => a.Id == dto.ShippingAddressId && a.UserId == userId);
        var billing = await _context.Addresses.AnyAsync(a => a.Id == dto.BillingAddressId && a.UserId == userId);
        if (!shipping || !billing)
            return BadRequest(ApiResponse<string>.Fail("Invalid shipping or billing address."));

        // Stock depletion / prevent overselling
        foreach (var item in cartItems)
        {
            if (item.ProductVariantId.HasValue)
            {
                var variant = item.ProductVariant;
                if (variant == null || variant.Stock < item.Quantity)
                    return BadRequest(ApiResponse<string>.Fail($"Product variant {variant?.SKU} is out of stock."));
                variant.Stock -= item.Quantity;
            }
            else
            {
                var product = item.Product;
                if (product == null || product.Stock < item.Quantity)
                    return BadRequest(ApiResponse<string>.Fail($"Product {product?.Title} is out of stock."));
                product.Stock -= item.Quantity;
            }
        }

        decimal subtotal = cartItems.Sum(c => (c.ProductVariant != null ? c.ProductVariant.Price : c.Product!.Price) * c.Quantity);
        decimal discount = cartItems.Sum(c => c.Product!.Discount * c.Quantity);

        // Apply coupon
        decimal couponDiscount = 0m;
        if (!string.IsNullOrEmpty(dto.CouponCode))
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(cp => cp.Code == dto.CouponCode.ToUpperInvariant() && cp.IsActive);
            if (coupon != null && coupon.ExpiryDate > DateTime.UtcNow)
            {
                if (coupon.MinOrderAmount == null || subtotal >= coupon.MinOrderAmount.Value)
                {
                    if (coupon.DiscountType == "Percentage")
                    {
                        couponDiscount = (subtotal - discount) * (coupon.Value / 100m);
                        if (coupon.MaxDiscount.HasValue && couponDiscount > coupon.MaxDiscount.Value)
                            couponDiscount = coupon.MaxDiscount.Value;
                    }
                    else if (coupon.DiscountType == "Flat")
                    {
                        couponDiscount = coupon.Value;
                    }

                    coupon.UsageCount++;
                }
            }
        }

        decimal tax = Math.Round((subtotal - discount - couponDiscount) * 0.18m, 2);
        decimal shippingCharges = (subtotal - discount - couponDiscount) > 100m ? 0m : 10m;
        decimal finalAmount = subtotal - discount - couponDiscount + tax + shippingCharges;

        // Create Order
        var order = new Order
        {
            UserId = userId,
            OrderDate = DateTime.UtcNow,
            TotalAmount = subtotal,
            DiscountAmount = discount + couponDiscount,
            TaxAmount = tax,
            ShippingCharges = shippingCharges,
            FinalAmount = finalAmount,
            Status = dto.PaymentMethod == "CashOnDelivery" ? "Placed" : "PaymentSuccessful",
            PaymentMethod = dto.PaymentMethod,
            PaymentStatus = dto.PaymentMethod == "CashOnDelivery" ? "Pending" : "Success",
            ShippingAddressId = dto.ShippingAddressId,
            BillingAddressId = dto.BillingAddressId,
            OTP = new Random().Next(1000, 9999).ToString(), // OTP delivery verification
            EstimatedDeliveryDate = DateTime.UtcNow.AddDays(5)
        };

        // Add tracking timeline
        var timeline = new List<TrackingTimelineEventDto>
        {
            new() { Status = "Placed", Timestamp = DateTime.UtcNow, Detail = "Order successfully created." }
        };
        if (order.Status == "PaymentSuccessful")
        {
            timeline.Add(new TrackingTimelineEventDto { Status = "PaymentSuccessful", Timestamp = DateTime.UtcNow, Detail = "Payment processed successfully via " + dto.PaymentMethod });
        }
        order.TrackingTimeline = JsonSerializer.Serialize(timeline);

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        // Create Order Items
        var orderItems = cartItems.Select(c => new OrderItem
        {
            OrderId = order.Id,
            ProductId = c.ProductId,
            ProductVariantId = c.ProductVariantId,
            Quantity = c.Quantity,
            UnitPrice = c.ProductVariant != null ? c.ProductVariant.Price : c.Product!.Price,
            DiscountAmount = c.Product!.Discount,
            StoreId = c.Product.StoreId ?? 1
        }).ToList();

        _context.OrderItems.AddRange(orderItems);

        // Record transaction
        var payment = new Payment
        {
            OrderId = order.Id,
            TransactionId = "TXN_" + Guid.NewGuid().ToString()[..8].ToUpper(),
            PaymentMethod = dto.PaymentMethod,
            Amount = finalAmount,
            Status = order.PaymentStatus,
            WebhookVerified = true
        };
        _context.Payments.Add(payment);

        // Add low stock notifications
        foreach (var item in cartItems)
        {
            var product = item.Product;
            if (product != null && product.Stock <= 5)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = userId,
                    Title = "Low Stock Alert",
                    Message = $"Product {product.Title} is running low on stock ({product.Stock} remaining).",
                    Type = "PriceDrop"
                });
            }
        }

        // Clear Cart
        _context.CartItems.RemoveRange(cartItems);
        await _context.SaveChangesAsync();

        var res = new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,
            DiscountAmount = order.DiscountAmount,
            TaxAmount = order.TaxAmount,
            ShippingCharges = order.ShippingCharges,
            FinalAmount = order.FinalAmount,
            Status = order.Status,
            PaymentMethod = order.PaymentMethod,
            PaymentStatus = order.PaymentStatus,
            EstimatedDeliveryDate = order.EstimatedDeliveryDate,
            TrackingTimeline = timeline
        };

        return Ok(ApiResponse<OrderDto>.Ok(res, "Order placed successfully. Your delivery verification OTP is: " + order.OTP));
    }

    /// <summary>Retrieve all orders placed by the current customer, or all orders containing items from the current seller's store.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrders()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound(ApiResponse<string>.Fail("User not found."));

        List<Order> orders;
        if (user.Role!.Name == "seller")
        {
            var seller = await _context.Sellers.Include(s => s.Stores).FirstOrDefaultAsync(s => s.UserId == userId);
            if (seller == null) return BadRequest(ApiResponse<string>.Fail("Seller profile missing."));
            var storeIds = seller.Stores.Select(st => st.Id).ToList();

            orders = await _context.Orders
                .Include(o => o.OrderItems)
                .Where(o => o.OrderItems.Any(oi => storeIds.Contains(oi.StoreId)))
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }
        else if (user.Role.Name == "delivery_partner")
        {
            orders = await _context.Orders
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }
        else // customer / admin
        {
            orders = await _context.Orders
                .Include(o => o.OrderItems)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        var list = orders.Select(order => {
            var timeline = string.IsNullOrEmpty(order.TrackingTimeline) 
                ? new List<TrackingTimelineEventDto>()
                : JsonSerializer.Deserialize<List<TrackingTimelineEventDto>>(order.TrackingTimeline);

            return new OrderDto
            {
                Id = order.Id,
                UserId = order.UserId,
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                DiscountAmount = order.DiscountAmount,
                TaxAmount = order.TaxAmount,
                ShippingCharges = order.ShippingCharges,
                FinalAmount = order.FinalAmount,
                Status = order.Status,
                PaymentMethod = order.PaymentMethod,
                PaymentStatus = order.PaymentStatus,
                EstimatedDeliveryDate = order.EstimatedDeliveryDate,
                CourierPartner = order.CourierPartner,
                TrackingNumber = order.TrackingNumber,
                TrackingTimeline = timeline ?? new List<TrackingTimelineEventDto>()
            };
        }).ToList();

        return Ok(ApiResponse<List<OrderDto>>.Ok(list));
    }

    /// <summary>Retrieve detailed state and courier timeline of an order.</summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrder(string id)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound(ApiResponse<string>.Fail("Order not found."));

        var timeline = string.IsNullOrEmpty(order.TrackingTimeline) 
            ? new List<TrackingTimelineEventDto>()
            : JsonSerializer.Deserialize<List<TrackingTimelineEventDto>>(order.TrackingTimeline);

        var dto = new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,
            DiscountAmount = order.DiscountAmount,
            TaxAmount = order.TaxAmount,
            ShippingCharges = order.ShippingCharges,
            FinalAmount = order.FinalAmount,
            Status = order.Status,
            PaymentMethod = order.PaymentMethod,
            PaymentStatus = order.PaymentStatus,
            EstimatedDeliveryDate = order.EstimatedDeliveryDate,
            CourierPartner = order.CourierPartner,
            TrackingNumber = order.TrackingNumber,
            TrackingTimeline = timeline ?? new List<TrackingTimelineEventDto>()
        };

        return Ok(ApiResponse<OrderDto>.Ok(dto));
    }

    /// <summary>Progress tracking status: Placed -> Accepted -> Packed -> Shipped -> OutForDelivery -> Delivered.</summary>
    [HttpPut("{id}/status")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] OrderStatusUpdateDto dto)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(ApiResponse<string>.Fail("Order not found."));

        order.Status = dto.Status;
        order.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(dto.CourierPartner)) order.CourierPartner = dto.CourierPartner;
        if (!string.IsNullOrEmpty(dto.TrackingNumber)) order.TrackingNumber = dto.TrackingNumber;
        if (!string.IsNullOrEmpty(dto.EstimatedDeliveryDays) && int.TryParse(dto.EstimatedDeliveryDays, out var days))
        {
            order.EstimatedDeliveryDate = DateTime.UtcNow.AddDays(days);
        }

        var timeline = string.IsNullOrEmpty(order.TrackingTimeline)
            ? new List<TrackingTimelineEventDto>()
            : JsonSerializer.Deserialize<List<TrackingTimelineEventDto>>(order.TrackingTimeline) ?? new();

        timeline.Add(new TrackingTimelineEventDto
        {
            Status = dto.Status,
            Timestamp = DateTime.UtcNow,
            Detail = $"Status updated to {dto.Status}."
        });

        order.TrackingTimeline = JsonSerializer.Serialize(timeline);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok(order.Status, "Order status updated successfully."));
    }

    /// <summary>Cancel order before shipment.</summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(string id)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        if (order.Status == "Shipped" || order.Status == "OutForDelivery" || order.Status == "Delivered" || order.Status == "Completed")
            return BadRequest(ApiResponse<string>.Fail("Order cannot be cancelled after shipment."));

        order.Status = "Cancelled";
        order.UpdatedAt = DateTime.UtcNow;

        var timeline = string.IsNullOrEmpty(order.TrackingTimeline)
            ? new List<TrackingTimelineEventDto>()
            : JsonSerializer.Deserialize<List<TrackingTimelineEventDto>>(order.TrackingTimeline) ?? new();

        timeline.Add(new TrackingTimelineEventDto { Status = "Cancelled", Timestamp = DateTime.UtcNow, Detail = "Order was cancelled by the user." });
        order.TrackingTimeline = JsonSerializer.Serialize(timeline);

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Order cancelled."));
    }

    /// <summary>Verify delivery using the OTP provided to the customer.</summary>
    [HttpPost("{id}/verify-delivery")]
    public async Task<IActionResult> VerifyDelivery(string id, [FromQuery] string otp)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        if (order.OTP != otp)
            return BadRequest(ApiResponse<string>.Fail("Invalid delivery verification OTP."));

        order.Status = "Completed";
        order.PaymentStatus = "Success";
        order.UpdatedAt = DateTime.UtcNow;

        var timeline = string.IsNullOrEmpty(order.TrackingTimeline)
            ? new List<TrackingTimelineEventDto>()
            : JsonSerializer.Deserialize<List<TrackingTimelineEventDto>>(order.TrackingTimeline) ?? new();

        timeline.Add(new TrackingTimelineEventDto { Status = "Completed", Timestamp = DateTime.UtcNow, Detail = "Delivery completed and verified via OTP." });
        order.TrackingTimeline = JsonSerializer.Serialize(timeline);

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok(string.Empty, "Delivery verified and order completed."));
    }

    /// <summary>Retrieve downloadable HTML/Text formatted invoice details.</summary>
    [HttpGet("{id}/invoice")]
    public async Task<IActionResult> DownloadInvoice(string id)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound();

        var sb = new StringBuilder();
        sb.AppendLine("==================================================");
        sb.AppendLine("                 NEXSHOP INVOICE                  ");
        sb.AppendLine("==================================================");
        sb.AppendLine($"Order ID: {order.Id}");
        sb.AppendLine($"Date:     {order.OrderDate:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"Status:   {order.Status}");
        sb.AppendLine($"Payment:  {order.PaymentMethod} ({order.PaymentStatus})");
        sb.AppendLine("--------------------------------------------------");
        sb.AppendLine("Items:");
        foreach (var item in order.OrderItems)
        {
            sb.AppendLine($"- Product ID {item.ProductId}: Qty {item.Quantity} @ {item.UnitPrice:C}");
        }
        sb.AppendLine("--------------------------------------------------");
        sb.AppendLine($"Subtotal:  {order.TotalAmount:C}");
        sb.AppendLine($"Discount: -{order.DiscountAmount:C}");
        sb.AppendLine($"Tax (18%): {order.TaxAmount:C}");
        sb.AppendLine($"Shipping:  {order.ShippingCharges:C}");
        sb.AppendLine($"Total:     {order.FinalAmount:C}");
        sb.AppendLine("==================================================");

        var fileBytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(fileBytes, "text/plain", $"Invoice_{order.Id}.txt");
    }
}
