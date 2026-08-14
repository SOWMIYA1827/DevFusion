using DevFusionAPI.Data;
using DevFusionAPI.Models.DTOs;
using DevFusionAPI.Models.Entities;
using DevFusionAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DevFusionAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthController(IAuthService authService, ApplicationDbContext context, ITokenService tokenService)
    {
        _authService = authService;
        _context = context;
        _tokenService = tokenService;
    }

    private string? GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

    /// <summary>Register a new Customer or Seller account. Sends a verification email.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Verify email using the token sent to the user's inbox.</summary>
    [HttpGet("verify-email")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        var result = await _authService.VerifyEmailAsync(token);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Resend the verification email.</summary>
    [HttpPost("resend-verification")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationDto dto)
    {
        var result = await _authService.ResendVerificationAsync(dto.Email);
        return Ok(result);
    }

    /// <summary>Log in with email + password. Seller accounts must be verified first. Stores Refresh Token in HttpOnly cookie.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (!result.Success || result.Data == null)
            return Unauthorized(result);

        var refreshToken = new RefreshToken
        {
            UserId = result.Data.UserId,
            Token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        Response.Cookies.Append("refreshToken", refreshToken.Token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = refreshToken.ExpiresAt
        });

        var finalResponse = new
        {
            user = result.Data,
            refreshToken = refreshToken.Token
        };

        return Ok(ApiResponse<object>.Ok(finalResponse, "Login successful."));
    }

    /// <summary>Rotate the expired Access Token using the stored Session Refresh Token.</summary>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken()
    {
        var token = Request.Cookies["refreshToken"] ?? Request.Headers["X-Refresh-Token"].ToString();
        if (string.IsNullOrEmpty(token))
            return BadRequest(ApiResponse<string>.Fail("Refresh token is required."));

        var dbToken = await _context.RefreshTokens
            .Include(t => t.User)
            .ThenInclude(u => u!.Role)
            .FirstOrDefaultAsync(t => t.Token == token && t.RevokedAt == null);

        if (dbToken == null || dbToken.IsExpired)
            return BadRequest(ApiResponse<string>.Fail("Invalid or expired refresh token."));

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(dbToken.User!, dbToken.User!.Role!.Name);

        var newRefreshToken = new RefreshToken
        {
            UserId = dbToken.UserId,
            Token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        dbToken.RevokedAt = DateTime.UtcNow;
        dbToken.ReplacedByToken = newRefreshToken.Token;

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync();

        Response.Cookies.Append("refreshToken", newRefreshToken.Token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = newRefreshToken.ExpiresAt
        });

        var res = new
        {
            accessToken,
            expiresAt,
            refreshToken = newRefreshToken.Token
        };

        return Ok(ApiResponse<object>.Ok(res, "Token refreshed successfully."));
    }

    /// <summary>Revoke the current session refresh token.</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var token = Request.Cookies["refreshToken"] ?? Request.Headers["X-Refresh-Token"].ToString();
        if (!string.IsNullOrEmpty(token))
        {
            var dbToken = await _context.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);
            if (dbToken != null)
            {
                dbToken.RevokedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        Response.Cookies.Delete("refreshToken");
        return Ok(ApiResponse<string>.Ok(string.Empty, "Logged out successfully."));
    }

    /// <summary>Revoke all active sessions for the user across all devices.</summary>
    [HttpPost("logout-all")]
    [Authorize]
    public async Task<IActionResult> LogoutAllDevices()
    {
        var userId = GetUserId();
        var activeTokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync();

        foreach (var t in activeTokens)
        {
            t.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        Response.Cookies.Delete("refreshToken");

        return Ok(ApiResponse<string>.Ok(string.Empty, "Logged out from all devices."));
    }

    /// <summary>Mock endpoint for Google Sign-In verification.</summary>
    [HttpPost("google-login")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        var email = "google_user@test.com";
        var name = "Google User";
        var googleId = "google_123456789";

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email || u.GoogleId == googleId);

        if (user == null)
        {
            var role = await _context.Roles.FirstAsync(r => r.Name == "customer");
            user = new User
            {
                Name = name,
                Email = email,
                GoogleId = googleId,
                AuthProvider = "google",
                RoleId = role.Id,
                IsEmailVerified = true
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, user.Role!.Name);

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        Response.Cookies.Append("refreshToken", refreshToken.Token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = refreshToken.ExpiresAt
        });

        var res = new
        {
            accessToken,
            expiresAt,
            refreshToken = refreshToken.Token,
            user = new
            {
                userId = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role.Name,
                isEmailVerified = user.IsEmailVerified
            }
        };

        return Ok(ApiResponse<object>.Ok(res, "Google login successful."));
    }

    /// <summary>Request a password reset link via email.</summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var result = await _authService.ForgotPasswordAsync(dto.Email);
        return Ok(result);
    }

    /// <summary>Reset password using the token from the reset email.</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var result = await _authService.ResetPasswordAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Verify if an email exists in the system.</summary>
    [HttpPost("verify-email-exists")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmailExists([FromBody] ForgotPasswordDto dto)
    {
        var result = await _authService.VerifyEmailExistsAsync(dto.Email);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Directly reset password and log in.</summary>
    [HttpPost("reset-password-direct")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPasswordDirect([FromBody] DirectResetPasswordDto dto)
    {
        var result = await _authService.ResetPasswordDirectAsync(dto);
        if (!result.Success || result.Data == null)
            return BadRequest(result);

        var refreshToken = new RefreshToken
        {
            UserId = result.Data.UserId,
            Token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        Response.Cookies.Append("refreshToken", refreshToken.Token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = refreshToken.ExpiresAt
        });

        var finalResponse = new
        {
            user = result.Data,
            refreshToken = refreshToken.Token
        };

        return Ok(ApiResponse<object>.Ok(finalResponse, "Password reset and logged in successfully."));
    }

    /// <summary>Endpoint for mock OAuth (Google & GitHub) Login and Registration.</summary>
    [HttpPost("oauth-login")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> OAuthLogin([FromBody] OAuthLoginDto dto)
    {
        var provider = dto.Provider.ToLowerInvariant();
        if (provider != "google" && provider != "github")
        {
            return BadRequest(ApiResponse<object>.Fail("Invalid provider. Supported: google, github"));
        }

        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email || (provider == "google" && u.GoogleId == dto.ProviderId));

        if (user == null)
        {
            var roleName = dto.Role.ToLowerInvariant();
            if (roleName != "customer" && roleName != "seller")
            {
                roleName = "customer";
            }
            var role = await _context.Roles.FirstAsync(r => r.Name == roleName);
            user = new User
            {
                Name = dto.Name,
                Email = email,
                GoogleId = provider == "google" ? dto.ProviderId : null,
                AuthProvider = provider,
                RoleId = role.Id,
                IsEmailVerified = true,
                IsActive = true
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Reload user with role
            user = await _context.Users.Include(u => u.Role).FirstAsync(u => u.Id == user.Id);
        }

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, user.Role!.Name);

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64)),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        Response.Cookies.Append("refreshToken", refreshToken.Token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = refreshToken.ExpiresAt
        });

        var res = new
        {
            accessToken,
            expiresAt,
            refreshToken = refreshToken.Token,
            user = new
            {
                userId = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role.Name,
                isEmailVerified = user.IsEmailVerified
            }
        };

        return Ok(ApiResponse<object>.Ok(res, $"{dto.Provider} login successful."));
    }
}
