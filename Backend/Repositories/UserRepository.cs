using DevFusionAPI.Data;
using DevFusionAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DevFusionAPI.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<User?> GetByEmailAsync(string email) =>
        _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == email);

    public Task<User?> GetByIdAsync(string id) =>
        _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);

    public Task<Role?> GetRoleByNameAsync(string name) =>
        _context.Roles.FirstOrDefaultAsync(r => r.Name == name);

    public async Task AddUserAsync(User user) => await _context.Users.AddAsync(user);

    public async Task AddEmailVerificationTokenAsync(EmailVerificationToken token) =>
        await _context.EmailVerificationTokens.AddAsync(token);

    public Task<EmailVerificationToken?> GetValidVerificationTokenAsync(string token) =>
        _context.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

    public async Task AddPasswordResetTokenAsync(PasswordResetToken token) =>
        await _context.PasswordResetTokens.AddAsync(token);

    public Task<PasswordResetToken?> GetValidPasswordResetTokenAsync(string tokenHash) =>
        _context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow);

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}
