using System.Security.Cryptography;
using DevFusionAPI.Models.DTOs;
using DevFusionAPI.Models.Entities;
using DevFusionAPI.Repositories;

namespace DevFusionAPI.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public AuthService(
        IUserRepository userRepository,
        IEmailService emailService,
        ITokenService tokenService,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _emailService = emailService;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    // ------------------------------------------------------------
    // REGISTER  (Customer or Seller — separate registration by role)
    // ------------------------------------------------------------
    public async Task<ApiResponse<string>> RegisterAsync(RegisterDto dto)
    {
        var existing = await _userRepository.GetByEmailAsync(dto.Email);
        if (existing != null)
        {
            return ApiResponse<string>.Fail("An account with this email already exists.");
        }

        var allowedRoles = new[] { "customer", "seller" };
        var roleName = dto.Role.ToLowerInvariant();
        if (!allowedRoles.Contains(roleName))
        {
            return ApiResponse<string>.Fail("Role must be 'customer' or 'seller'.");
        }

        var role = await _userRepository.GetRoleByNameAsync(roleName);
        if (role == null)
        {
            return ApiResponse<string>.Fail("Configured role not found. Seed roles table first.");
        }

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email.Trim().ToLowerInvariant(),
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            AuthProvider = "email",
            RoleId = role.Id,
            IsEmailVerified = false,
            IsActive = true
        };

        await _userRepository.AddUserAsync(user);
        await _userRepository.SaveChangesAsync();

        await IssueVerificationTokenAndSendEmailAsync(user);

        return ApiResponse<string>.Ok(user.Id, "Registration successful. Please check your email to verify your account.");
    }

    // ------------------------------------------------------------
    // EMAIL VERIFICATION
    // ------------------------------------------------------------
    public async Task<ApiResponse<string>> VerifyEmailAsync(string token)
    {
        var verificationToken = await _userRepository.GetValidVerificationTokenAsync(token);
        if (verificationToken == null || verificationToken.User == null)
        {
            return ApiResponse<string>.Fail("Verification link is invalid or has expired.");
        }

        verificationToken.User.IsEmailVerified = true;
        verificationToken.User.UpdatedAt = DateTime.UtcNow;
        verificationToken.IsUsed = true;

        await _userRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok(verificationToken.UserId, "Email verified successfully. You can now log in.");
    }

    public async Task<ApiResponse<string>> ResendVerificationAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            // Don't reveal whether the email exists
            return ApiResponse<string>.Ok(string.Empty, "If that account exists, a verification email has been sent.");
        }

        if (user.IsEmailVerified)
        {
            return ApiResponse<string>.Fail("This email is already verified.");
        }

        await IssueVerificationTokenAndSendEmailAsync(user);
        return ApiResponse<string>.Ok(string.Empty, "Verification email sent.");
    }

    private async Task IssueVerificationTokenAndSendEmailAsync(User user)
    {
        var token = GenerateUrlSafeToken();

        await _userRepository.AddEmailVerificationTokenAsync(new EmailVerificationToken
        {
            UserId = user.Id,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        });
        await _userRepository.SaveChangesAsync();

        var baseUrl = _configuration["AppUrl:FrontendBaseUrl"];
        var path = _configuration["AppUrl:EmailVerificationPath"];
        var verificationLink = $"{baseUrl}{path}?token={token}";

        await _emailService.SendVerificationEmailAsync(user.Email, user.Name, verificationLink);
    }

    // ------------------------------------------------------------
    // LOGIN
    // ------------------------------------------------------------
    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email.Trim().ToLowerInvariant());
        if (user == null || user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return ApiResponse<AuthResponseDto>.Fail("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            return ApiResponse<AuthResponseDto>.Fail("This account has been deactivated.");
        }

        // Seller-specific gate: email must be verified before accessing seller features.
        if (user.Role?.Name == "seller" && !user.IsEmailVerified)
        {
            return ApiResponse<AuthResponseDto>.Fail("Please verify your email before accessing seller features.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userRepository.SaveChangesAsync();

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, user.Role!.Name);

        var response = new AuthResponseDto
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.Name,
            IsEmailVerified = user.IsEmailVerified,
            AccessToken = accessToken,
            ExpiresAt = expiresAt
        };

        return ApiResponse<AuthResponseDto>.Ok(response, "Login successful.");
    }

    // ------------------------------------------------------------
    // FORGOT / RESET PASSWORD
    // ------------------------------------------------------------
    public async Task<ApiResponse<string>> ForgotPasswordAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            return ApiResponse<string>.Ok(string.Empty, "If that account exists, a reset link has been sent.");
        }

        var rawToken = GenerateUrlSafeToken();
        var tokenHash = HashToken(rawToken);

        await _userRepository.AddPasswordResetTokenAsync(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        });
        await _userRepository.SaveChangesAsync();

        var baseUrl = _configuration["AppUrl:FrontendBaseUrl"];
        var path = _configuration["AppUrl:PasswordResetPath"];
        var resetLink = $"{baseUrl}{path}?token={rawToken}";

        await _emailService.SendPasswordResetEmailAsync(user.Email, user.Name, resetLink);

        return ApiResponse<string>.Ok(string.Empty, "If that account exists, a reset link has been sent.");
    }

    public async Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var tokenHash = HashToken(dto.Token);
        var resetToken = await _userRepository.GetValidPasswordResetTokenAsync(tokenHash);

        if (resetToken == null || resetToken.User == null)
        {
            return ApiResponse<string>.Fail("Reset link is invalid or has expired.");
        }

        resetToken.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        resetToken.User.UpdatedAt = DateTime.UtcNow;
        resetToken.UsedAt = DateTime.UtcNow;

        await _userRepository.SaveChangesAsync();

        return ApiResponse<string>.Ok(string.Empty, "Password reset successfully. You can now log in.");
    }

    public async Task<ApiResponse<string>> VerifyEmailExistsAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email.Trim().ToLowerInvariant());
        if (user == null)
        {
            return ApiResponse<string>.Fail("No account was found with this email address.");
        }
        return ApiResponse<string>.Ok(user.Email, "Email verified.");
    }

    public async Task<ApiResponse<AuthResponseDto>> ResetPasswordDirectAsync(DirectResetPasswordDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email.Trim().ToLowerInvariant());
        if (user == null)
        {
            return ApiResponse<AuthResponseDto>.Fail("User not found.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.LastLoginAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.SaveChangesAsync();

        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, user.Role!.Name);

        var response = new AuthResponseDto
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.Name,
            IsEmailVerified = user.IsEmailVerified,
            AccessToken = accessToken,
            ExpiresAt = expiresAt
        };

        return ApiResponse<AuthResponseDto>.Ok(response, "Password reset and logged in successfully.");
    }

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    private static string GenerateUrlSafeToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }

    private static string HashToken(string token)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
