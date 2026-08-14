using DevFusionAPI.Models.DTOs;

namespace DevFusionAPI.Services;

public interface IAuthService
{
    Task<ApiResponse<string>> RegisterAsync(RegisterDto dto);
    Task<ApiResponse<string>> VerifyEmailAsync(string token);
    Task<ApiResponse<string>> ResendVerificationAsync(string email);
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto);
    Task<ApiResponse<string>> ForgotPasswordAsync(string email);
    Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordDto dto);
    Task<ApiResponse<string>> VerifyEmailExistsAsync(string email);
    Task<ApiResponse<AuthResponseDto>> ResetPasswordDirectAsync(DirectResetPasswordDto dto);
}
