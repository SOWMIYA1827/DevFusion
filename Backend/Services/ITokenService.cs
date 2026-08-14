using DevFusionAPI.Models.Entities;

namespace DevFusionAPI.Services;

public interface ITokenService
{
    (string token, DateTime expiresAt) GenerateAccessToken(User user, string roleName);
}
