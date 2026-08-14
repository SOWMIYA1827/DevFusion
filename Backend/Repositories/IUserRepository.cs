using DevFusionAPI.Models.Entities;

namespace DevFusionAPI.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(string id);
    Task<Role?> GetRoleByNameAsync(string name);
    Task AddUserAsync(User user);
    Task AddEmailVerificationTokenAsync(EmailVerificationToken token);
    Task<EmailVerificationToken?> GetValidVerificationTokenAsync(string token);
    Task AddPasswordResetTokenAsync(PasswordResetToken token);
    Task<PasswordResetToken?> GetValidPasswordResetTokenAsync(string tokenHash);
    Task SaveChangesAsync();
}
